import { DataElement } from "../data-elements/primitives/DataElement";
import { logger } from "../utils/logger";

type DataElementConstructor = new (payload?: Record<string, unknown>) => DataElement;

export class ElementRegistry {
  private static registry: Map<string, DataElementConstructor> = new Map();

  static register(type: string, ctor: DataElementConstructor): void {
    this.registry.set(type, ctor);
  }

  static create(
    type: string,
    payload?: Record<string, unknown>,
  ): DataElement | null {
    const ctor = this.registry.get(type);

    if (!ctor) {
      logger.warn(`[ElementRegistry] Unknown element type: ${type}`);
      return null;
    }

    try {
      return new ctor(payload);
    } catch (error) {
      logger.error(`[ElementRegistry] Error creating element of type ${type}`, {
        error,
      });
      return null;
    }
  }
}
