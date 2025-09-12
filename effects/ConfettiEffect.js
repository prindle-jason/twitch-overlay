import { BaseEffect } from "./BaseEffect.js";

export class ConfettiEffect extends BaseEffect {
  constructor({ W, H, count = 100, duration = 3000 }) {
    super({ W, H, duration });
    this.count = count;
    this.bufferTime = 3000;
    this.maxTime = duration + this.bufferTime;
    this.spawned = 0;
    this.lastSpawnTime = 0;
    this.spawnInterval = duration / count;
    this.particles = [];
  }

  spawnConfetti() {
    this.particles.push({
      x: Math.random() * this.W,
      y: -10,
      r: Math.random() * 6 + 4,
      d: Math.random() * 5 + 3,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.random() * 10 - 5,
    });
    this.spawned++;
  }

  update(deltaTime) {
    super.update(deltaTime);
    // Spawn confetti evenly during duration
    if (this.spawned < this.count && this.elapsed < this.duration) {
      this.lastSpawnTime += deltaTime;
      while (this.lastSpawnTime >= this.spawnInterval && this.spawned < this.count) {
        this.spawnConfetti();
        this.lastSpawnTime -= this.spawnInterval;
      }
    }
    const speedScale = deltaTime / 16.67;
    for (const p of this.particles) {
      p.y += p.d * 3 * speedScale;
      p.tilt += Math.random() * 0.5 * speedScale;
    }
    // Move finished logic here
    const expired = this.elapsed > this.maxTime;
  const offscreen = this.particles.length > 0 && this.particles.every((p) => p.y > this.H + 50);
    if (expired || offscreen) {
      this.state = "Finished";
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.ellipse(p.x, p.y, p.r, p.r * 0.3, p.tilt, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
