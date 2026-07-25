import { Element } from "../elements/primitives/Element";
import { logger } from "../utils/logger";
import { DataSchedulerElement } from "../data-elements/composites/DataSchedulerElement";

type ElementConstructor = (payload?: Record<string, unknown>) => Element | null;

export class ElementRegistry {
  private static registry: Map<string, ElementConstructor> = new Map();

  static register(type: string, constructor: ElementConstructor): void {
    this.registry.set(type, constructor);
  }

  static create(type: string, payload?: Record<string, unknown>): Element | null {
    const constructor = this.registry.get(type);

    if (!constructor) {
      logger.warn(`[ElementRegistry] Unknown element type: ${type}`);
      return null;
    }

    try {
      return constructor(payload);
    } catch (error) {
      logger.error(`[ElementRegistry] Error creating element of type ${type}`, { error });
      return null;
    }
  }

  static registerDefaults(): void {
    // Data-driven elements
    this.register("scheduler", (payload) => {
      if (!payload || typeof payload !== "object") {
        logger.warn("[ElementRegistry] scheduler requires payload");
        return null;
      }
      return new DataSchedulerElement(payload as any);
    });

    // Placeholder registrations for other types (not yet implemented)
    this.register("audio", () => {
      logger.debug("[ElementRegistry] audio element not yet implemented");
      return null;
    });

    this.register("radial-spawner", () => {
      logger.debug("[ElementRegistry] radial-spawner element not yet implemented");
      return null;
    });

    this.register("image", () => {
      logger.debug("[ElementRegistry] image element not yet implemented");
      return null;
    });

    this.register("velocity", () => {
      logger.debug("[ElementRegistry] velocity behavior not yet implemented");
      return null;
    });

    this.register("screen-bounce", () => {
      logger.debug("[ElementRegistry] screen-bounce behavior not yet implemented");
      return null;
    });

    this.register("sound-on-play", () => {
      logger.debug("[ElementRegistry] sound-on-play behavior not yet implemented");
      return null;
    });
  }
}
