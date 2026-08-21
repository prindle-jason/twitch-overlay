import { SceneElement } from "./SceneElement";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { TiltBehavior } from "../behaviors/TiltBehavior";
import { HueCycleBehavior } from "../behaviors/HueCycleBehavior";
import { GravityBehavior } from "../behaviors/GravityBehavior";
import { SchedulerElement } from "../composites/SchedulerElement";
import { RainbowStampElement } from "../composites/RainbowStampElement";
import { StarParticleElement } from "../composites/StarParticleElement";
import {
  NyanCatFlybyElement,
  PositionSample,
} from "../composites/NyanCatFlybyElement";
import {
  getRandomInRange,
  getRandomIntInRange,
  Range,
} from "../../utils/random";
import { localImages } from "../../utils/assets/images";
import { localSounds } from "../../utils/assets/sounds";

const CAT_COUNT_RANGE: Range = { min: 30, max: 40 };
const CAT_TRAVEL_DURATION_RANGE: Range = { min: 5000, max: 8000 };
const CAT_SCALE_RANGE: Range = { min: 0.15, max: 0.25 };
const CAT_WAVE_AMPLITUDE_RANGE: Range = { min: 16, max: 52 };
const CAT_WAVE_CYCLE_RANGE: Range = { min: 0.4, max: 1.1 };

const TRAIL_SPACING = 15;
const TRAIL_STAMP_WIDTH = 15;
const TRAIL_STRIPE_HEIGHT = 8;
const TRAIL_DURATION = 2500;
const TRAIL_LEAD_OFFSET = 6;
const TRAIL_VERTICAL_OFFSET_RATIO = 0.35;

const STAR_DURATION_RANGE: Range = { min: 2000, max: 3400 };
const STAR_SPEED_X_RANGE: Range = { min: 25, max: 90 };
const STAR_SPEED_Y_RANGE: Range = { min: -130, max: -30 };
const STAR_GRAVITY = 230;
const STAR_HUE_INCREMENT_RANGE: Range = { min: 0.05, max: 0.25 };
const STAR_RADIUS_RANGE: Range = { min: 8, max: 14 };
const STAR_ROTATION_SPEED = 15;
const STAR_EMIT_INTERVAL_RANGE: Range = { min: 200, max: 400 };

const SCENE_GUARD_DURATION_MS = 60000;
const CAT_SPAWN_WINDOW_MS = 10000;
const SCENE_FINISH_GRACE_MS = 500;

interface NyanSubscriberConfig {
  catImageUrl?: string;
  musicUrl?: string;
  catCount?: number;
}

export class NyanSubscriberScene extends SceneElement {
  readonly type = "nyanSubscriber" as const;

  private catImageUrl: string;
  private musicUrl: string;
  private catCount: number;

  private catSpawnScheduler: SchedulerElement | null = null;
  private music: SoundElement | null = null;

  private catsSpawned = 0;
  private catSpawnFinished = false;
  private musicEnded = false;
  private finishedAtMs: number | null = null;

  constructor(cfg: NyanSubscriberConfig = {}) {
    super();
    this.duration = SCENE_GUARD_DURATION_MS;

    this.catImageUrl = cfg.catImageUrl ?? localImages.goldNyan;
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
      trailSpacing: TRAIL_SPACING,
      starEmitIntervalRange: STAR_EMIT_INTERVAL_RANGE,
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

    const stamp = new RainbowStampElement({
      x: trailX,
      y: trailY,
      stampWidth: TRAIL_STAMP_WIDTH,
      stripeHeight: TRAIL_STRIPE_HEIGHT,
      duration: TRAIL_DURATION,
      palette: "gold",
    });
    this.addChild(stamp);
  }

  private spawnStar(sample: PositionSample): void {
    const originX = sample.x + sample.width * 0.42;
    const originY = sample.y + sample.height * 0.55;

    const speedX =
      getRandomInRange(STAR_SPEED_X_RANGE) * (Math.random() < 0.5 ? -1 : 1);
    const speedY = getRandomInRange(STAR_SPEED_Y_RANGE);
    const star = new StarParticleElement({
      x: originX,
      y: originY,
      radius: getRandomInRange(STAR_RADIUS_RANGE),
      duration: getRandomInRange(STAR_DURATION_RANGE),
    });

    star.addChild(
      new GravityBehavior({
        gravity: STAR_GRAVITY,
        velocityX: speedX,
        velocityY: speedY,
      }),
    );

    star.addChild(
      new TiltBehavior({
        rotationSpeed: getRandomInRange({
          min: -STAR_ROTATION_SPEED,
          max: STAR_ROTATION_SPEED,
        }),
        wobbleAmount: 0,
      }),
    );

    star.addChild(
      new HueCycleBehavior({
        hueIncrement: getRandomInRange(STAR_HUE_INCREMENT_RANGE),
      }),
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
