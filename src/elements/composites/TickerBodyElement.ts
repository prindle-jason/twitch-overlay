import { TransformElement } from "../primitives/TransformElement";
import { BoxElement } from "../primitives/BoxElement";
import { GridLayoutElement } from "./GridLayoutElement";
import { SchedulerElement } from "./SchedulerElement";
import { TranslateBehavior } from "../behaviors/TranslateBehavior";
import { TimingCurve } from "../../utils/timing/TimingCurves";
import { Range, getRandomInRange } from "../../utils/random";
import { randomGrayShade } from "../../utils/colors";

export interface TickerBodyConfig {
  width: number;
  y: number;
  messageGrid: GridLayoutElement;
  height?: number;
  borderThickness?: number;
  bgColor?: string;
  fgColor?: string;
  messageMarginLeft?: number;
  stripIntervalMs?: Range;
  stripHeightPct?: Range;
  stripWidthPx?: Range;
  stripLifetimeMs?: number;
  stripVerticalPadding?: number;
  messageVerticalOffset?: number;
  stripLightnessPct?: Range;
}

/**
 * Composite element representing the ticker body with background/foreground layers,
 * message grid, and decorative scrolling strips.
 */
export class TickerBodyElement extends TransformElement {
  private background: BoxElement;
  private foreground: BoxElement;
  private messageGrid: GridLayoutElement;
  private stripScheduler: SchedulerElement;

  // Element-owned properties with defaults
  private bodyWidth: number;
  private bodyY: number;
  private bodyHeight: number;
  private borderThickness: number;
  private bgColor: string;
  private fgColor: string;
  private messageMarginLeft: number;
  private stripIntervalMs: Range;
  private stripHeightPct: Range;
  private stripWidthPx: Range;
  private stripLifetimeMs: number;
  private stripVerticalPadding: number;
  private messageVerticalOffset: number;
  private stripLightnessPct: Range;

  constructor(config: TickerBodyConfig) {
    super();

    // Assign defaults inline; config values override when provided
    this.bodyWidth = config.width;
    this.bodyY = config.y;
    this.messageGrid = config.messageGrid;
    this.bodyHeight = config.height ?? 100;
    this.borderThickness = config.borderThickness ?? 10;
    this.bgColor = config.bgColor ?? "#f0f0f0";
    this.fgColor = config.fgColor ?? "#ffffff";
    this.messageMarginLeft = config.messageMarginLeft ?? 24;
    this.stripIntervalMs = config.stripIntervalMs ?? { min: 180, max: 420 };
    this.stripHeightPct = config.stripHeightPct ?? { min: 0.1, max: 0.3 };
    this.stripWidthPx = config.stripWidthPx ?? { min: 120, max: 260 };
    this.stripLifetimeMs = config.stripLifetimeMs ?? 6000;
    this.stripVerticalPadding = config.stripVerticalPadding ?? 6;
    this.messageVerticalOffset = config.messageVerticalOffset ?? 0;
    this.stripLightnessPct = config.stripLightnessPct ?? { min: 50, max: 80 };

    // Position the element itself at the target body Y; children use local coords
    this.y = this.bodyY;

    this.background = new BoxElement({
      x: 0,
      y: 0,
      width: this.bodyWidth,
      height: this.bodyHeight,
      color: this.bgColor,
    });

    const fgHeight = this.getForegroundHeight();

    this.foreground = new BoxElement({
      x: 0,
      y: this.borderThickness,
      width: this.bodyWidth,
      height: fgHeight,
      color: this.fgColor,
    });

    // Strip scheduler disabled for now (z-index rendering issue)
    this.stripScheduler = new SchedulerElement({
      interval: this.stripIntervalMs,
      onTick: () => this.spawnDecorativeStrip(),
    });
    // this.foreground.addChild(this.stripScheduler);

    this.layoutMessageGrid();
    this.foreground.addChild(this.messageGrid);

    this.addChild(this.background);
    this.addChild(this.foreground);
  }

  getBodyY(): number {
    return this.bodyY;
  }

  getMessageGridWidth(): number {
    return this.messageGrid.getWidth() ?? 0;
  }

  setTextStartX(x: number): void {
    this.messageGrid.x = x;
  }

  override play(): void {
    super.play();
    // GridLayoutElement computes width/height during play; re-layout after that measurement pass.
    this.layoutMessageGrid();
  }

  /** Slide the body in from below the screen. Call after play(). */
  startSlideIn(screenHeight: number, duration: number): void {
    this.addChild(
      new TranslateBehavior({
        startX: 0,
        startY: screenHeight,
        endX: 0,
        endY: this.bodyY,
        duration,
        timingFunction: TimingCurve.EASE_OUT_QUAD,
      }),
    );
  }

  /** Slide the body back down off-screen. */
  startSlideOut(screenHeight: number, duration: number): void {
    this.addChild(
      new TranslateBehavior({
        startX: 0,
        startY: this.bodyY,
        endX: 0,
        endY: screenHeight,
        duration,
        timingFunction: TimingCurve.EASE_IN_QUAD,
      }),
    );
  }

  /** Start the message grid scrolling right-to-left across the body. */
  startTextScroll(screenWidth: number, scrollSpeedPxPerMs: number): void {
    const textWidth = this.messageGrid.getWidth() ?? 0;
    const duration = (screenWidth + textWidth) / scrollSpeedPxPerMs;
    this.messageGrid.addChild(
      new TranslateBehavior({
        startX: screenWidth,
        startY: this.messageGrid.y,
        endX: -textWidth,
        endY: this.messageGrid.y,
        duration,
        timingFunction: TimingCurve.LINEAR,
      }),
    );
  }

  private getForegroundHeight(): number {
    return this.bodyHeight - this.borderThickness * 2;
  }

  private layoutMessageGrid(): void {
    const fgHeight = this.getForegroundHeight();
    const gridHeight = this.messageGrid.getHeight() ?? 0;
    this.messageGrid.x = this.messageMarginLeft;
    this.messageGrid.y =
      (fgHeight - gridHeight) / 2 + this.messageVerticalOffset;
  }

  private spawnDecorativeStrip(): void {
    const fgWidth = this.foreground.getWidth() ?? this.bodyWidth;
    const fgHeight = this.foreground.getHeight() ?? this.getForegroundHeight();

    const heightPct = getRandomInRange(this.stripHeightPct);
    const stripHeight = Math.max(1, fgHeight * heightPct);

    const maxY = Math.max(
      this.stripVerticalPadding,
      fgHeight - stripHeight - this.stripVerticalPadding,
    );
    const stripY = getRandomInRange({
      min: this.stripVerticalPadding,
      max: maxY,
    });

    const stripWidth = getRandomInRange(this.stripWidthPx);
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? -stripWidth : fgWidth;

    const endX = fromLeft ? fgWidth : -stripWidth;

    const strip = new BoxElement({
      x: startX,
      y: stripY,
      width: stripWidth,
      height: stripHeight,
      color: randomGrayShade(
        this.stripLightnessPct.min,
        this.stripLightnessPct.max,
      ),
      duration: this.stripLifetimeMs,
    });

    strip.addChild(
      new TranslateBehavior({
        startX,
        startY: stripY,
        endX,
        endY: stripY,
        duration: this.stripLifetimeMs,
        timingFunction: TimingCurve.LINEAR,
      }),
    );

    this.foreground.addChild(strip);
  }
}
