export class IntervalRangeTimer {
  private minInterval: number;
  private maxInterval: number;
  private callback: () => void;
  private maxCount: number;
  private totalElapsed = 0;
  private count = 0;
  private nextSpawnTime: number;

  constructor(
    minInterval: number,
    maxInterval: number,
    callback: () => void,
    maxCount: number = Infinity
  ) {
    this.minInterval = minInterval;
    this.maxInterval = maxInterval;
    this.callback = callback;
    this.maxCount = maxCount;
    this.nextSpawnTime = this.getRandomInterval();
  }

  private getRandomInterval(): number {
    return (
      this.minInterval + Math.random() * (this.maxInterval - this.minInterval)
    );
  }

  update(deltaTime: number): void {
    if (this.count >= this.maxCount) return;

    this.totalElapsed += deltaTime;

    while (
      this.totalElapsed >= this.nextSpawnTime &&
      this.count < this.maxCount
    ) {
      this.callback();
      this.count++;
      this.nextSpawnTime += this.getRandomInterval();
    }
  }

  isFinished(): boolean {
    return this.count >= this.maxCount;
  }
}
