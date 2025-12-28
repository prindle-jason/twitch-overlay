import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.WS_PORT || 8787);
const PATH = process.env.WS_PATH || "/overlay-ws";

const server = createServer((req, res) => {
  // Basic health endpoint
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, path: PATH });

wss.on("connection", (ws, req) => {
  const addr = req.socket.remoteAddress;
  console.log(`[WS] connected from ${addr}`);
  ws.send(JSON.stringify({ type: "hello", msg: "ws up" }));

  ws.on("message", (data) => {
    console.log(`[WS] message from ${addr}:`, data.toString());
  });

  ws.on("close", (code, reason) => {
    console.log(
      `[WS] closed from ${addr} (code: ${code}, reason: ${reason || "none"})`
    );
  });

  ws.on("error", (err) => {
    console.log(`[WS] error from ${addr}:`, err.message);
  });
});

server.listen(PORT, () => {
  console.log(`[WS] listening on http://localhost:${PORT}${PATH}`);
});
