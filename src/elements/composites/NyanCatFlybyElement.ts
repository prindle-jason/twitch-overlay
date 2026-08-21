import { Element } from "../primitives/Element";
import { ImageElement } from "../primitives/ImageElement";
import { SceneElement } from "../scenes/SceneElement";
import { getRandomInRange, Range } from "../../utils/random";

export interface PositionSample {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 1 | -1;
}

export interface NyanCatFlybyConfig {
  imageUrl: string;
  travelDuration: number;
  direction: 1 | -1;
  baseY: number;
  scale: number;
  waveAmplitude: number;
  waveCycles: number;
  wavePhase: number;
  trailSpacing: number;
  starEmitIntervalRange: Range;
  onTrailStamp: (sample: PositionSample) => void;
  onStarSpawn: (sample: PositionSample) => void;
}

export class NyanCatFlybyElement extends Element {
  private image: ImageElement;
  private direction: 1 | -1;
  private startX = 0;
  private endX = 0;
  private baseY: number;
  private waveAmplitude: number;
  private waveCycles: number;
  private wavePhase: number;
  private trailSpacing: number;

  private previousX = 0;
  private previousY = 0;
  private pendingTrailDistance = 0;
  private starTimerMs = 0;
  private starEmitIntervalRange: Range;

  private onTrailStamp: (sample: PositionSample) => void;
  private onStarSpawn: (sample: PositionSample) => void;

  constructor(config: NyanCatFlybyConfig) {
    super({ duration: config.travelDuration });

    this.direction = config.direction;
    this.baseY = config.baseY;
    this.waveAmplitude = config.waveAmplitude;
    this.waveCycles = config.waveCycles;
    this.wavePhase = config.wavePhase;
    this.trailSpacing = config.trailSpacing;
    this.starEmitIntervalRange = config.starEmitIntervalRange;
    this.onTrailStamp = config.onTrailStamp;
    this.onStarSpawn = config.onStarSpawn;
    this.starTimerMs = getRandomInRange(config.starEmitIntervalRange);

    this.image = new ImageElement({
      imageUrl: config.imageUrl,
      scale: config.scale,
    });
    this.addChild(this.image);
  }

  override play(): void {
    const width = this.image.getWidth() ?? 96;
    const height = this.image.getHeight() ?? 64;

    this.startX =
      this.direction === 1 ? -width - 8 : this.getScreenWidth() + width + 8;
    this.endX =
      this.direction === 1 ? this.getScreenWidth() + width + 8 : -width - 8;

    if (this.direction === -1) {
      this.image.scaleX = -Math.abs(this.image.scaleX);
    }

    const startSample = this.samplePosition(0);
    this.image.x = startSample.x;
    this.image.y = startSample.y;

    this.previousX = startSample.x;
    this.previousY = startSample.y;

    super.play();

    this.onTrailStamp(
      this.buildSample(startSample.x, startSample.y, width, height),
    );
  }

  protected override updateSelf(deltaTime: number): void {
    const width = this.image.getWidth() ?? 96;
    const height = this.image.getHeight() ?? 64;
    const p = this.getProgress();
    const sample = this.samplePosition(p);

    this.image.x = sample.x;
    this.image.y = sample.y;

    const segDx = sample.x - this.previousX;
    const segDy = sample.y - this.previousY;
    const segDist = Math.hypot(segDx, segDy);
    if (segDist > 0) {
      let offset = this.trailSpacing - this.pendingTrailDistance;

      while (offset <= segDist) {
        const t = offset / segDist;
        const ix = this.previousX + segDx * t;
        const iy = this.previousY + segDy * t;

        this.onTrailStamp(this.buildSample(ix, iy, width, height));
        offset += this.trailSpacing;
      }

      this.pendingTrailDistance =
        (this.pendingTrailDistance + segDist) % this.trailSpacing;
    }

    this.previousX = sample.x;
    this.previousY = sample.y;

    this.starTimerMs -= deltaTime;
    if (this.starTimerMs <= 0) {
      this.onStarSpawn(this.buildSample(sample.x, sample.y, width, height));
      this.starTimerMs = getRandomInRange(this.starEmitIntervalRange);
    }
  }

  private samplePosition(progress: number): { x: number; y: number } {
    const x = this.startX + (this.endX - this.startX) * progress;
    const wave = Math.sin(
      this.wavePhase + progress * this.waveCycles * Math.PI * 2,
    );
    const y = this.baseY + wave * this.waveAmplitude;
    return { x, y };
  }

  private buildSample(
    x: number,
    y: number,
    width: number,
    height: number,
  ): PositionSample {
    return {
      x,
      y,
      width,
      height,
      direction: this.direction,
    };
  }

  private getScreenWidth(): number {
    if (!(this.parent instanceof SceneElement)) {
      return 1920;
    }
    return this.parent.W;
  }
}
