import { Effect } from "./Effect";
import { EllipseElement } from "../elements/EllipseElement";
import { FallingBehavior } from "../behaviors/FallingBehavior";
import { TiltBehavior } from "../behaviors/TiltBehavior";
import { IntervalTimer } from "../utils/IntervalTimer";

interface ConfettiConfig {
  count?: number;
  duration?: number;
}

export class ConfettiEffect extends Effect {
  private readonly particleCount: number;
  private readonly spawnDurationMs: number;
  private readonly bufferMs = 3000;
  private readonly spawner: IntervalTimer;

  constructor(cfg: ConfettiConfig = {}) {
    super();
    this.particleCount = cfg.count ?? 150;
    this.spawnDurationMs = cfg.duration ?? 3000;
    this.duration = this.spawnDurationMs + this.bufferMs;

    const interval = this.spawnDurationMs / this.particleCount;
    this.spawner = new IntervalTimer(
      interval,
      () => this.spawnParticle(),
      this.particleCount
    );
  }

  private spawnParticle(): void {
    const particle = new EllipseElement({
      x: Math.random() * this.W,
      y: -10,
      radiusX: Math.random() * 10 + 4,
      radiusY: (Math.random() * 10 + 4) * 0.3,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      rotation: Math.random() * Math.PI * 2,
    });

    particle.addBehavior(
      new FallingBehavior({
        velocityY: Math.random() * 50 + 25,
        velocityX: (Math.random() - 0.5) * 100,
        gravity: 300 + Math.random() * 200,
        drag: 0.02,
      })
    );

    particle.addBehavior(
      new TiltBehavior({
        rotationSpeed: (Math.random() - 0.5) * 6,
        wobbleAmount: Math.random() * 0.5,
        wobbleSpeed: Math.random() * 3 + 1,
      })
    );

    this.addElement(particle);
  }

  override update(deltaTime: number): void {
    this.spawner.update(deltaTime);

    super.update(deltaTime);

    this.elements = this.elements.filter((element) => {
      if (element instanceof EllipseElement) {
        return !element.isOffScreen(this.W, this.H);
      }
      return true;
    });

    if (this.spawner.isFinished() && this.elements.length === 0) {
      this.state = "FINISHED";
      this.elements.forEach((element) => element.setState("FINISHED"));
    }
  }
}
