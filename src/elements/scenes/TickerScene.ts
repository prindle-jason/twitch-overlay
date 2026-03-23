import { SceneElement } from "./SceneElement";
import { BoxElement } from "../primitives/BoxElement";
import { TextElement } from "../primitives/TextElement";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { TranslateBehavior } from "../behaviors/TranslateBehavior";
import { TickerBodyElement } from "../composites/TickerBodyElement";
import { Emote } from "../../utils/chat/chatTypes";
import { buildMessageGrid } from "../../utils/chat/buildMessageGrid";
import { localSounds } from "../../utils/assets/sounds";
import { TimingCurve } from "../../utils/timing/TimingCurves";

interface TickerConfig {
  message?: string;
  cleanMessage?: string;
  emotes?: Emote[];
}

type TickerState = "SLIDE_IN" | "TEXT_SCROLLING" | "SLIDE_OUT" | "FINISHED";

// --- Tunable constants ---

const HEADER_LABEL = "BREAKING NEWS";
const HEADER_FONT_FAMILY = "Arial";
const HEADER_FONT_SIZE = 48;
const HEADER_FONT_WEIGHT = "bold";
const HEADER_TEXT_COLOR = "#ffffff";
const HEADER_BG_COLOR = "#ff4fa3";
const HEADER_PADDING_X = 5;
const HEADER_PADDING_Y = 5;
const HEADER_MARGIN_LEFT = 10;
const HEADER_GAP_BELOW = 10;

const BODY_TOP_OFFSET = 150;

const TEXT_FONT_FAMILY = "Arial";
const TEXT_FONT_SIZE = 48;
const TEXT_FONT_WEIGHT = "bold";
const TEXT_COLOR = "#220022";
const EMOTE_HEIGHT = 72;
const TEXT_GAP = 6;

// px per ms (300 px/s)
const TEXT_SCROLL_SPEED_PX_MS = 0.3;

const SLIDE_IN_DURATION_MS = 600;
const SLIDE_OUT_DURATION_MS = 600;

export class TickerScene extends SceneElement {
  readonly type = "ticker" as const;

  private message: string;
  private emotes: Emote[];

  private headerBox!: BoxElement;
  private headerText!: TextElement;
  private tickerBody!: TickerBodyElement;

  private tickerState: TickerState = "SLIDE_IN";
  private slideOutStart = 0;

  constructor(cfg: TickerConfig = {}) {
    super();
    this.message = cfg.cleanMessage || cfg.message || "";
    this.emotes = cfg.emotes || [];
  }

  override async init(): Promise<void> {
    this.headerText = new TextElement({
      text: HEADER_LABEL,
      font: HEADER_FONT_FAMILY,
      fontSize: HEADER_FONT_SIZE,
      fontWeight: HEADER_FONT_WEIGHT,
      color: HEADER_TEXT_COLOR,
      textBaseline: "top",
    });

    this.headerBox = new BoxElement({ color: HEADER_BG_COLOR });
    this.headerBox.addChild(this.headerText);

    const messageGrid = buildMessageGrid({
      message: this.message,
      emotes: this.emotes,
      fontFamily: TEXT_FONT_FAMILY,
      fontSize: TEXT_FONT_SIZE,
      fontWeight: TEXT_FONT_WEIGHT,
      textColor: TEXT_COLOR,
      emoteHeight: EMOTE_HEIGHT,
      gap: TEXT_GAP,
    });

    const bodyY = this.H - BODY_TOP_OFFSET;
    this.tickerBody = new TickerBodyElement({
      width: this.W,
      y: bodyY,
      messageGrid,
    });

    const sound = new SoundElement(localSounds.tickerSound);
    sound.addChild(new SoundOnPlayBehavior());

    this.addChild(this.tickerBody);
    this.addChild(this.headerBox);
    this.addChild(sound);

    await super.init();
  }

  override play(): void {
    super.play();

    // Layout header at its target position
    this.layoutHeader();

    // Pre-calculate timing so duration is known before the first update
    const textWidth = this.tickerBody.getMessageGridWidth();
    const textScrollDuration = (this.W + textWidth) / TEXT_SCROLL_SPEED_PX_MS;
    this.slideOutStart = SLIDE_IN_DURATION_MS + textScrollDuration;
    this.duration = this.slideOutStart + SLIDE_OUT_DURATION_MS;

    // Keep text parked off-screen right during SLIDE_IN to avoid left-side pop-in.
    this.tickerBody.setTextStartX(this.W);

    // Slide body in from below
    this.tickerBody.startSlideIn(this.H, SLIDE_IN_DURATION_MS);

    // Slide header in from the left
    const headerWidth = this.headerBox.getWidth() ?? 0;
    const headerY = this.headerBox.y;
    this.headerBox.addChild(
      new TranslateBehavior({
        startX: -headerWidth,
        startY: headerY,
        endX: HEADER_MARGIN_LEFT,
        endY: headerY,
        duration: SLIDE_IN_DURATION_MS,
        timingFunction: TimingCurve.EASE_OUT_QUAD,
      }),
    );

    this.tickerState = "SLIDE_IN";
  }

  private layoutHeader(): void {
    const headerWidth = this.headerText.getWidth() + HEADER_PADDING_X * 2;
    const headerHeight = this.headerText.getHeight() + HEADER_PADDING_Y * 2;

    this.headerBox.setWidth(headerWidth);
    this.headerBox.setHeight(headerHeight);
    this.headerBox.x = HEADER_MARGIN_LEFT;
    this.headerBox.y =
      this.H - (BODY_TOP_OFFSET + headerHeight + HEADER_GAP_BELOW);

    this.headerText.x = HEADER_PADDING_X;
    this.headerText.y = HEADER_PADDING_Y;
  }

  protected override updateSelf(_deltaTime: number): void {
    switch (this.tickerState) {
      case "SLIDE_IN":
        if (this.elapsed >= SLIDE_IN_DURATION_MS) {
          this.tickerState = "TEXT_SCROLLING";
          this.tickerBody.startTextScroll(this.W, TEXT_SCROLL_SPEED_PX_MS);
        }
        break;

      case "TEXT_SCROLLING":
        if (this.elapsed >= this.slideOutStart) {
          this.tickerState = "SLIDE_OUT";

          // Slide body back off-screen downward
          this.tickerBody.startSlideOut(this.H, SLIDE_OUT_DURATION_MS);

          // Slide header back off-screen to the left
          const headerWidth = this.headerBox.getWidth() ?? 0;
          const headerY = this.headerBox.y;
          this.headerBox.addChild(
            new TranslateBehavior({
              startX: HEADER_MARGIN_LEFT,
              startY: headerY,
              endX: -headerWidth,
              endY: headerY,
              duration: SLIDE_OUT_DURATION_MS,
              timingFunction: TimingCurve.EASE_IN_QUAD,
            }),
          );
        }
        break;

      case "SLIDE_OUT":
        // auto-finished by this.duration
        break;
    }
  }

  override finish(): void {
    super.finish();
    this.headerBox = null as any;
    this.headerText = null as any;
    this.tickerBody = null as any;
  }
}
