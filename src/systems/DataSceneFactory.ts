import { Element } from "../elements/primitives/Element";
import { logger } from "../utils/logger";
import { ElementRegistry } from "./ElementRegistry";
import { SceneConfig, ElementConfig, ElementWithChildren } from "../types/SceneConfig";

export class DataSceneFactory {
  private elementMap: Map<string, Element> = new Map();

  /**
   * Create a scene from JSON configuration
   * Returns map of root element IDs to instances
   */
  async createScene(config: any): Promise<Map<string, Element>> {
    logger.debug("[DataSceneFactory] Creating scene from config");

    ElementRegistry.registerDefaults();

    // First pass: create all elements and store by ID
    const elements = config.elements || [];
    for (const elementConfig of elements) {
      this.createElementRecursive(elementConfig);
    }

    // Second pass: resolve references and init
    const rootElements = new Map<string, Element>();
    const rootElementIds = config["root-elements"] || [];
    for (const rootId of rootElementIds) {
      const element = this.elementMap.get(rootId);
      if (element) {
        await element.init();
        rootElements.set(rootId, element);
      } else {
        logger.warn(`[DataSceneFactory] Root element not found: ${rootId}`);
      }
    }

    logger.debug("[DataSceneFactory] Scene created successfully", {
      elementCount: this.elementMap.size,
      rootElements: rootElementIds,
    });

    return rootElements;
  }

  /**
   * Recursively create element and its children
   */
  private createElementRecursive(config: ElementConfig): Element | null {
    if (!config.type) {
      logger.warn("[DataSceneFactory] Element config missing type");
      return null;
    }

    // Create the element
    const payload = this.preparePayload(
      config as ElementWithChildren,
    );
    const element = ElementRegistry.create(config.type, payload);

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
   * Prepare payload: resolve ID references and remove children
   */
  private preparePayload(config: ElementWithChildren): Record<string, unknown> {
    const payload = { ...config.payload } || {};

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
    if (
      payload.spawnTemplateIds &&
      Array.isArray(payload.spawnTemplateIds)
    ) {
      const templates = payload.spawnTemplateIds.map((id: string) => {
        const template = this.elementMap.get(id);
        if (!template) {
          logger.warn(`[DataSceneFactory] Template not found: ${id}`);
        }
        return template;
      }).filter(Boolean);
      payload.templates = templates;
      delete payload.spawnTemplateIds;
    }

    return payload;
  }
}
