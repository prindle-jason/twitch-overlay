import { SceneElement } from "../SceneElement";
import { SoundElement } from "../../primitives/SoundElement";
import { BoxElement } from "../../primitives/BoxElement";
import { getRandomInRange, type Range } from "../../../utils/random";
import { SoundOnPlayBehavior } from "../../behaviors/SoundOnPlayBehavior";
import { SchedulerElement } from "../../composites/SchedulerElement";
import { JitterBehavior } from "../../behaviors/JitterBehavior";
import { TranslateBehavior } from "../../behaviors/TranslateBehavior";

const GLITCH_DURATION_MS = 3000;
const LINE_HEIGHT_RANGE: Range = { min: 3, max: 10 };
const LINE_WIDTH_PADDING = 100;
const LINE_JITTER_RANGE: Range = { min: 10, max: 30 };
const BOX_SPAWN_INTERVAL: Range = { min: 100, max: 300 };
const LINE_SPAWN_INTERVAL: Range = { min: 800, max: 1200 };
const BOX_DURATION_RANGE: Range = { min: 100, max: 500 };
const LINE_DURATION_RANGE: Range = { min: 100, max: 500 };
const BOX_WIDTH_RANGE: Range = { min: 500, max: 1500 };
const BOX_HEIGHT_RANGE: Range = { min: 10, max: 60 };

/**
 * Generate a random rainbow color using HSL.
 * @param alpha - Optional alpha value (0-1)
 * @returns CSS color string
 */
function getRandomRainbowColor(alpha?: number): string {
  const hue = Math.random() * 360;
  const saturation = 100;
  const lightness = 50;
  if (alpha !== undefined) {
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
  }
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

interface GlitchConfig {
  soundUrl?: string;
  duration?: number;
}

/**
 * GlitchScene creates a chaotic visual and audio glitch effect.
 * Features corrupted audio and random visual artifacts.
 */
export class GlitchScene extends SceneElement {
  readonly type = "glitch" as const;

  private soundUrl: string;
  private noiseSound: SoundElement | null = null;
  private boxScheduler: SchedulerElement | null = null;
  private lineScheduler: SchedulerElement | null = null;

  constructor(config?: GlitchConfig) {
    super();
    this.duration = config?.duration ?? GLITCH_DURATION_MS;
    this.soundUrl = config?.soundUrl ?? "/audio/glitch.mp3";
  }

  override async init(): Promise<void> {
    // Create glitch sound (white noise-like effect)
    // For now, we'll use a generic sound; in future could synthesize
    this.noiseSound = new SoundElement(this.soundUrl);
    this.noiseSound.addChild(new SoundOnPlayBehavior());
    this.noiseSound.baseVolume = 0.7;
    this.addChild(this.noiseSound);

    // Create scheduler for spawning box artifacts
    this.boxScheduler = new SchedulerElement({
      interval: BOX_SPAWN_INTERVAL,
      onTick: () => this.spawnBox(),
    });
    this.addChild(this.boxScheduler);

    // Create scheduler for spawning line artifacts
    this.lineScheduler = new SchedulerElement({
      interval: LINE_SPAWN_INTERVAL,
      onTick: () => this.spawnLine(),
    });
    this.addChild(this.lineScheduler);

    await super.init();
  }

  private spawnBox(): void {
    const startX = Math.random() * this.W;
    const startY = Math.random() * this.H;
    const box = new BoxElement({
      x: startX,
      y: startY,
      width: getRandomInRange(BOX_WIDTH_RANGE),
      height: getRandomInRange(BOX_HEIGHT_RANGE),
      color: getRandomRainbowColor(0.25 + Math.random() * 0.5),
      duration: getRandomInRange(BOX_DURATION_RANGE),
    });
    box.addChild(
      new TranslateBehavior({
        startX,
        startY,
        endX: startX + (Math.random() > 0.5 ? this.W : -this.W),
        endY: startY,
      }),
    );
    this.addChild(box);
  }

  private spawnLine(): void {
    const line = new BoxElement({
      x: -LINE_WIDTH_PADDING,
      y: Math.random() * this.H,
      width: this.W + LINE_WIDTH_PADDING * 2,
      height: getRandomInRange(LINE_HEIGHT_RANGE),
      color: getRandomRainbowColor(0.25 + Math.random() * 0.5),
      duration: getRandomInRange(LINE_DURATION_RANGE),
    });

    line.addChild(
      new JitterBehavior({ jitterAmount: getRandomInRange(LINE_JITTER_RANGE) }),
    );
    this.addChild(line);
  }
}
