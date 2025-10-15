// @ts-check
import { createServer } from "http";
import db from "./db/conn.js";
import express from "express";
import ws, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
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
    phone: user.phone,
  });
  res.status(201).send("User added");
});

server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
