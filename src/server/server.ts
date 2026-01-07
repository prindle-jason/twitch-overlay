import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WsHub } from "./ws-hub.js";
import { setupRoutes } from "./http-routes.js";
import { logger } from "../utils/logger.js";

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
  logger.info(`\n[Overlay WS Server] Started`);
  logger.info(`  HTTP+WS: http://127.0.0.1:${PORT}`);
  logger.info(`  POST events: http://127.0.0.1:${PORT}/event`);
  logger.info(`  Dashboard: http://127.0.0.1:${PORT}/dashboard`);
  logger.info(`  Serving from: ${distRoot}\n`);
});

server.on("error", (err: any) => {
  logger.error(
    "[Overlay WS Server] server.listen error:",
    err.code,
    err.message
  );
});
