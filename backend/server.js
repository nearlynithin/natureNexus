const { createServer } = require("http");
const express = require("express");
const ws = require("ws");
const { WebSocketServer } = ws;

const port = 3000;
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

server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
