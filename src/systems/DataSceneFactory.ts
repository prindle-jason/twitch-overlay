import { DataElement } from "../data-elements/primitives/DataElement";
import { logger } from "../utils/logger";
import { schemaValidator } from "../utils/SchemaValidator";
import { ElementRegistry } from "./ElementRegistry";
import { ElementConfig } from "../types/SceneConfig";
// Import data elements index to auto-register all element types
import "../data-elements";

export class DataSceneFactory {
  private elementMap: Map<string, DataElement> = new Map();

  /**
   * Create a scene from JSON configuration
   * Returns the created scene element (NOT initialized yet)
   * The hierarchy is already built; init() will cascade from the scene
   */
  async createScene(config: any): Promise<DataElement | null> {
    logger.debug("[DataSceneFactory] Creating scene from config");

    // TODO: Schema validation disabled until schema references are fully resolved
    // if (
    //   !schemaValidator.validateDataSceneElementAndWarn(
    //     config,
    //     "DataSceneFactory.createScene",
    //   )
    // ) {
    //   logger.warn(
    //     "[DataSceneFactory] Aborting scene creation due to schema validation failure",
    //   );
    //   return null;
    // }

    if (!config || !config.elementType) {
      logger.warn("[DataSceneFactory] Config missing scene.elementType");
      return null;
    }

    // Create the scene element and its children
    const scene = this.createElementRecursive(config);

    if (!scene) {
      logger.warn("[DataSceneFactory] Failed to create scene element");
      return null;
    }

    // Pass element map to spawners so they can resolve templates in their init()
    for (const element of this.elementMap.values()) {
      const spawner = element as any;
      if (spawner.elementMap === undefined) {
        spawner.elementMap = this.elementMap;
      }
    }

    logger.debug("[DataSceneFactory] Scene created successfully", {
      sceneType: config.elementType,
      elementCount: this.elementMap.size,
    });

    return scene;
  }

  /**
   * Recursively create element and its children
   */
  private createElementRecursive(config: ElementConfig): DataElement | null {
    if (!config.elementType) {
      logger.warn("[DataSceneFactory] Element config missing elementType");
      return null;
    }

    // Create the element (config is now flat, no payload wrapper)
    const elementConfig = this.prepareElementConfig(config);
    const element = ElementRegistry.create(config.elementType, elementConfig);

    if (!element) {
      return null;
    }

    // Store by ID if present
    if (config.id) {
      this.elementMap.set(config.id, element);
    }

    // Create children if present (now at config.children, not config.payload.children)
    if (config.children && Array.isArray(config.children)) {
      for (const childConfig of config.children) {
        const child = this.createElementRecursive(childConfig);
        if (child) {
          element.addChild(child);
        }
      }
    }

    return element;
  }

  /**
   * Prepare element config: copy all properties except elementType and children
   */
  private prepareElementConfig(config: ElementConfig): Record<string, unknown> {
    const { elementType, children, ...rest } = config;
    return rest;
  }
}
