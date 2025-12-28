import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WsHub } from "./ws-hub.js";
import { setupRoutes } from "./http-routes.js";

const PORT = Number(process.env.PORT ?? 8787);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

const distRoot = path.resolve(__dirname, "..");
const server = http.createServer(app);
const wsHub = new WsHub(server);

setupRoutes(app, wsHub, distRoot);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n[Overlay WS Server] Started`);
  console.log(`  HTTP+WS: http://127.0.0.1:${PORT}`);
  console.log(`  POST events: http://127.0.0.1:${PORT}/event`);
  console.log(`  Dashboard: http://127.0.0.1:${PORT}/dashboard`);
  console.log(`  Serving from: ${distRoot}\n`);
});

server.on("error", (err: any) => {
  console.error(
    "[Overlay WS Server] server.listen error:",
    err.code,
    err.message
  );
});
