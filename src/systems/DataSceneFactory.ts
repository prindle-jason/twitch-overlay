import { DataElement } from "../data-elements/primitives/DataElement";
import { logger } from "../utils/logger";
import { ElementRegistry } from "./ElementRegistry";
import { ElementConfig, ElementWithChildren } from "../types/SceneConfig";
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

    const sceneConfig = config.scene;
    if (!sceneConfig || !sceneConfig.elementType) {
      logger.warn("[DataSceneFactory] Config missing scene.elementType");
      return null;
    }

    // Create the scene element and its children
    const scene = this.createElementRecursive(sceneConfig);

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
      sceneType: sceneConfig.elementType,
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

    // Create the element
    const payload = this.preparePayload(config as ElementWithChildren);
    const element = ElementRegistry.create(config.elementType, payload);

    if (!element) {
      return null;
    }

    // Store by ID if present
    if (config.id) {
      this.elementMap.set(config.id, element);
    }

    // Create children if present
    const childConfigs = (config as ElementWithChildren).payload?.children as
      | ElementConfig[]
      | undefined;
    if (childConfigs && Array.isArray(childConfigs)) {
      for (const childConfig of childConfigs) {
        const child = this.createElementRecursive(childConfig);
        if (child) {
          element.addChild(child);
        }
      }
    }

    return element;
  }

  /**
   * Prepare payload: add config ID and resolve ID references, remove children
   */
  private preparePayload(config: ElementWithChildren): Record<string, unknown> {
    const payload = { ...config.payload } || {};

    // Add ID from config (if present)
    if (config.id) {
      payload.id = config.id;
    }

    // Remove children from payload (handled separately)
    delete payload.children;

    // Resolve element ID references
    if (payload.schedulerId && typeof payload.schedulerId === "string") {
      const scheduler = this.elementMap.get(payload.schedulerId);
      if (scheduler) {
        payload.scheduler = scheduler;
      } else {
        logger.warn(
          `[DataSceneFactory] Scheduler not found: ${payload.schedulerId}`,
        );
      }
      delete payload.schedulerId;
    }

    // Resolve template IDs array
    if (payload.spawnTemplateIds && Array.isArray(payload.spawnTemplateIds)) {
      const templates = payload.spawnTemplateIds
        .map((id: string) => {
          const template = this.elementMap.get(id);
          if (!template) {
            logger.warn(`[DataSceneFactory] Template not found: ${id}`);
          }
          return template;
        })
        .filter(Boolean);
      payload.templates = templates;
      delete payload.spawnTemplateIds;
    }

    return payload;
  }
}
