import { DataElement } from "../data-elements/primitives/DataElement";
import { logger } from "../utils/logger";

type DataElementConstructor = new (payload?: Record<string, unknown>) => DataElement;
type DataElementFactory = (payload?: Record<string, unknown>) => DataElement;
type DataElementCreator = DataElementConstructor | DataElementFactory;

/**
 * Detects if a function is a class constructor.
 * Classes have a .toString() that starts with 'class ' (ES6+)
 * or are constructor functions with proper prototype.
 */
function isClass(func: unknown): func is DataElementConstructor {
  if (typeof func !== 'function') return false;
  const str = func.toString();
  return str.startsWith('class ');
}

export class ElementRegistry {
  private static registry: Map<string, DataElementCreator> = new Map();

  /**
   * Register an element creator: either a constructor class or a factory function.
   * Both must accept a config object and return a DataElement instance.
   */
  static register(type: string, creator: DataElementCreator): void {
    this.registry.set(type, creator);
  }

  /**
   * Create an element by type, using either constructor or factory function.
   */
  static create(
    type: string,
    payload?: Record<string, unknown>,
  ): DataElement | null {
    const creator = this.registry.get(type);

    if (!creator) {
      logger.warn(`[ElementRegistry] Unknown element type: ${type}`);
      return null;
    }

    try {
      // Detect whether it's a class constructor or a factory function
      if (isClass(creator)) {
        // Call as constructor
        return new (creator as DataElementConstructor)(payload);
      } else {
        // Call as factory function
        return (creator as DataElementFactory)(payload);
      }
    } catch (error) {
      logger.error(`[ElementRegistry] Error creating element of type ${type}`, {
        error,
      });
      return null;
    }
  }
}
