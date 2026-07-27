import { DataElement } from "../primitives/DataElement";
import { configProps } from "../../core/configProps";
import { logger } from "../../utils/logger";

interface DataRadialSpawnerConfig {
  schedulerId?: string;
  scheduler?: DataElement;
  spawnTemplateIds?: string[];
  templates?: DataElement[];
  countPerWave?: number;
  spawnVelocity?: number;
  elementMap?: Map<string, DataElement>;
  id?: string;
}

/**
 * Data-driven radial spawner that clones templates in a radial pattern when scheduler fires.
 * Listens for "scheduler-fired" events and spawns N clones per wave.
 */
export class DataRadialSpawnerElement extends DataElement {
  private templates: DataElement[] = [];
  private countPerWave: number;
  private spawnVelocity: number;
  private templateIds: string[] = [];
  private elementMap?: Map<string, DataElement>;

  constructor(config: Partial<DataRadialSpawnerConfig> = {}) {
    super({ id: config.id });

    this.countPerWave = config.countPerWave ?? 10;
    this.spawnVelocity = config.spawnVelocity ?? 3;
    this.templateIds = config.spawnTemplateIds ?? [];
    this.templates = config.templates ?? [];
    this.elementMap = config.elementMap;

    logger.warn("[DataRadialSpawner] Created", {
      countPerWave: this.countPerWave,
      spawnVelocity: this.spawnVelocity,
      templateCount: this.templates.length,
      templateIds: this.templateIds.length,
    });
  }

  override async init(): Promise<void> {
    logger.warn("[DataRadialSpawner] init() called");

    // Resolve template IDs if not already resolved
    if (this.templateIds.length > 0 && this.elementMap) {
      for (const id of this.templateIds) {
        const template = this.elementMap.get(id);
        if (template) {
          this.templates.push(template);
          logger.warn("[DataRadialSpawner] Resolved template", { id });
        } else {
          logger.warn("[DataRadialSpawner] Template not found", { id });
        }
      }
    }

    // Listen for scheduler-fired events from parent
    this.parent?.addEventListener("scheduler-fired", (detail: any) => {
      logger.warn("[DataRadialSpawner] Wave triggered", {
        wave: detail.tick,
        totalWaves: detail.totalTicks,
      });
      this.spawnWave();
    });

    await super.init();
  }

  override play(): void {
    logger.warn("[DataRadialSpawner] play() called");
    super.play();
  }

  /**
   * Spawn N clones in a radial pattern around screen center.
   */
  private spawnWave(): void {
    if (this.templates.length === 0) {
      logger.warn("[DataRadialSpawner] No templates to spawn");
      return;
    }

    const screenCenterX = configProps.canvas.W / 2;
    const screenCenterY = configProps.canvas.H / 2;

    for (let i = 0; i < this.countPerWave; i++) {
      // Pick random template
      const templateIndex = Math.floor(Math.random() * this.templates.length);
      const template = this.templates[templateIndex];

      // Clone the template
      const clone = template.clone();

      // Calculate radial angle (degrees, converted to radians)
      const angle = (i / this.countPerWave) * 2 * Math.PI;

      // Calculate radial velocity (vx, vy)
      const vx = Math.cos(angle) * this.spawnVelocity;
      const vy = Math.sin(angle) * this.spawnVelocity;

      // Set initial position at screen center
      // Note: We assume the clone is a TransformElement with x/y properties
      (clone as any).x = screenCenterX;
      (clone as any).y = screenCenterY;

      // Set velocity on the velocity behavior child
      const velocityChild = this.findVelocityBehavior(clone);
      if (velocityChild) {
        velocityChild.setVelocity(vx, vy);
        logger.warn("[DataRadialSpawner] Spawned image", {
          angle: (angle * 180) / Math.PI,
          vx,
          vy,
        });
      }

      // Add clone as child
      this.addChild(clone);
    }

    logger.warn("[DataRadialSpawner] Wave spawned", {
      count: this.countPerWave,
    });
  }

  /**
   * Find the velocity behavior child (assuming structure: image -> velocity -> screen-bounce)
   */
  private findVelocityBehavior(element: DataElement): any {
    // Velocity behavior is a direct child of the image
    for (const child of (element as any).children) {
      if (child.constructor.name === "DataVelocityBehavior") {
        return child;
      }
    }
    return null;
  }

  /**
   * Set templates for spawning (called by factory).
   */
  setTemplates(templates: DataElement[]): void {
    this.templates = templates;
    logger.warn("[DataRadialSpawner] Templates set", {
      count: templates.length,
    });
  }
}
