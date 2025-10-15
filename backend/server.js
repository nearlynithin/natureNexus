import { createServer } from "http";
import db from "./db/conn.js";
import express from "express";
import ws, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const port = process.env.SERVER_PORT;
const app = express();

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

app.get("/", async (_, res) => {
  let coll = db.collection("users");
  let results = await coll.find({}).limit(50).toArray();
  res.send(results).status;
});

server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
