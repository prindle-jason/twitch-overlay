import { Range, getRandomInRange } from "../random";

/**
 * Utility for triggering callbacks at regular or random intervals.
 * Supports both fixed intervals and random interval ranges.
 */
export class Scheduler {
  private intervalMin: number;
  private intervalMax: number;
  private callback: () => void;
  private maxCount: number;
  private totalElapsed = 0;
  private count = 0;
  private nextTriggerTime: number;

  constructor(
    interval: number | Range,
    callback: () => void,
    maxCount: number = Infinity,
  ) {
    if (typeof interval === "number") {
      this.intervalMin = interval;
      this.intervalMax = interval;
    } else {
      this.intervalMin = interval.min;
      this.intervalMax = interval.max;
    }

    this.callback = callback;
    this.maxCount = maxCount;
    this.nextTriggerTime = this.getRandomInterval();
  }

  private getRandomInterval(): number {
    if (this.intervalMin === this.intervalMax) {
      return this.intervalMin;
    }
    return getRandomInRange({ min: this.intervalMin, max: this.intervalMax });
  }

  update(deltaTime: number): void {
    if (this.count >= this.maxCount) return;

    this.totalElapsed += deltaTime;

    while (
      this.totalElapsed >= this.nextTriggerTime &&
      this.count < this.maxCount
    ) {
      this.callback();
      this.count++;
      this.nextTriggerTime += this.getRandomInterval();
    }
  }

  isFinished(): boolean {
    return this.count >= this.maxCount;
  }

  reset(): void {
    this.totalElapsed = 0;
    this.count = 0;
    this.nextTriggerTime = this.getRandomInterval();
  }
}
