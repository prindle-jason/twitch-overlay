import { SceneElement } from "./SceneElement";
import { ImageElement } from "../ImageElement";
import { RichTextElement } from "../RichTextElement";
import { SoundElement } from "../SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { ImageFadeInOutBehavior } from "../behaviors/ImageFadeInOutBehavior";
import type { Range } from "../../utils/random";
import { TranslateBehavior } from "../behaviors/TranslateBehavior";

interface EmoteData {
  name: string;
  url: string;
  start: number;
  end: number;
}

interface TickerConfig {
  message?: string;
  cleanMessage?: string;
  emotes?: EmoteData[];
}

type TickerState = "FADE_IN" | "TEXT_SCROLLING" | "FADE_OUT" | "FINISHED";

export class TickerScene extends SceneElement {
  private message: string;
  private emotes: EmoteData[];
  private tickerState: TickerState = "FADE_IN";

  private readonly fadeTimeMs = 1000;
  private readonly textScrollSpeed = 300;

  private tickerText!: RichTextElement;
  private tickerBackground!: ImageElement;
  private textScrollDuration = 0;
  private fadeOutStart = 0;

  constructor(cfg: TickerConfig = {}) {
    super();
    this.duration = -1; // Will be calculated after text measurement
    this.message = cfg.cleanMessage || cfg.message || "";
    this.emotes = cfg.emotes || [];
    this.createTickerElements();
  }

  private createTickerElements(): void {
    this.tickerText = new RichTextElement(this.message, this.emotes, {
      fontSize: 72,
      color: "#220022",
      font: "Arial",
      fontWeight: "bold",
      textBaseline: "middle",
      textAlign: "left",
      strokeColor: "#000000",
      strokeWidth: 2,
      emoteHeight: 90,
      emotePadding: 4,
    });

    const textWidth = this.tickerText.getTextWidth();
    const scrollDistance = this.W + textWidth;
    this.textScrollDuration = (scrollDistance / this.textScrollSpeed) * 1000;

    this.duration = this.fadeTimeMs + this.textScrollDuration + this.fadeTimeMs;
    this.fadeOutStart = this.fadeTimeMs + this.textScrollDuration;

    this.tickerBackground = new ImageElement("breakingNews");
    this.tickerBackground.x = 0;
    this.tickerBackground.y = 0;
    this.tickerBackground.opacity = 0;

    const fadeTimePercent = (this.fadeTimeMs * 2) / this.duration;
    this.tickerBackground.addChild(new ImageFadeInOutBehavior(fadeTimePercent));

    this.tickerText.x = this.W;
    this.tickerText.y = this.H - 100;
    this.tickerText.visible = false;

    this.addChild(this.tickerBackground);
    this.addChild(this.tickerText);

    const tickerSound = new SoundElement("tickerSound");
    tickerSound.addChild(new SoundOnPlayBehavior());
    this.addChild(tickerSound);
  }

  override play(): void {
    super.play();
    this.tickerState = "FADE_IN";
  }

  private startTextScrolling(): void {
    const textWidth = this.tickerText.getTextWidth();

    const translateBehavior = new TranslateBehavior({
      startX: this.W,
      startY: this.tickerText.y,
      endX: -textWidth,
      endY: this.tickerText.y,
      duration: this.textScrollDuration,
    });

    this.tickerText.addChild(translateBehavior);
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    switch (this.tickerState) {
      case "FADE_IN":
        if (this.elapsed >= this.fadeTimeMs) {
          this.tickerState = "TEXT_SCROLLING";
          this.tickerText.visible = true;
          this.startTextScrolling();
        }
        break;

      case "TEXT_SCROLLING":
        if (this.elapsed >= this.fadeOutStart) {
          this.tickerState = "FADE_OUT";
          this.tickerText.visible = false;
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
}
