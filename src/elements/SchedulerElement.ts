import { Element } from "./Element";
import { Range, getRandomInRange } from "../utils/random";

interface SchedulerConfig {
  interval: number | Range;
  count?: number;
  onTick: () => void;
}

/**
 * Element that triggers a callback at regular or random intervals.
 * Useful for spawning, polling, or any periodic action.
 *
 * Use a number for fixed intervals, or a Range for random intervals.
 */
export class SchedulerElement extends Element {
  private intervalMin: number;
  private intervalMax: number;
  private count: number;
  private onTick: () => void;
  private timeSinceLastTick: number = 0;
  private nextInterval: number;
  private ticks: number = 0;

  constructor(config: SchedulerConfig) {
    super();

    if (typeof config.interval === "number") {
      this.intervalMin = config.interval;
      this.intervalMax = config.interval;
    } else {
      this.intervalMin = config.interval.min;
      this.intervalMax = config.interval.max;
    }

    this.count = config.count ?? Infinity;
    this.onTick = config.onTick;
    this.nextInterval = this.getRandomInterval();
  }

  private getRandomInterval(): number {
    if (this.intervalMin === this.intervalMax) {
      return this.intervalMin;
    }
    return getRandomInRange({ min: this.intervalMin, max: this.intervalMax });
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.isFinished()) {
      this.finish();
      return;
    }

    this.timeSinceLastTick += deltaTime;

    while (
      this.timeSinceLastTick >= this.nextInterval &&
      this.ticks < this.count
    ) {
      this.timeSinceLastTick -= this.nextInterval;
      this.nextInterval = this.getRandomInterval();
      this.ticks++;
      this.onTick();
    }

    if (this.isFinished()) {
      this.finish();
    }
  }

  isFinished(): boolean {
    return this.ticks >= this.count;
  }

  reset(): void {
    this.timeSinceLastTick = 0;
    this.ticks = 0;
    this.nextInterval = this.getRandomInterval();
  }
}
