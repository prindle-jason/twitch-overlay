import { TriggerableSceneElement } from "./SceneElement";
import { ConfettiScene } from "./ConfettiScene";
import { DvdElement } from "../DvdElement";
import { logger } from "../../utils/logger";

/**
 * PooledDvdEffect manages multiple DVD logos that bounce around the screen.
 * Instead of creating a new effect for each DVD, they all share one effect instance.
 * This allows for centralized control and potential interactions between DVDs.
 */
export class DvdScene extends TriggerableSceneElement {
  constructor() {
    super();
    this.duration = -1; // SceneElement duration management
  }

  override async init() {
    this.addChild(new DvdElement());
    await super.init();
  }

  handleTrigger(payload?: unknown): void {
    //Add a new DVD
    this.addChild(new DvdElement());
  }

  private spawnConfetti(): void {
    this.addChild(new ConfettiScene());
  }

  override update(deltaTime: number): void {
    // Check for finished DVDs that have hit a corner and spawn confetti before they are removed
    this.getChildrenOfType(DvdElement).forEach((dvd) => {
      if (dvd.getState() === "FINISHED" && dvd.getHasHitCorner()) {
        this.spawnConfetti();
      }
    });

    super.update(deltaTime);
  }

  /**
   * Clear all DVDs and confetti from the pool without destroying the effect itself.
   * Used when clearing effects from the dashboard.
   *
   * TODO: This causes confetti to spawn for all active DVDs when clearing.
   */
  clear(): void {
    this.children.forEach((child) => {
      child.finish();
    });
    logger.debug("[PooledDvdEffect] Cleared all DVDs and confetti");
  }
}
