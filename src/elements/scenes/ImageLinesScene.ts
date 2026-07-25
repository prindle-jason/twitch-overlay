import { SceneElement } from "./SceneElement";
import { ImageElement } from "../primitives/ImageElement";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { TranslateBehavior } from "../behaviors/TranslateBehavior";
import { SchedulerElement } from "../composites/SchedulerElement";
import { ImageLoader } from "../../utils/assets/ImageLoader";
import { logger } from "../../utils/logger";
import { TimingCurve } from "../../utils/timing/TimingCurves";
import { Sequence } from "../../utils/timing/Sequence";

type ImageLinesVariant = "topBottom" | "multiRows";
type RowDirection = "ltr" | "rtl";

interface ImageLinesConfig {
  variant?: ImageLinesVariant;
  imageUrls?: string[];
  soundUrl?: string;
  durationMs?: number;
  speedPxPerSec?: number;
  imageHeight?: number;
  gapPx?: number;
  rowCount?: number;
}

interface AssetMetrics {
  imageUrl: string;
  displayWidth: number;
}

interface SpawnPlanEntry {
  imageUrl: string;
  displayWidth: number;
  slotWidth: number;
  phasePx: number;
}

const DEFAULT_DURATION_MS = 9000;
const DEFAULT_SPEED_PX_PER_SEC = 260;
const DEFAULT_IMAGE_HEIGHT = 90;
const DEFAULT_GAP_PX = 24;
const DEFAULT_ROW_COUNT = 5;
const MIN_IMAGE_HEIGHT = 24;
const MIN_GAP_PX = 0;
const MIN_SPEED = 40;
const MIN_DURATION_MS = 1000;
const OFFSCREEN_PADDING = 160;

export class ImageLinesScene extends SceneElement {
  readonly type = "imageLines" as const;

  private readonly variant: ImageLinesVariant;
  private readonly imageUrls: string[];
  private readonly soundUrl?: string;
  private readonly requestedDurationMs: number;
  private readonly speedPxPerSec: number;
  private readonly imageHeight: number;
  private readonly gapPx: number;
  private readonly rowCount: number;

  constructor(config: ImageLinesConfig = {}) {
    super();

    this.variant = this.parseVariant(config.variant);
    this.imageUrls = (config.imageUrls ?? []).filter(
      (url): url is string => typeof url === "string" && url.trim().length > 0,
    );
    this.soundUrl =
      typeof config.soundUrl === "string" && config.soundUrl.trim().length > 0
        ? config.soundUrl
        : undefined;
    this.requestedDurationMs = this.clampNumber(
      config.durationMs,
      MIN_DURATION_MS,
      120000,
      DEFAULT_DURATION_MS,
    );
    this.speedPxPerSec = this.clampNumber(
      config.speedPxPerSec,
      MIN_SPEED,
      2200,
      DEFAULT_SPEED_PX_PER_SEC,
    );
    this.imageHeight = this.clampNumber(
      config.imageHeight,
      MIN_IMAGE_HEIGHT,
      this.H,
      DEFAULT_IMAGE_HEIGHT,
    );
    this.gapPx = this.clampNumber(
      config.gapPx,
      MIN_GAP_PX,
      600,
      DEFAULT_GAP_PX,
    );
    this.rowCount = Math.round(
      this.clampNumber(config.rowCount, 1, 30, DEFAULT_ROW_COUNT),
    );

    if (this.soundUrl) {
      const sound = new SoundElement(this.soundUrl);
      sound.addChild(new SoundOnPlayBehavior());
      this.addChild(sound);
    }
  }

  override async init(): Promise<void> {
    if (this.imageUrls.length === 0) {
      logger.warn("[ImageLinesScene] No imageUrls provided; finishing quickly");
      this.duration = 10;
      await super.init();
      return;
    }

    const metrics = await this.measureAssets(this.imageUrls, this.imageHeight);
    if (metrics.length === 0) {
      logger.warn(
        "[ImageLinesScene] Unable to measure any assets; finishing quickly",
      );
      this.duration = 10;
      await super.init();
      return;
    }

    const rowLifetimeMs = this.buildVariantRows(metrics);
    this.duration = Math.max(rowLifetimeMs + 200, 500);

    await super.init();
  }

  protected override updateSelf(): void {
    if (this.children.length === 0) {
      this.finish();
    }
  }

