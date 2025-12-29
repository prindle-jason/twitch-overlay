export class IntervalTimer {
  private interval: number;
  private callback: () => void;
  private maxCount: number;
  private totalElapsed = 0;
  private count = 0;

  constructor(
    interval: number,
    callback: () => void,
    maxCount: number = Infinity
  ) {
    this.interval = interval;
    this.callback = callback;
    this.maxCount = maxCount;
  }

  update(deltaTime: number) {
    if (this.count >= this.maxCount) return;

    this.totalElapsed += deltaTime;
    const targetCount = Math.min(
      Math.floor(this.totalElapsed / this.interval),
      this.maxCount
    );

    while (this.count < targetCount) {
      this.callback();
      this.count++;
    }
  }

  isFinished() {
    return this.count >= this.maxCount;
  }
}
