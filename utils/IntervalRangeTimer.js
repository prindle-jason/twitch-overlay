// utils/IntervalRangeTimer.js
export class IntervalRangeTimer {
  constructor(minInterval, maxInterval, callback, maxCount = Infinity) {
    this.minInterval = minInterval;
    this.maxInterval = maxInterval;
    this.callback = callback;
    this.maxCount = maxCount;
    this.totalElapsed = 0;
    this.count = 0;
    this.nextSpawnTime = this.getRandomInterval(); // When next spawn should happen
  }
  
  getRandomInterval() {
    return this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
  }
  
  update(deltaTime) {
    if (this.count >= this.maxCount) return;
    
    this.totalElapsed += deltaTime;
    
    // Check if it's time for the next spawn
    while (this.totalElapsed >= this.nextSpawnTime && this.count < this.maxCount) {
      this.callback();
      this.count++;
      
      // Calculate when the NEXT spawn should happen
      this.nextSpawnTime += this.getRandomInterval();
    }
  }
  
  isFinished() {
    return this.count >= this.maxCount;
  }
}
