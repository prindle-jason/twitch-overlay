import { SceneElement } from "./SceneElement";
import { Element } from "../primitives/Element";
import { ImageElement } from "../primitives/ImageElement";
import { TransformElement } from "../primitives/TransformElement";
import { TiltBehavior } from "../behaviors/TiltBehavior";
import { HueCycleBehavior } from "../behaviors/HueCycleBehavior";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { SchedulerElement } from "../composites/SchedulerElement";
import {
  getRandomInRange,
  getRandomIntInRange,
  Range,
} from "../../utils/random";
import { localImages } from "../../utils/assets/images";
import { localSounds } from "../../utils/assets/sounds";

const RAINBOW_COLORS = [
  "#ee1111",
  "#ee8811",
  "#eeee11",
  "#33ee11",
  "#0088ee",
  "#6633ee",
] as const;

const CAT_COUNT_RANGE: Range = { min: 10, max: 20 };
const CAT_TRAVEL_DURATION_RANGE: Range = { min: 8000, max: 12000 };
const CAT_SCALE_RANGE: Range = { min: 0.25, max: 0.35 };
const CAT_WAVE_AMPLITUDE_RANGE: Range = { min: 16, max: 52 };
const CAT_WAVE_CYCLE_RANGE: Range = { min: 0.4, max: 1.1 };

const TRAIL_SPACING = 10;
const TRAIL_STAMP_WIDTH = 22;
const TRAIL_STRIPE_HEIGHT = 8;
const TRAIL_DURATION = 1600;
const TRAIL_LEAD_OFFSET = 6;
const TRAIL_VERTICAL_OFFSET_RATIO = 0.35;

const STAR_DURATION_RANGE: Range = { min: 2000, max: 3400 };
const STAR_SPEED_X_RANGE: Range = { min: 25, max: 90 };
const STAR_SPEED_Y_RANGE: Range = { min: -130, max: -30 };
const STAR_GRAVITY = 230;
const STAR_RADIUS_RANGE: Range = { min: 8, max: 14 };
const STAR_EMIT_INTERVAL_RANGE: Range = { min: 120, max: 250 };

const SCENE_GUARD_DURATION_MS = 60000;
const CAT_SPAWN_WINDOW_MS = 10000;
const SCENE_FINISH_GRACE_MS = 500;

interface PositionSample {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 1 | -1;
}

interface NyanFollowerConfig {
  catImageUrl?: string;
  musicUrl?: string;
  catCount?: number;
}

class RainbowStampElement extends TransformElement {
  private stripeHeight: number;
  private stampWidth: number;

  constructor(x: number, y: number, stampWidth: number, stripeHeight: number) {
    super({ x, y, duration: TRAIL_DURATION });
    this.stripeHeight = stripeHeight;
    this.stampWidth = stampWidth;
    this.setWidth(stampWidth);
    this.setHeight(stripeHeight * RAINBOW_COLORS.length);
  }

  protected override updateSelf(): void {
    this.opacity = 1 - this.getProgress();
  }

  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < RAINBOW_COLORS.length; i++) {
      ctx.fillStyle = RAINBOW_COLORS[i];
      ctx.fillRect(
        0,
        i * this.stripeHeight,
        this.stampWidth,
        this.stripeHeight,
      );
    }
  }
}

class StarParticleElement extends TransformElement {
  private vx: number;
  private vy: number;
  private gravity: number;
  private radius: number;
  private innerRadius: number;
  private points = 5;

  constructor(
    x: number,
    y: number,
    radius: number,
    velocityX: number,
    velocityY: number,
    duration: number,
  ) {
    super({ x, y, duration });
    this.radius = radius;
    this.innerRadius = radius * 0.45;
    this.vx = velocityX;
    this.vy = velocityY;
    this.gravity = STAR_GRAVITY;

    this.addChild(
      new TiltBehavior({
        rotationSpeed: getRandomInRange({ min: -22, max: 22 }),
        wobbleAmount: 0,
      }),
    );
    this.addChild(
      new HueCycleBehavior({
        hueIncrement: getRandomInRange({ min: 0.02, max: 0.05 }),
      }),
    );
  }

