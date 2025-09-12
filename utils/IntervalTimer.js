// utils/IntervalTimer.js
export class IntervalTimer {
  constructor(interval, callback, maxCount = Infinity) {
    this.interval = interval;
    this.callback = callback;
    this.maxCount = maxCount;
    this.totalElapsed = 0;
    this.count = 0;
  }
  
  update(deltaTime) {
    if (this.count >= this.maxCount) return;
    
    this.totalElapsed += deltaTime;
    
    // Calculate how many spawns should have happened by now
    const targetCount = Math.min(
      Math.floor(this.totalElapsed / this.interval),
      this.maxCount
    );
    
    // Spawn any we've missed
    while (this.count < targetCount) {
      this.callback();
      this.count++;
    }
  }
  
  isFinished() {
    return this.count >= this.maxCount;
  }
}
