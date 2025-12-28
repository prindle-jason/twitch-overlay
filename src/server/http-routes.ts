import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { WsHub } from "./ws-hub.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupRoutes(app: Express, wsHub: WsHub, distRoot: string) {
  // Serve Vite build output from dist root
  app.use(express.static(distRoot));

  app.get("/", (_req, res) => {
    const stats = wsHub.getStats();
    res.json({
      ok: true,
      wsClients: stats.total,
      overlayClients: stats.overlay,
      dashboardClients: stats.dashboard,
    });
  });

  app.get("/dashboard", (_req, res) => {
    res.sendFile(path.join(__dirname, "../../public/dashboard.html"));
  });

  app.post("/event", (req, res) => {
    const body = (req.body ?? {}) as any;
    if (!body.type) {
      return res.status(400).json({ error: "Missing 'type' field" });
    }

    wsHub.broadcast(body);
    res.json({ ok: true, broadcasted: true });
  });
}
