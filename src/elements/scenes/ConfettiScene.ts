import { SceneElement } from "./SceneElement";
import { EllipseElement } from "../primitives/EllipseElement";
import { ImageElement } from "../primitives/ImageElement";
import { GravityBehavior } from "../behaviors/GravityBehavior";
import { TiltBehavior } from "../behaviors/TiltBehavior";
import { SchedulerElement } from "../composites/SchedulerElement";
import { TransformElement } from "../primitives/TransformElement";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";

interface ConfettiConfig {
  count?: number;
  duration?: number;
  imageUrls?: string[];
  soundUrl?: string;
  imageHeight?: number;
}

export class ConfettiScene extends SceneElement {
  readonly type = "confetti" as const;
  private readonly particleCount: number;
  private readonly spawnDurationMs: number;
  private readonly imageUrls: string[];
  private readonly soundUrl?: string;
  private readonly imageHeight: number;
  private readonly bufferMs = 3000;

  constructor(cfg: ConfettiConfig = {}) {
    super();
    this.particleCount = cfg.count ?? 150;
    this.spawnDurationMs = cfg.duration ?? 3000;
    this.imageUrls = (cfg.imageUrls ?? []).filter(
      (url): url is string => typeof url === "string" && url.trim().length > 0,
    );
    this.soundUrl =
      typeof cfg.soundUrl === "string" && cfg.soundUrl.trim().length > 0
        ? cfg.soundUrl
        : undefined;
    this.imageHeight = cfg.imageHeight ?? 60;
    this.duration = this.spawnDurationMs + this.bufferMs;

    if (this.soundUrl) {
      const sound = new SoundElement(this.soundUrl);
      sound.addChild(new SoundOnPlayBehavior());
      this.addChild(sound);
    }

    const interval = this.spawnDurationMs / this.particleCount;
    this.addChild(
      new SchedulerElement({
        interval,
        onTick: () => this.spawnParticle(),
        count: this.particleCount,
      }),
    );
  }

  private spawnParticle(): void {
    const particle = this.createParticle();

    particle.addChild(
      new GravityBehavior({
        velocityY: Math.random() * 50 + 25,
        velocityX: (Math.random() - 0.5) * 100,
        gravity: 200 + Math.random() * 200,
        drag: 0.02,
      }),
    );

    particle.addChild(
      new TiltBehavior({
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobbleAmount: Math.random() * 0.5,
        wobbleSpeed: Math.random() * 3 + 1,
      }),
    );

    this.addChild(particle);
  }

  private createParticle(): EllipseElement | ImageElement {
    if (this.imageUrls.length > 0) {
      const imageUrl =
        this.imageUrls[Math.floor(Math.random() * this.imageUrls.length)];

      return new ImageElement({
        imageUrl,
        x: Math.random() * this.W,
        y: -10,
        width: this.imageHeight,
        height: this.imageHeight,
        scaleStrategy: "fit",
        rotation: Math.random() * Math.PI * 2,
      });
    }

    const radiusX = Math.random() * 10 + 4;
    return new EllipseElement({
      x: Math.random() * this.W,
      y: -10,
      radiusX,
      radiusY: radiusX * 0.3,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  protected override updateSelf(deltaTime: number): void {
    // Remove particles that have left the screen
    this.children = this.children.filter((child) => {
      if (
        child instanceof TransformElement &&
        child.isOffScreen(this.W, this.H)
      ) {
        child.finish();
        return false;
      }
      return true;
    });

    // Finish early if all particles are gone after spawning completes
    if (this.children.length === 0) {
      this.finish();
    }
  }
}
