import { SceneElement } from "./SceneElement";
import { ImageElement } from "../primitives/ImageElement";
import { TransformElement } from "../primitives/TransformElement";
import { TranslateBehavior } from "../behaviors/TranslateBehavior";
import { ImageLoader } from "../../utils/assets/ImageLoader";
import { TimingCurve } from "../../utils/timing/TimingCurves";
import { logger } from "../../utils/logger";
import { Sequence } from "../../utils/timing/Sequence";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";

interface SideSlideConfig {
  imageUrl: string;
  soundUrl?: string;
  rows?: number;
  rowDelaySec?: number;
  slideDurationSec?: number;
  rowGapPx?: number;
}

const DEFAULT_ROWS = 3;
const DEFAULT_ROW_DELAY_SEC = 0.12;
const DEFAULT_SLIDE_DURATION_SEC = 1.5;
const DEFAULT_ROW_GAP_PX = 8;
const BUFFER_MS = 500;
const IMAGE_BUFFER_GAP_PX = 25;

/**
 * SideSlideScene: A grid of image rows that slide in from the left and right
 * simultaneously, pause on screen, then slide back off. Each row is staggered
 * by a short delay, producing a cascading "wave" effect down the screen.
 *
 * Right-side images are horizontally mirrored.
 *
 * Parameters:
 *   imageUrl        - URL of the image to display in every row
 *   rows            - Number of rows (1–20, default 3)
 *   rowDelaySec     - Stagger delay between consecutive rows in seconds (default 0.12)
 *   slideDurationSec- Duration of each row's full slide-in/pause/slide-out cycle (default 1.5)
 *   rowGapPx        - Vertical gap between rows in pixels (default 8)
 */
export class SideSlideScene extends SceneElement {
  readonly type = "sideSlide" as const;

  private readonly imageUrl: string;
  private readonly soundUrl?: string;
  private readonly rows: number;
  private readonly rowDelayMs: number;
  private readonly slideDurationMs: number;
  private readonly rowGapPx: number;
  private readonly rowHeight: number;

  private imageDisplayScale = 1;
  private imageDisplayWidth = 0;

  private rowIndex = 0;
  private timeSinceLastRow = 0;

  constructor(config: SideSlideConfig) {
    super();

    this.imageUrl = config.imageUrl;
    this.soundUrl = config.soundUrl;
    this.rows = config.rows ?? DEFAULT_ROWS;
    this.rowDelayMs = (config.rowDelaySec ?? DEFAULT_ROW_DELAY_SEC) * 1000;
    this.slideDurationMs =
      (config.slideDurationSec ?? DEFAULT_SLIDE_DURATION_SEC) * 1000;
    this.rowGapPx = Math.max(0, config.rowGapPx ?? DEFAULT_ROW_GAP_PX);

    const totalGap = this.rowGapPx * (this.rows - 1);
    this.rowHeight = Math.max(1, (this.H - totalGap) / this.rows);

    this.duration =
      this.rowDelayMs * (this.rows - 1) + this.slideDurationMs + BUFFER_MS;
  }

  override async init(): Promise<void> {
    try {
      const loaded = await ImageLoader.load(this.imageUrl);
      let naturalWidth: number;
      let naturalHeight: number;

      if (loaded.isAnimated) {
        const seq = loaded.image as Sequence<ImageData>;
        const frame = seq.getCurrent()!;
        naturalWidth = frame.width;
        naturalHeight = frame.height;
      } else {
        const img = loaded.image as HTMLImageElement;
        naturalWidth = img.naturalWidth;
        naturalHeight = img.naturalHeight;
      }

      if (naturalHeight > 0) {
        this.imageDisplayScale = this.rowHeight / naturalHeight;
        this.imageDisplayWidth = naturalWidth * this.imageDisplayScale;
      }
    } catch (err) {
      logger.warn("[SideSlideScene] Failed to preload image for dimensions", {
        url: this.imageUrl,
      });
    }

    if (this.soundUrl) {
      const sound = new SoundElement(this.soundUrl);
      sound.addChild(new SoundOnPlayBehavior());
      this.addChild(sound);
    }

    await super.init();
  }

  override play(): void {
    // Seed the accumulator so the first row fires on the very first update.
    this.timeSinceLastRow = this.rowDelayMs;
    super.play();
  }

  protected override updateSelf(deltaTime: number): void {
    if (this.rowIndex >= this.rows) return;

    this.timeSinceLastRow += deltaTime;
    while (
      this.timeSinceLastRow >= this.rowDelayMs &&
      this.rowIndex < this.rows
    ) {
      this.timeSinceLastRow -= this.rowDelayMs;
      this.spawnRow(this.rowIndex);
      this.rowIndex++;
    }
  }

  private spawnRow(i: number): void {
    const rowY = i * (this.rowHeight + this.rowGapPx);
    const scale = this.imageDisplayScale;
    const imgWidth = this.imageDisplayWidth;
    const slideMs = this.slideDurationMs;
    const fadeTime = 0.3;

    // --- Left image ---
    // Slides from off-screen left (-imgWidth) to the left edge (x=0).
    const leftImg = new ImageElement({
      imageUrl: this.imageUrl,
      scale,
      y: rowY,
    });
    leftImg.addChild(
      new TranslateBehavior({
        duration: slideMs,
        startX: -imgWidth - IMAGE_BUFFER_GAP_PX,
        startY: rowY,
        endX: IMAGE_BUFFER_GAP_PX,
        endY: rowY,
        timingFunction: TimingCurve.FADE_IN_OUT,
        fadeTime,
      }),
    );
    this.addChild(leftImg);

    // --- Right image (mirrored) ---
    // A FlipXContainer with scaleX=-1 acts as the positioned anchor; its child
    // ImageElement renders left-of-anchor, appearing as a mirrored image at the
    // right edge of the screen.
    //
    // When container.x = W   → image occupies [W - imgWidth, W]  (on-screen)
    // When container.x = W + imgWidth → image occupies [W, W + imgWidth] (off-screen)
    // const rightContainer = new FlipXContainer({
    //   scale: { x: -1, y: 1 },
    //   y: rowY,
    // });
    const rightImg = new ImageElement({
      imageUrl: this.imageUrl,
      scale: { x: -1, y: 1 },
      y: rowY,
    });

    rightImg.addChild(
      new TranslateBehavior({
        duration: slideMs,
        startX: this.W + imgWidth + IMAGE_BUFFER_GAP_PX,
        startY: rowY,
        endX: this.W - IMAGE_BUFFER_GAP_PX,
        endY: rowY,
        timingFunction: TimingCurve.FADE_IN_OUT,
        fadeTime,
      }),
    );
    this.addChild(rightImg);
  }
}
