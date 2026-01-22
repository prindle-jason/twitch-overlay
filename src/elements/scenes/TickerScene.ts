import { SceneElement } from "./SceneElement";
import { ImageElement } from "../primitives/ImageElement";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import { localImages } from "../../utils/assets/images";
import { localSounds } from "../../utils/assets/sounds";
import { TranslateBehavior } from "../behaviors/TranslateBehavior";
import { Emote } from "../../utils/chat/chatTypes";
import { GridLayoutElement } from "../composites/GridLayoutElement";
import { TextElement } from "../primitives/TextElement";
import { buildMessageParts } from "../../utils/chat/messageParts";
import { TimingCurve } from "../../utils/timing/TimingCurves";

interface TickerConfig {
  message?: string;
  cleanMessage?: string;
  emotes?: Emote[];
}

type TickerState = "FADE_IN" | "TEXT_SCROLLING" | "FADE_OUT" | "FINISHED";

export class TickerScene extends SceneElement {
  readonly type = "ticker" as const;
  private message: string;
  private emotes: Emote[];
  private tickerState: TickerState = "FADE_IN";

  private readonly fadeTimeMs = 1000;
  private readonly textScrollSpeed = 300;
  private readonly fontSize = 72;
  private readonly emoteHeight = 90;
  private readonly textColor = "#220022";

  private tickerTextGrid!: GridLayoutElement;
  private tickerBackground!: ImageElement;
  private textScrollDuration = 0;
  private fadeOutStart = 0;

  constructor(cfg: TickerConfig = {}) {
    super();
    this.message = cfg.cleanMessage || cfg.message || "";
    this.emotes = cfg.emotes || [];
  }

  override async init(): Promise<void> {
    // Create background image
    this.tickerBackground = new ImageElement({
      imageUrl: localImages.breakingNews,
    });
    this.tickerBackground.x = 0;
    this.tickerBackground.y = 0;
    this.tickerBackground.opacity = 0;
    this.addChild(this.tickerBackground);

    // Build message parts (text + emotes)
    const parts = buildMessageParts(this.message, this.emotes);
    this.tickerTextGrid = new GridLayoutElement({
      columns: 0,
      gap: 4,
      alignItems: "center",
      imageHeight: this.emoteHeight,
    });

    for (const part of parts) {
      if (part.type === "text") {
        this.tickerTextGrid.addChild(
          new TextElement({
            text: part.content,
            font: "Arial",
            fontSize: this.fontSize,
            fontWeight: "bold",
            color: this.textColor,
            textBaseline: "top",
          }),
        );
      } else {
        const img = new ImageElement({ imageUrl: part.content });
        this.tickerTextGrid.addChild(img);
      }
    }

    this.addChild(this.tickerTextGrid);

    // Add sound
    const tickerSound = new SoundElement(localSounds.tickerSound);
    tickerSound.addChild(new SoundOnPlayBehavior());
    this.addChild(tickerSound);

    await super.init();
  }

  override play(): void {
    super.play();

    // Now that elements are initialized, calculate dimensions and layout
    const textWidth = this.tickerTextGrid.getWidth() ?? 0;

    // Calculate scroll duration and total scene duration
    const scrollDistance = this.W + textWidth;
    this.textScrollDuration = (scrollDistance / this.textScrollSpeed) * 1000;
    this.duration = this.fadeTimeMs + this.textScrollDuration + this.fadeTimeMs;
    this.fadeOutStart = this.fadeTimeMs + this.textScrollDuration;

    // Configure fade behavior on background
    const fadeTimePercent = (this.fadeTimeMs * 2) / this.duration;
    this.tickerBackground.addChild(
      new FadeInOutBehavior({ fadeTime: fadeTimePercent }),
    );

    // Position text off-screen to the right
    const gridHeight = this.tickerTextGrid.getHeight() ?? 0;
    this.tickerTextGrid.x = this.W;
    this.tickerTextGrid.y = this.H - 100 - gridHeight / 2;

    this.tickerState = "FADE_IN";
  }

  private startTextScrolling(): void {
    const textWidth = this.tickerTextGrid.getWidth() ?? 0;

    const translateBehavior = new TranslateBehavior({
      startX: this.W,
      startY: this.tickerTextGrid.y,
      endX: -textWidth,
      endY: this.tickerTextGrid.y,
      duration: this.textScrollDuration,
      timingFunction: TimingCurve.LINEAR,
    });

    this.tickerTextGrid.addChild(translateBehavior);
  }

  protected override updateSelf(deltaTime: number): void {
    switch (this.tickerState) {
      case "FADE_IN":
        if (this.elapsed >= this.fadeTimeMs) {
          this.tickerState = "TEXT_SCROLLING";
          //this.tickerText.visible = true;
          this.startTextScrolling();
        }
        break;

      case "TEXT_SCROLLING":
        if (this.elapsed >= this.fadeOutStart) {
          this.tickerState = "FADE_OUT";
          //this.tickerText.visible = false;
        }
        break;

      case "FADE_OUT":
        if (this.elapsed >= this.duration) {
          this.tickerState = "FINISHED";
          this.finish();
          //this.setState("FINISHED");
        }
        break;

      case "FINISHED":
        break;
    }
  }

  override finish(): void {
    super.finish();
    // Clear element references to prevent memory leaks
    this.tickerTextGrid = null as any;
    this.tickerBackground = null as any;
  }
}
