import { SceneElement } from "./SceneElement";
import { EllipseElement } from "../EllipseElement";
import { TransformGravityBehavior } from "../behaviors/FallingBehavior";
import { TiltBehavior } from "../behaviors/TiltBehavior";
import { IntervalTimer } from "../../utils/IntervalTimer";

interface ConfettiConfig {
  count?: number;
  duration?: number;
}

export class ConfettiScene extends SceneElement {
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

    particle.addChild(
      new TransformGravityBehavior({
        velocityY: Math.random() * 50 + 25,
        velocityX: (Math.random() - 0.5) * 100,
        gravity: 300 + Math.random() * 200,
        drag: 0.02,
      })
    );

    particle.addChild(
      new TiltBehavior({
        rotationSpeed: (Math.random() - 0.5) * 6,
        wobbleAmount: Math.random() * 0.5,
        wobbleSpeed: Math.random() * 3 + 1,
      })
    );

    this.addChild(particle);
  }

  override update(deltaTime: number): void {
    this.spawner.update(deltaTime);

    super.update(deltaTime);

    // Remove particles that have left the screen
    this.children = this.children.filter((child) => {
      if (
        child instanceof EllipseElement &&
        child.isOffScreen(this.W, this.H)
      ) {
        child.setParent(null);
        return false;
      }
      return true;
    });

    // Finish early if all particles are gone after spawning completes
    if (this.spawner.isFinished() && this.children.length === 0) {
      this.finish();
    }
  }
}
