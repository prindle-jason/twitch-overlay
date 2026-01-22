import express, { Express } from "express";
import path from "path";
import fetch from "node-fetch";
import { WebSocketManager } from "./WebSocketManager.js";
import type { WsMessage } from "../types/ws-messages.js";

export function setupRoutes(
  app: Express,
  wsHub: WebSocketManager,
  distRoot: string,
) {
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
    // Serve built dashboard.html from dist
    res.sendFile(path.join(distRoot, "dashboard.html"));
  });

  app.post("/event", (req, res) => {
    const body = (req.body ?? {}) as WsMessage;
    if (!body.type) {
      return res.status(400).json({
        error: "Missing 'type' field",
        hint: "Expected format: { type: 'pool-event', poolType: '...', payload?: {} } or { type: 'scene-event', sceneType: '...', payload?: {} }",
      });
    }

    // Validate message type is recognized
    const validTypes = [
      "pool-event",
      "scene-event",
      "set-settings",
      "clear-scenes",
      "ping",
    ];
    if (!validTypes.includes(body.type)) {
      return res.status(400).json({
        error: `Invalid message type: '${body.type}'`,
        validTypes,
      });
    }

    wsHub.broadcast(body);
    res.json({ ok: true, broadcasted: true });
  });

  app.get("/api/proxy-image", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: `Failed to fetch image: ${response.statusText}` });
      }

      const contentType = response.headers.get("content-type") || "image/png";
      const buffer = await response.arrayBuffer();

      res.set("Content-Type", contentType);
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(Buffer.from(buffer));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: `Failed to proxy image: ${errorMsg}` });
    }
  });
}