  protected override updateSelf(deltaTime: number): void {
    const dt = deltaTime / 1000;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    // Draw around local (0,0) so rotation stays centered on the star.
    let angle = -Math.PI / 2;
    const step = Math.PI / this.points;

    ctx.beginPath();
    for (let i = 0; i < this.points * 2; i++) {
      const r = i % 2 === 0 ? this.radius : this.innerRadius;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
      angle += step;
    }
    ctx.closePath();
    ctx.fillStyle = "#fff2a8";
    ctx.fill();
  }
}

class NyanCatFlybyElement extends Element {
  private image: ImageElement;
  private direction: 1 | -1;
  private startX = 0;
  private endX = 0;
  private baseY = 0;
  private waveAmplitude: number;
  private waveCycles: number;
  private wavePhase: number;

  private previousX = 0;
  private previousY = 0;
  private pendingTrailDistance = 0;
  private starTimerMs = 0;

  private onTrailStamp: (sample: PositionSample) => void;
  private onStarSpawn: (sample: PositionSample) => void;

  constructor(config: {
    imageUrl: string;
    travelDuration: number;
    direction: 1 | -1;
    baseY: number;
    scale: number;
    waveAmplitude: number;
    waveCycles: number;
    wavePhase: number;
    onTrailStamp: (sample: PositionSample) => void;
    onStarSpawn: (sample: PositionSample) => void;
  }) {
    super({ duration: config.travelDuration });

    this.direction = config.direction;
    this.baseY = config.baseY;
    this.waveAmplitude = config.waveAmplitude;
    this.waveCycles = config.waveCycles;
    this.wavePhase = config.wavePhase;
    this.onTrailStamp = config.onTrailStamp;
    this.onStarSpawn = config.onStarSpawn;
    this.starTimerMs = getRandomInRange(STAR_EMIT_INTERVAL_RANGE);

    this.image = new ImageElement({
      imageUrl: config.imageUrl,
      scale: config.scale,
    });
    this.addChild(this.image);
  }

  override play(): void {
    const width = this.image.getWidth() ?? 96;
    const height = this.image.getHeight() ?? 64;

    this.startX = this.direction === 1 ? -width - 8 : this.getScreenWidth() + 8;
    this.endX = this.direction === 1 ? this.getScreenWidth() + 8 : -width - 8;

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
      let offset = TRAIL_SPACING - this.pendingTrailDistance;

      while (offset <= segDist) {
        const t = offset / segDist;
        const ix = this.previousX + segDx * t;
        const iy = this.previousY + segDy * t;

        this.onTrailStamp(this.buildSample(ix, iy, width, height));
        offset += TRAIL_SPACING;
      }

      this.pendingTrailDistance =
        (this.pendingTrailDistance + segDist) % TRAIL_SPACING;
    }

    this.previousX = sample.x;
    this.previousY = sample.y;

