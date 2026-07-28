import { DataElement } from "../primitives/DataElement";
import { TransformElement } from "../../elements/primitives/TransformElement";
import { logger } from "../../utils/logger";

interface DataVelocityConfig {
  vx?: number;
  vy?: number;
  id?: string;
}

/**
 * Data-driven velocity behavior that applies vx/vy to parent element position each frame.
 * Designed to work with DataScreenBounceBehavior as a child that modifies velocity on bounce.
 */
export class DataVelocityBehavior extends DataElement {
  vx: number = 0;
  vy: number = 0;

  constructor(config: Partial<DataVelocityConfig> = {}) {
    super({ id: config.id });
    this.vx = config?.vx ?? 0;
    this.vy = config?.vy ?? 0;

    logger.warn("[DataVelocity] Created", { vx: this.vx, vy: this.vy });
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  override async init(): Promise<void> {
    logger.warn("[DataVelocity] init() called");

    // Listen for collision events from sibling DataScreenBounceBehavior on scene event bus
    this.sceneEventBus?.on("velocity-collision", (detail: any) => {
      if (detail.axis === "x") {
        this.vx = detail.direction * Math.abs(this.vx);
        logger.warn("[DataVelocity] X velocity reversed", { vx: this.vx });
      } else if (detail.axis === "y") {
        this.vy = detail.direction * Math.abs(this.vy);
        logger.warn("[DataVelocity] Y velocity reversed", { vy: this.vy });
      }
    });

    await super.init();
  }

  protected override updateSelf(deltaTime: number): void {
    const target = this.target;
    if (!target) {
      return;
    }

    const speedScale = deltaTime / 16.67;

    target.x += this.vx * speedScale;
    target.y += this.vy * speedScale;
  }

  /**
   * Set velocity directly (used by spawner to assign initial velocity)
   */
  setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
    logger.warn("[DataVelocity] Velocity set", { vx, vy });
  }

  /**
   * Clone this velocity behavior, preserving vx/vy values.
   */
  override clone(): DataVelocityBehavior {
    const cloned = super.clone() as DataVelocityBehavior;
    cloned.vx = this.vx;
    cloned.vy = this.vy;
    return cloned;
  }
}
