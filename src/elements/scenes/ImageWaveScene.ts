import { SceneElement } from "./SceneElement";
import { ImageElement } from "../primitives/ImageElement";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { TranslateBehavior } from "../behaviors/TranslateBehavior";
import { OceanWaveMotionBehavior } from "../behaviors/OceanWaveMotionBehavior";
import { SchedulerElement } from "../composites/SchedulerElement";
import { ImageLoader } from "../../utils/assets/ImageLoader";
import { logger } from "../../utils/logger";
import { TimingCurve } from "../../utils/timing/TimingCurves";
import { Sequence } from "../../utils/timing/Sequence";
import { localImages } from "../../utils/assets/images";

interface ImageWaveConfig {
  imageUrl?: string;
  soundUrl?: string;
  duration?: number;
  spawnDuration?: number;
  count?: number;
  imageHeight?: number;
  waveAmplitudePx?: number;
  wavePeriodPx?: number;
  waveRollAmountPx?: number;
  waveCrestSharpness?: number;
}

const DEFAULT_IMAGE_URL = localImages.bubFailure;
const DEFAULT_DURATION_MS = 9000;
const DEFAULT_SPAWN_DURATION_MS = 3000;
const DEFAULT_COUNT = 20;
const DEFAULT_IMAGE_HEIGHT = 80;
const DEFAULT_WAVE_AMPLITUDE = 24;
const DEFAULT_WAVE_PERIOD = 240;
const DEFAULT_WAVE_ROLL_AMOUNT = 8;
const DEFAULT_WAVE_CREST_SHARPNESS = 0.22;
const MIN_IMAGE_HEIGHT = 24;
const MIN_DURATION_MS = 1000;
const MIN_SPAWN_DURATION_MS = 16;
const MIN_COUNT = 1;
const MAX_COUNT = 1000;

export class ImageWaveScene extends SceneElement {
  readonly type = "imageWave" as const;

  private readonly imageUrl: string;
  private readonly soundUrl?: string;
  private readonly durationMs: number;
  private readonly spawnDurationMs: number;
  private readonly count: number;
  private readonly imageHeight: number;
  private readonly waveAmplitudePx: number;
  private readonly wavePeriodPx: number;
  private readonly waveRollAmountPx: number;
  private readonly waveCrestSharpness: number;

  constructor(config: ImageWaveConfig = {}) {
    super();

    this.imageUrl = config.imageUrl ?? DEFAULT_IMAGE_URL;
    this.soundUrl = config.soundUrl ?? undefined;
    this.durationMs = this.clampNumber(
      config.duration,
      MIN_DURATION_MS,
      120000,
      DEFAULT_DURATION_MS,
    );
    this.spawnDurationMs = this.clampNumber(
      config.spawnDuration,
      MIN_SPAWN_DURATION_MS,
      this.durationMs / 2,
      Math.min(DEFAULT_SPAWN_DURATION_MS, this.durationMs / 2),
    );
    this.count = Math.round(
      this.clampNumber(config.count, MIN_COUNT, MAX_COUNT, DEFAULT_COUNT),
    );
    this.imageHeight = this.clampNumber(
      config.imageHeight,
      MIN_IMAGE_HEIGHT,
      this.H,
      DEFAULT_IMAGE_HEIGHT,
    );
    this.waveAmplitudePx = this.clampNumber(
      config.waveAmplitudePx,
      0,
      this.H,
      DEFAULT_WAVE_AMPLITUDE,
    );
    this.wavePeriodPx = this.clampNumber(
      config.wavePeriodPx,
      10,
      4000,
      DEFAULT_WAVE_PERIOD,
    );
    this.waveRollAmountPx = this.clampNumber(
      config.waveRollAmountPx,
      0,
      300,
      DEFAULT_WAVE_ROLL_AMOUNT,
    );
    this.waveCrestSharpness = this.clampNumber(
      config.waveCrestSharpness,
      0,
      1,
      DEFAULT_WAVE_CREST_SHARPNESS,
    );

    if (this.soundUrl) {
      const sound = new SoundElement(this.soundUrl);
      sound.addChild(new SoundOnPlayBehavior());
      this.addChild(sound);
    }
  }

  override async init(): Promise<void> {
    const displayWidth = await this.measureAsset(
      this.imageUrl,
      this.imageHeight,
    );
    if (!displayWidth) {
      logger.warn(
        "[ImageWaveScene] Unable to measure image; finishing quickly",
        {
          imageUrl: this.imageUrl,
        },
      );
      this.duration = 10;
      await super.init();
      return;
    }

    this.createBottomWaveRow(this.imageUrl, displayWidth);
    this.duration = this.durationMs;

    await super.init();
  }

  protected override updateSelf(): void {
    if (this.children.length === 0) {
      this.finish();
    }
  }

  private clampNumber(
    value: unknown,
    min: number,
    max: number,
    fallback: number,
  ): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, value));
  }

  private async measureAsset(
    imageUrl: string,
    targetHeight: number,
  ): Promise<number | null> {
    try {
      const loaded = await ImageLoader.load(imageUrl);
      if (!loaded.image) {
        return null;
      }

      let naturalWidth = 0;
      let naturalHeight = 0;

      if (loaded.isAnimated) {
        const sequence = loaded.image as Sequence<ImageData>;
        const frame = sequence.getCurrent();
        if (frame) {
          naturalWidth = frame.width;
          naturalHeight = frame.height;
        }
      } else {
        const image = loaded.image as HTMLImageElement;
        naturalWidth = image.naturalWidth;
        naturalHeight = image.naturalHeight;
      }

      if (naturalWidth <= 0 || naturalHeight <= 0) {
        return null;
      }

      return Math.max(8, (naturalWidth * targetHeight) / naturalHeight);
    } catch (err) {
      logger.warn("[ImageWaveScene] Failed to measure image", {
        imageUrl,
        error: err,
      });
      return null;
    }
  }

  private createBottomWaveRow(imageUrl: string, displayWidth: number): void {
    const y = Math.max(0, this.H - this.imageHeight);
    const spawnIntervalMs = this.spawnDurationMs / (this.count - 1);

    this.spawnImage(imageUrl, displayWidth, y);
    if (this.count > 1) {
      const scheduler = new SchedulerElement({
        interval: spawnIntervalMs,
        count: this.count - 1,
        onTick: () => {
          this.spawnImage(imageUrl, displayWidth, y);
        },
      });

      this.addChild(scheduler);
    }
  }

  private spawnImage(
    imageUrl: string,
    displayWidth: number,
    rowY: number,
  ): void {
    const startX = -displayWidth;
    const endX = this.W + displayWidth;
    const travelMs = this.durationMs - this.spawnDurationMs;

    const image = new ImageElement({
      imageUrl,
      x: startX,
      y: rowY,
      height: this.imageHeight,
      scaleStrategy: "fit",
      duration: travelMs,
    });

    image.addChild(
      new TranslateBehavior({
        startX,
        startY: rowY,
        endX,
        endY: rowY,
        duration: travelMs,
        timingFunction: TimingCurve.LINEAR,
      }),
    );

    image.addChild(
      new OceanWaveMotionBehavior({
        amplitudePx: this.waveAmplitudePx,
        wavelengthPx: this.wavePeriodPx,
        phaseOffsetPx: 0,
        rollAmountPx: this.waveRollAmountPx,
        crestSharpness: this.waveCrestSharpness,
      }),
    );

    this.addChild(image);
  }
}
