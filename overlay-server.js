// overlay-server.js
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const PORT = 8787;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

// Serve static files (overlay)
app.use(express.static(__dirname));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let clientIdSeq = 0;
const clients = new Map();

wss.on("connection", (ws, req) => {
  const id = ++clientIdSeq;
  clients.set(id, ws);
  console.log(`[WS] client #${id} connected from ${req.socket.remoteAddress}`);

  ws.on("close", () => {
    clients.delete(id);
    console.log(`[WS] client #${id} disconnected`);
  });
});

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  let sent = 0;
  for (const [id, ws] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
      sent++;
    }
  }
  console.log(`[BROADCAST] sent to ${sent} client(s):`, payload);
}

app.get("/", (_req, res) => {
  res.json({ ok: true, wsClients: clients.size });
});

app.post("/event", (req, res) => {
  const body = req.body ?? {};
  if (!body.type) {
    return res.status(400).json({ error: "Missing 'type' field" });
  }
  
  // Special logging for ticker events
  if (body.type === "ticker") {
    // Extract actual ticker message by removing command prefix
    let tickerMessage = body.message || body.rawInput || '';
    if (tickerMessage.toLowerCase().startsWith('!ticker ')) {
      tickerMessage = tickerMessage.substring(8); // Remove "!ticker "
    }
    
    console.log(`[TICKER EVENT] Received ticker data:`);
    console.log(`  - Full Message: "${body.message}"`);
    console.log(`  - Ticker Message: "${tickerMessage}"`);
    console.log(`  - User: ${body.user} (Display: ${body.displayName})`);
    console.log(`  - Roles: Mod=${body.isModerator}, VIP=${body.isVip}, Broadcaster=${body.isBroadcaster}`);
    console.log(`  - Emote Count: ${body.emoteCount}`);
    console.log(`  - Emote Only: ${body.emoteOnly}`);
    console.log(`  - Emotes Data: ${JSON.stringify(body.emotes || [])}`);
    console.log(`  - Full payload:`, JSON.stringify(body, null, 2));
    
    // Add the cleaned message to the payload before broadcasting
    body.cleanMessage = tickerMessage;
  }
  
  // Special logging for debug events
  if (body.type === "debug") {
    console.log(`[DEBUG EVENT] All Streamer.bot variables:`);
    console.log(JSON.stringify(body, null, 2));
  }
  
  broadcast({ ...body, ts: Date.now() });
  res.json({ ok: true, broadcasted: true });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Overlay server up: HTTP+WS on http://127.0.0.1:${PORT}`);
  console.log(`POST events to http://127.0.0.1:${PORT}/event`);
  console.log(`Overlay files served from: ${__dirname}`);
});
server.on("error", (err) => {
  console.error("[Overlay Server] server.listen error:", err.code, err.message);
});
