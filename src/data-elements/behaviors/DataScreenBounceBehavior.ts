import { DataElement } from "../primitives/DataElement";
import { TransformElement } from "../../elements/primitives/TransformElement";
import { configProps } from "../../core/configProps";
import { logger } from "../../utils/logger";

/**
 * Data-driven screen bounce behavior that detects screen boundaries and emits collision events.
 * Designed as a direct child of TransformElement. Emits "velocity-collision" events
 * that a sibling DataVelocityBehavior can listen for.
 */
export class DataScreenBounceBehavior extends DataElement {
  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  constructor(config: Record<string, unknown> = {}) {
    super({ id: (config as any).id });
    logger.warn("[DataScreenBounce] Created");
  }

  override play(): void {
    logger.warn("[DataScreenBounce] play() called");
    super.play();
  }

  protected override updateSelf(deltaTime: number): void {
    const target = this.target;

    if (!target) {
      return;
    }

    const screenWidth = configProps.canvas.W;
    const screenHeight = configProps.canvas.H;
    const width = target.getWidth() ?? 0;
    const height = target.getHeight() ?? 0;

    // Check horizontal bounds
    if (target.x < 0) {
      target.x = 0;
      this.parent!.emitEvent("velocity-collision", { axis: "x", direction: 1 });
    } else if (target.x + width > screenWidth) {
      target.x = screenWidth - width;
      this.parent!.emitEvent("velocity-collision", { axis: "x", direction: -1 });
    }

    // Check vertical bounds
    if (target.y < 0) {
      target.y = 0;
      this.parent!.emitEvent("velocity-collision", { axis: "y", direction: 1 });
    } else if (target.y + height > screenHeight) {
      target.y = screenHeight - height;
      this.parent!.emitEvent("velocity-collision", { axis: "y", direction: -1 });
    }
  }
}
