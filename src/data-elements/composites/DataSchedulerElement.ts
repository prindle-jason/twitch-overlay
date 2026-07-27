import { DataElement } from "../primitives/DataElement";
import { Range, getRandomInRange } from "../../utils/random";
import { logger } from "../../utils/logger";

interface DataSchedulerConfig {
  interval?: number | Range;
  count?: number;
  id?: string;
}

/**
 * Data-driven scheduler element that emits events at regular or random intervals.
 * Events are emitted via EventBus with type "scheduler-fired".
 * Designed for use in data-driven scenes with the radial spawner.
 */
export class DataSchedulerElement extends DataElement {
  private intervalMin: number;
  private intervalMax: number;
  private count: number;
  private timeSinceLastTick: number = 0;
  private nextInterval: number;
  private ticks: number = 0;

  constructor(config: Partial<DataSchedulerConfig> = {}) {
    super({ id: config.id });

    const interval = config.interval ?? 1000;
    if (typeof interval === "number") {
      this.intervalMin = interval;
      this.intervalMax = interval;
    } else {
      this.intervalMin = interval.min;
      this.intervalMax = interval.max;
    }

    this.count = config.count ?? Infinity;
    this.nextInterval = this.getRandomInterval();

    logger.warn("[DataScheduler] Created", {
      intervalMin: this.intervalMin,
      intervalMax: this.intervalMax,
      count: this.count,
    });
  }

  override async init(): Promise<void> {
    logger.warn("[DataScheduler] init() called");
    await super.init();
  }

  override play(): void {
    logger.warn("[DataScheduler] play() called");
    super.play();
  }

  private getRandomInterval(): number {
    if (this.intervalMin === this.intervalMax) {
      return this.intervalMin;
    }
    return getRandomInRange({ min: this.intervalMin, max: this.intervalMax });
  }

  protected override updateSelf(deltaTime: number): void {
    this.timeSinceLastTick += deltaTime;

    while (
      this.timeSinceLastTick >= this.nextInterval &&
      this.ticks < this.count
    ) {
      this.timeSinceLastTick -= this.nextInterval;
      this.nextInterval = this.getRandomInterval();
      this.ticks++;

      logger.warn("[DataScheduler] Wave fired", {
        wave: this.ticks,
        totalWaves: this.count,
      });

      this.emitEvent("scheduler-fired", {
        tick: this.ticks,
        totalTicks: this.count,
      });
    }

    if (this.isFinished()) {
      logger.warn("[DataScheduler] All waves complete, finishing");
      this.finish();
    }
  }

  isFinished(): boolean {
    return this.ticks >= this.count;
  }

  getTicks(): number {
    return this.ticks;
  }

  /**
   * Clone this scheduler, preserving interval and count configuration.
   */
  override clone(): DataSchedulerElement {
    const cloned = super.clone() as DataSchedulerElement;
    cloned.intervalMin = this.intervalMin;
    cloned.intervalMax = this.intervalMax;
    cloned.count = this.count;
    // Reset tick state for the clone
    cloned.timeSinceLastTick = 0;
    cloned.ticks = 0;
    cloned.nextInterval = cloned.getRandomInterval();
    return cloned;
  }
}