    this.starTimerMs -= deltaTime;
    if (this.starTimerMs <= 0) {
      this.onStarSpawn(this.buildSample(sample.x, sample.y, width, height));
      this.starTimerMs = getRandomInRange(STAR_EMIT_INTERVAL_RANGE);
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

export class NyanFollowerScene extends SceneElement {
  readonly type = "nyanFollower" as const;

  private catImageUrl: string;
  private musicUrl: string;
  private catCount: number;

  private catSpawnScheduler: SchedulerElement | null = null;
  private music: SoundElement | null = null;

  private catsSpawned = 0;
  private catSpawnFinished = false;
  private musicEnded = false;
  private finishedAtMs: number | null = null;

  constructor(cfg: NyanFollowerConfig = {}) {
    super();
    this.duration = SCENE_GUARD_DURATION_MS;

    this.catImageUrl = cfg.catImageUrl ?? localImages.nyanCat;
    this.musicUrl = cfg.musicUrl ?? localSounds.nyanMusic;
    this.catCount = cfg.catCount ?? getRandomIntInRange(CAT_COUNT_RANGE);
  }

  override async init(): Promise<void> {
    const spawnInterval = CAT_SPAWN_WINDOW_MS / this.catCount;
    this.catSpawnScheduler = new SchedulerElement({
      interval: spawnInterval,
      count: this.catCount,
      onTick: () => this.spawnCat(),
    });
    this.addChild(this.catSpawnScheduler);

    this.music = new SoundElement(this.musicUrl);
    this.music.baseVolume = 1.0;
    this.music.addChild(new SoundOnPlayBehavior());
    this.addChild(this.music);

    await super.init();
  }

  override play(): void {
    super.play();

    const musicAudio = this.music?.getSound();
    if (musicAudio) {
      this.musicEnded = false;
      musicAudio.addEventListener(
        "ended",
        () => {
          this.musicEnded = true;
        },
        { once: true },
      );
    } else {
      this.musicEnded = true;
    }
  }

  protected override updateSelf(deltaTime: number): void {
    if (this.catSpawnScheduler && this.catSpawnScheduler.isFinished()) {
      this.catSpawnFinished = true;
    }

    const activeCats = this.getChildrenOfType(NyanCatFlybyElement).length;
    const activeTrails = this.getChildrenOfType(RainbowStampElement).length;
    const activeStars = this.getChildrenOfType(StarParticleElement).length;

    const allVisualsDone =
      this.catSpawnFinished &&
      activeCats === 0 &&
      activeTrails === 0 &&
      activeStars === 0;
    const audioDone = this.musicEnded || !this.music;

    if (allVisualsDone && audioDone) {
      if (this.finishedAtMs === null) {
        this.finishedAtMs = this.elapsed;
      }

      if (this.elapsed - this.finishedAtMs >= SCENE_FINISH_GRACE_MS) {
        this.finish();
      }
      return;
    }

    this.finishedAtMs = null;
  }

  private spawnCat(): void {
    this.catsSpawned += 1;
    if (this.catsSpawned >= this.catCount) {
      this.catSpawnFinished = true;
    }

    const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const travelDuration = getRandomInRange(CAT_TRAVEL_DURATION_RANGE);
    const scale = getRandomInRange(CAT_SCALE_RANGE);
    const baseY = getRandomInRange({ min: this.H * 0.12, max: this.H * 0.72 });

    const cat = new NyanCatFlybyElement({
      imageUrl: this.catImageUrl,
      travelDuration,
      direction,
      baseY,
      scale,
      waveAmplitude: getRandomInRange(CAT_WAVE_AMPLITUDE_RANGE),
      waveCycles: getRandomInRange(CAT_WAVE_CYCLE_RANGE),
      wavePhase: Math.random() * Math.PI * 2,
      onTrailStamp: (sample) => this.spawnTrailStamp(sample),
      onStarSpawn: (sample) => this.spawnStar(sample),
    });

    this.addChild(cat);
  }

  private spawnTrailStamp(sample: PositionSample): void {
    const catMidX =
      sample.direction === 1
        ? sample.x + sample.width * 0.5
        : sample.x - sample.width * 0.5;
    const trailX =
      catMidX - TRAIL_STAMP_WIDTH * 0.5 - sample.direction * TRAIL_LEAD_OFFSET;
    const trailY = sample.y + sample.height * TRAIL_VERTICAL_OFFSET_RATIO;

    const stamp = new RainbowStampElement(
      trailX,
      trailY,
      TRAIL_STAMP_WIDTH,
      TRAIL_STRIPE_HEIGHT,
    );
    this.addChild(stamp);
  }

  private spawnStar(sample: PositionSample): void {
    const originX = sample.x + sample.width * 0.42;
    const originY = sample.y + sample.height * 0.55;

    const speedX =
      getRandomInRange(STAR_SPEED_X_RANGE) * (Math.random() < 0.5 ? -1 : 1);
    const speedY = getRandomInRange(STAR_SPEED_Y_RANGE);
    const star = new StarParticleElement(
      originX,
      originY,
      getRandomInRange(STAR_RADIUS_RANGE),
      speedX,
      speedY,
      getRandomInRange(STAR_DURATION_RANGE),
    );

    this.addChild(star);
  }

  override finish(): void {
    this.music?.stopSound();

    super.finish();

    this.catSpawnScheduler = null;
    this.music = null;
  }

  protected override drawChildren(ctx: CanvasRenderingContext2D): void {
    this.getChildrenOfType(StarParticleElement).forEach((star) =>
      star.draw(ctx),
    );
    this.getChildrenOfType(RainbowStampElement).forEach((stamp) =>
      stamp.draw(ctx),
    );
    this.getChildrenOfType(NyanCatFlybyElement).forEach((cat) => cat.draw(ctx));
  }
}