  private parseVariant(variant: unknown): ImageLinesVariant {
    if (variant === "topBottom" || variant === "multiRows") {
      return variant;
    }
    return "topBottom";
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

  private async measureAssets(
    imageUrls: string[],
    targetHeight: number,
  ): Promise<AssetMetrics[]> {
    const seen = new Set<string>();
    const metrics: AssetMetrics[] = [];

    for (const imageUrl of imageUrls) {
      if (seen.has(imageUrl)) {
        continue;
      }

      seen.add(imageUrl);

      try {
        const loaded = await ImageLoader.load(imageUrl);
        if (!loaded.image) {
          continue;
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
          continue;
        }

        const displayWidth = Math.max(
          8,
          (naturalWidth * targetHeight) / naturalHeight,
        );

        metrics.push({ imageUrl, displayWidth });
      } catch (err) {
        logger.warn("[ImageLinesScene] Failed to measure image", {
          imageUrl,
          error: err,
        });
      }
    }

    return metrics;
  }

  private buildVariantRows(metrics: AssetMetrics[]): number {
    switch (this.variant) {
      case "topBottom":
        return this.createTopBottomRows(metrics);
      case "multiRows":
        return this.createMultiRows(metrics);
      default:
        return this.createTopBottomRows(metrics);
    }
  }

  private createTopBottomRows(metrics: AssetMetrics[]): number {
    const topY = 24;
    const bottomY = Math.max(0, this.H - this.imageHeight - 24);

    const topDuration = this.createScheduledRow(metrics, topY, "ltr", 0);
    const bottomDuration = this.createScheduledRow(
      metrics,
      bottomY,
      "rtl",
      metrics.length,
    );

    return Math.max(topDuration, bottomDuration);
  }

  private createMultiRows(metrics: AssetMetrics[]): number {
    const count = Math.max(1, this.rowCount);
    const topInset = Math.max(12, this.imageHeight * 0.35);
    const bottomInset = Math.max(12, this.imageHeight * 0.35);
    const usable = Math.max(
      0,
      this.H - topInset - bottomInset - this.imageHeight,
    );
    const step = count <= 1 ? 0 : usable / (count - 1);

    let maxDuration = 0;
    for (let i = 0; i < count; i++) {
      const y = topInset + i * step;
      const direction: RowDirection = i % 2 === 0 ? "ltr" : "rtl";
      const duration = this.createScheduledRow(metrics, y, direction, i);
      maxDuration = Math.max(maxDuration, duration);
    }

    return maxDuration;
  }

  private createScheduledRow(
    metrics: AssetMetrics[],
    rowY: number,
    direction: RowDirection,
    offsetSeed: number,
  ): number {
    const plan = this.buildSpawnPlan(metrics, offsetSeed);
    if (plan.length === 0) {
      return 0;
    }

    this.spawnPlannedImage(plan[0], rowY, direction);

    if (plan.length > 1) {
      let nextIndex = 1;
      let scheduler: SchedulerElement;

      scheduler = new SchedulerElement({
        interval: this.slotToIntervalMs(plan[0].slotWidth),
        count: plan.length - 1,
        onTick: () => {
          const item = plan[nextIndex];
          if (!item) {
            return;
          }

          this.spawnPlannedImage(item, rowY, direction);
          nextIndex += 1;

          if (nextIndex < plan.length) {
            scheduler.setInterval(this.slotToIntervalMs(item.slotWidth));
          }
        },
      });

      this.addChild(scheduler);
    }

    return this.estimateRowLifetimeMs(plan);
  }

  private buildSpawnPlan(
    metrics: AssetMetrics[],
    offsetSeed: number,
  ): SpawnPlanEntry[] {
    if (metrics.length === 0) {
      return [];
    }

    const planDistancePx = this.getPlanDistancePx();
    const plan: SpawnPlanEntry[] = [];
    let covered = 0;
    let index = offsetSeed;
    const maxEntries = 2000;

    while (covered < planDistancePx && plan.length < maxEntries) {
      const metric = metrics[index % metrics.length];
      const slotWidth = metric.displayWidth + this.gapPx;
      plan.push({
        imageUrl: metric.imageUrl,
        displayWidth: metric.displayWidth,
        slotWidth,
        phasePx: covered,
      });
      covered += slotWidth;
      index += 1;
    }

    return plan;
  }

  private getPlanDistancePx(): number {
    const travelTarget = (this.speedPxPerSec * this.requestedDurationMs) / 1000;
    const coverageTarget = this.W + OFFSCREEN_PADDING * 2;
    return Math.max(travelTarget, coverageTarget);
  }

  private spawnPlannedImage(
    item: SpawnPlanEntry,
    rowY: number,
    direction: RowDirection,
  ): void {
    const startX =
      direction === "ltr" ? -item.displayWidth : this.W + item.displayWidth;
    const endX =
      direction === "ltr" ? this.W + item.displayWidth : -item.displayWidth;
    const travelMs = this.computeTravelDurationMs(item.displayWidth);

    const image = new ImageElement({
      imageUrl: item.imageUrl,
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

    this.addChild(image);
  }

  private computeTravelDurationMs(displayWidth: number): number {
    const distance = this.W + displayWidth * 2;
    return Math.max(1, (distance / this.speedPxPerSec) * 1000);
  }

  private slotToIntervalMs(slotWidth: number): number {
    return Math.max(16, (slotWidth / this.speedPxPerSec) * 1000);
  }

  private estimateRowLifetimeMs(plan: SpawnPlanEntry[]): number {
    if (plan.length === 0) {
      return 0;
    }

    let lastSpawnTimeMs = 0;
    for (let i = 0; i < plan.length - 1; i++) {
      lastSpawnTimeMs += this.slotToIntervalMs(plan[i].slotWidth);
    }

    const maxTravelMs = Math.max(
      ...plan.map((entry) => this.computeTravelDurationMs(entry.displayWidth)),
    );

    return lastSpawnTimeMs + maxTravelMs;
  }
}
