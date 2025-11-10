// @ts-check
import { createServer } from "http";
import db from "./db/conn.js";
import express from "express";
import multer from "multer";
import ws, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { haversine } from "./haversine.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import { ObjectId } from "mongodb";
import { detectObjectsInImage } from "./image.js";

/** @typedef {import('../types.d.ts').User} User */

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const port = process.env.SERVER_PORT;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const app = express();
const upload = multer({ dest: "uploads/" });

// Enable CORS
app.use(cors());

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Store connected clients with their user info
const connectedClients = new Map();

wss.on("connection", (client, req) => {
  console.log("Client connected");

  client.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      // Handle authentication
      if (data.type === "auth") {
        const { token } = data;
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          connectedClients.set(client, {
            userId: decoded.userId,
            phone: decoded.phone,
            role: decoded.role,
            name: decoded.name,
          });
          client.send(JSON.stringify({ type: "auth", success: true }));
          console.log(`User authenticated: ${decoded.name} (${decoded.role})`);
        } catch (error) {
          client.send(
            JSON.stringify({
              type: "auth",
              success: false,
              error: "Invalid token",
            }),
          );
        }
      }

      // Handle messages
      else if (data.type === "message") {
        const senderInfo = connectedClients.get(client);
        if (!senderInfo) {
          client.send(
            JSON.stringify({ type: "error", message: "Not authenticated" }),
          );
          return;
        }

        // For broadcast messages from regular users, require approval
        const needsApproval = !data.recipientId && senderInfo.role === "user";

        // Save message to database
        const messageDoc = {
          senderId: senderInfo.userId,
          senderName: senderInfo.name,
          senderRole: senderInfo.role,
          recipientId: data.recipientId || null,
          content: data.content,
          timestamp: new Date(),
          isGroupMessage: !data.recipientId,
          status: needsApproval ? "pending" : "approved",
        };

        const result = await db.collection("messages").insertOne(messageDoc);

        const messagePayload = {
          type: "message",
          messageId: result.insertedId.toString(),
          senderId: senderInfo.userId,
          senderName: senderInfo.name,
          senderRole: senderInfo.role,
          recipientId: data.recipientId || null,
          content: data.content,
          timestamp: new Date().toISOString(),
          status: messageDoc.status,
        };

        // Send to specific recipient or broadcast
        if (data.recipientId) {
          // Direct message - send immediately
          for (const [wsClient, userInfo] of connectedClients.entries()) {
            if (userInfo.userId === data.recipientId || wsClient === client) {
              if (wsClient.readyState === ws.OPEN) {
                wsClient.send(JSON.stringify(messagePayload));
              }
            }
          }
        } else if (needsApproval) {
          // Broadcast from user - send to admins for approval
          for (const [wsClient, userInfo] of connectedClients.entries()) {
            if (userInfo.role === "admin" && wsClient.readyState === ws.OPEN) {
              wsClient.send(JSON.stringify(messagePayload));
            }
          }
        } else {
          // Broadcast from admin - send to everyone
          broadcast(JSON.stringify(messagePayload));
        }
      }

      // Handle message approval
      else if (data.type === "approve_message") {
        const senderInfo = connectedClients.get(client);
        if (!senderInfo || senderInfo.role !== "admin") {
          client.send(
            JSON.stringify({ type: "error", message: "Not authorized" }),
          );
          return;
        }

        const message = await db
          .collection("messages")
          .findOneAndUpdate(
            { _id: new ObjectId(data.messageId) },
            { $set: { status: "approved" } },
            { returnDocument: "after" },
          );

        if (message) {
          const approvalPayload = {
            type: "message_approved",
            messageId: data.messageId,
            message: {
              senderId: message.senderId,
              senderName: message.senderName,
              senderRole: message.senderRole,
              content: message.content,
              timestamp: message.timestamp.toISOString(),
              recipientId: null,
              status: "approved",
            },
          };
          broadcast(JSON.stringify(approvalPayload));
        }
      }

      // Handle message rejection
      else if (data.type === "reject_message") {
        const senderInfo = connectedClients.get(client);
        if (!senderInfo || senderInfo.role !== "admin") {
          client.send(
            JSON.stringify({ type: "error", message: "Not authorized" }),
          );
          return;
        }

        await db
          .collection("messages")
          .findOneAndUpdate(
            { _id: new ObjectId(data.messageId) },
            { $set: { status: "rejected" } },
          );

        broadcast(
          JSON.stringify({
            type: "message_rejected",
            messageId: data.messageId,
          }),
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  client.on("close", () => {
    const userInfo = connectedClients.get(client);
    if (userInfo) {
      console.log(`User disconnected: ${userInfo.name}`);
      connectedClients.delete(client);
    }
  });
});

function broadcast(msg) {
  for (const client of wss.clients) {
    if (client.readyState === ws.OPEN) {
      client.send(msg);
    }
  }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Register new user
app.post("/auth/register", async (req, res) => {
  try {
    const { name, phone, address, password, role = "user" } = req.body;

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.collection("users").insertOne({
      name,
      phone: phone.toString(),
      address,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "user",
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user
    const user = await db
      .collection("users")
      .findOne({ phone: phone.toString() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        phone: user.phone,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get all users (admin only)
app.get("/users", authenticateToken, requireAdmin, async (_, res) => {
  const rawResults = await db.collection("users").find({}).limit(50).toArray();
  const results = rawResults.map((r) => ({
    _id: r._id.toString(),
    name: r.name,
    address: r.address,
    phone: r.phone,
    role: r.role,
    createdAt: r.createdAt,
  }));
  res.json(results);
});

// Get current user's profile
app.get("/users/me", authenticateToken, async (req, res) => {
  try {
    const user = await db.collection("users").findOne({
      phone: req.user.phone,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update location (authenticated users)
app.post("/location", authenticateToken, async (req, res) => {
  const { latitude, longitude } = req.body;
  const phone = req.user.phone;

  const users = db.collection("users");
  const result = await users.findOneAndUpdate(
    { phone },
    { $set: { latitude, longitude } },
    { returnDocument: "after" },
  );

  if (!result) {
    return res.status(404).send("User not found");
  }

  res.status(200).json(result);
});

// Get nearby users (authenticated users)
app.get("/nearby", authenticateToken, async (req, res) => {
  const phone = req.user.phone;
  const users = db.collection("users");

  const currentUser = await users.findOne({ phone });
  if (!currentUser) {
    res.status(404).send("User not found");
    return;
  }

  const allUsers = await users.find({}).toArray();
  const nearby = allUsers
    .filter((u) => {
      if (
        currentUser.phone == u.phone ||
        u.latitude == null ||
        u.longitude == null
      )
        return false;
      const dist = haversine(
        currentUser.latitude,
        currentUser.longitude,
        u.latitude,
        u.longitude,
      );
      return dist / 1000 < 6;
    })
    .map((u) => ({
      id: u._id.toString(),
      name: u.name,
      phone: u.phone,
      role: u.role,
    }));

  res.json(nearby);
});

// Get message history
app.get("/messages", authenticateToken, async (req, res) => {
  try {
    const { recipientId } = req.query;
    const userId = req.user.userId;

    let query;
    if (recipientId) {
      // Get direct messages between two users
      query = {
        $or: [
          { senderId: userId, recipientId },
          { senderId: recipientId, recipientId: userId },
        ],
      };
    } else {
      // Get approved broadcast messages or user's own messages
      query = {
        $or: [
          { isGroupMessage: true, status: "approved" },
          { senderId: userId },
          { recipientId: userId },
        ],
      };
    }

    const messages = await db
      .collection("messages")
      .find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get pending messages (admin only)
app.get(
  "/messages/pending",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const messages = await db
        .collection("messages")
        .find({ status: "pending", isGroupMessage: true })
        .sort({ timestamp: -1 })
        .toArray();

      res.json(messages);
    } catch (error) {
      console.error("Error fetching pending messages:", error);
      res.status(500).json({ error: "Failed to fetch pending messages" });
    }
  },
);

// Approve message (admin only)
app.post(
  "/messages/:id/approve",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const messageId = req.params.id;

      const result = await db
        .collection("messages")
        .findOneAndUpdate(
          { _id: new ObjectId(messageId) },
          { $set: { status: "approved" } },
          { returnDocument: "after" },
        );

      if (!result) {
        return res.status(404).json({ error: "Message not found" });
      }

      res.json({ success: true, message: result });
    } catch (error) {
      console.error("Error approving message:", error);
      res.status(500).json({ error: "Failed to approve message" });
    }
  },
);

// Reject message (admin only)
app.post(
  "/messages/:id/reject",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const messageId = req.params.id;

      const result = await db
        .collection("messages")
        .findOneAndUpdate(
          { _id: new ObjectId(messageId) },
          { $set: { status: "rejected" } },
          { returnDocument: "after" },
        );

      if (!result) {
        return res.status(404).json({ error: "Message not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting message:", error);
      res.status(500).json({ error: "Failed to reject message" });
    }
  },
);

// Get list of users to chat with
app.get("/chat/users", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const users = await db
      .collection("users")
      .find({ _id: { $ne: currentUserId } })
      .project({ password: 0 })
      .toArray();

    res.json(
      users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        phone: u.phone,
        role: u.role,
      })),
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Image object Detection
app.post("/detect", upload.single("image"), async (req, res) => {
  try {
    console.log("Sending image ...");
    const result = await detectObjectsInImage(req.file.path);
    // return     { label: b.label, box: [absX1, absY1, absX2, absY2] };
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
