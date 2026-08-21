import { TransformElement } from "../primitives/TransformElement";

const RAINBOW_COLORS = [
  "#ee1111",
  "#ee8811",
  "#eeee11",
  "#33ee11",
  "#0088ee",
  "#6633ee",
] as const;

const GOLD_COLORS = [
  "#997700",
  "#cc9922",
  "#ffee66",
  "#eecc55",
  "#998800",
  "#775500",
] as const;

type ColorPalette = "rainbow" | "gold";

const PALETTES: Record<ColorPalette, readonly string[]> = {
  rainbow: RAINBOW_COLORS,
  gold: GOLD_COLORS,
};

export interface RainbowStampConfig {
  x: number;
  y: number;
  stampWidth: number;
  stripeHeight: number;
  duration: number;
  palette?: ColorPalette;
}

export class RainbowStampElement extends TransformElement {
  private stripeHeight: number;
  private stampWidth: number;
  private colors: readonly string[];

  constructor(config: RainbowStampConfig) {
    super({ x: config.x, y: config.y, duration: config.duration });
    this.stripeHeight = config.stripeHeight;
    this.stampWidth = config.stampWidth;
    this.colors = PALETTES[config.palette ?? "rainbow"];
    this.setWidth(this.stampWidth);
    this.setHeight(config.stripeHeight * this.colors.length);
  }

  protected override updateSelf(): void {
    this.opacity = 1 - this.getProgress();
  }

  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.colors.length; i++) {
      ctx.fillStyle = this.colors[i];
      ctx.fillRect(0, i * this.stripeHeight, this.stampWidth, this.stripeHeight);
    }
  }
}
