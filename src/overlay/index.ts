import { OverlayClient } from "./OverlayClient";
import { logger, LogLevel } from "../utils/logger";

// Enable debug logging
logger.setLevel(LogLevel.DEBUG);

window.addEventListener("load", () => {
  new OverlayClient().start();
});
