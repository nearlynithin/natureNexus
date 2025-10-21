// @ts-check
import { createServer } from "http";
import db from "./db/conn.js";
import express from "express";
import ws, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { haversine } from "./haversine.js";
/** @typedef {import('../types.d.ts').User} User */

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const port = process.env.SERVER_PORT;
const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (client) => {
  console.log("Client connected");
  client.on("message", (msg) => {
    console.log(`message received : ${msg}`);
    broadcast(msg);
  });
});

function broadcast(msg) {
  for (const client of wss.clients) {
    if (client.readyState === ws.OPEN) {
      client.send(msg.toString());
    }
  }
}

app.get("/users", async (_, res) => {
  const rawResults = await db.collection("users").find({}).limit(50).toArray();
  /** @type {User[]} */
  const results = rawResults.map((r) => ({
    _id: r._id.toString(),
    name: r.name,
    address: r.address,
    phone: r.phone,
  }));
  res.send(results).status;
});

app.post("/users", async (req, res) => {
  /** @type {User}*/
  const user = req.body;
  await db.collection("users").insertOne({
    name: user.name,
    address: user.address,
    phone: user.phone.toString(),
  });
  res.status(201).send("User added");
});

app.post("/location", async (req, res) => {
  const { phone, latitude, longitude } = req.body;
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

app.get("/nearby/:phone", async (req, res) => {
  const phone = req.params.phone.toString();
  const users = db.collection("users");
  const currentUser = await users.findOne({ phone });
  if (!currentUser) {
    res.status(404).send("User not found");
    return;
  }

  const allUsers = await users.find({}).toArray();
  const nearby = allUsers.filter((u) => {
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
    return dist / 1000 < 6; // 6 kms
  });

  res.json(nearby);
});

server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
