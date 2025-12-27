// effects/TickerEffect.js
import { BaseEffect } from "./BaseEffect.js";
import { ImageElement } from "../elements/ImageElement.js";
import { RichTextElement } from "../elements/RichTextElement.js";
import { SoundElement } from "../elements/SoundElement.js";
import { TimedSlideBehavior } from "../behaviors/TimedSlideBehavior.js";
import { TextScrollBehavior } from "../behaviors/TextScrollBehavior.js";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior.js";
import { ImageFadeInOutBehavior } from "../behaviors/ImageFadeInOutBehavior.js";

// Ticker effect states
const TICKER_STATES = {
  FADE_IN: "FADE_IN",
  TEXT_SCROLLING: "TEXT_SCROLLING",
  FADE_OUT: "FADE_OUT",
  FINISHED: "Finished",
};

export class TickerEffect extends BaseEffect {
  constructor({ W, H, message = "", cleanMessage = "", emotes = [] }) {
    // Initialize with placeholder duration, will be calculated after text element
    super({ W, H, duration: -1 });

    // Use cleanMessage if available (message with !ticker prefix removed), otherwise fall back to message
    this.message = cleanMessage || message;
    this.emotes = emotes;
    this.W = W;
    this.H = H;

    // Ticker configuration
    this.FADE_TIME = 1000; // 1 second for fade in/out in milliseconds
    this.TEXT_SCROLL_SPEED = 300; // pixels per second
    this.TICKER_HEIGHT = 80;
    this.TICKER_Y_POSITION = H - this.TICKER_HEIGHT; // Position from bottom

    // Pre-calculated durations (will be set in createTickerElements)
    this.textScrollDuration = 0;
    this.fadeOutStart = 0;

    // State management
    this.state = TICKER_STATES.FADE_IN;
    this.isInitialized = false;

    // Element references
    this.tickerText = null;
    this.textScrollBehavior = null;

    // Create the ticker elements (including text measurement and duration calculation)
    this.createTickerElements();
  }

  createTickerElements() {
    // Create the text element to calculate its width
    this.tickerText = new RichTextElement(this.message, this.emotes, {
      fontSize: 72,
      color: "#220022",
      font: "Arial",
      fontWeight: "bold",
      textBaseline: "middle",
      textAlign: "left", // Left align for scrolling
      strokeColor: "#000000",
      strokeWidth: 2,
      emoteHeight: 90,
      emotePadding: 4,
    });

    // Calculate scroll distance and duration
    const textWidth = this.tickerText.getTextWidth();
    const scrollDistance = this.W + textWidth;
    this.textScrollDuration = (scrollDistance / this.TEXT_SCROLL_SPEED) * 1000; // Convert to ms

    // Calculate and set total effect duration: fade in + text scroll + fade out
    this.duration = this.FADE_TIME + this.textScrollDuration + this.FADE_TIME;
    this.fadeOutStart = this.FADE_TIME + this.textScrollDuration;

    // Create the background image element
    this.tickerBackground = ImageElement.fromImage("breakingNews");
    this.tickerBackground.x = 0;
    this.tickerBackground.y = 0;
    this.tickerBackground.width = this.W;
    this.tickerBackground.height = this.H;
    this.tickerBackground.opacity = 0; // Start invisible for fade in

    // Calculate total effect duration and fade percentage
    const fadeTimePercent = (this.FADE_TIME * 2) / this.duration;
    this.tickerBackground.addBehavior(
      new ImageFadeInOutBehavior({
        fadeTime: fadeTimePercent,
      })
    );

    // Position text starting off-screen to the right and vertically centered in image's white box
    // White box: 100px tall, starts 50px from bottom, so middle is at H - 100
    this.tickerText.x = this.W; // Start at screen width
    this.tickerText.y = this.H - 100; // Center vertically in white box

    // Initially hide the text (will show during TEXT_SCROLLING state)
    this.tickerText.visible = false;

    // Add elements to the effect
    // this.addElement(this.tickerBox); // Commented out - using image instead
    this.addElement(this.tickerBackground);
    this.addElement(this.tickerText);

    // Create sound element
    this.tickerSound = new SoundElement("breakingNews");
    this.tickerSound.addBehavior(new SoundOnPlayBehavior());
    this.addElement(this.tickerSound);
  }

  onPlay() {
    super.onPlay();

    console.log("TickerEffect: Starting ticker effect");
    console.log("TickerEffect: Message:", this.message);
    console.log("TickerEffect: Emotes:", this.emotes);

    // Start with fade in
    this.state = TICKER_STATES.FADE_IN;
    this.tickerBackground.behaviors[0].onPlay(this.tickerBackground);
    this.isInitialized = true;
  }

  startTextScrolling() {
    console.log("TickerEffect: Starting text scrolling");
    console.log(`Text scroll duration: ${this.textScrollDuration}ms`);

    // Calculate scroll position: from screen width to -textWidth
    const textWidth = this.tickerText.getTextWidth();

    this.textScrollBehavior = new TimedSlideBehavior({
      startX: this.W, // Start at screen width
      startY: this.tickerText.y,
      endX: -textWidth, // End at negative text width
      endY: this.tickerText.y,
      duration: this.textScrollDuration,
    });

    this.tickerText.addBehavior(this.textScrollBehavior);
    this.textScrollBehavior.onPlay(this.tickerText);
  }

  update(deltaTime) {
    if (!this.isInitialized) return;

    // Update all elements first (including animated emotes)
    super.update(deltaTime);

    // Specifically update our ticker text for animated emotes
    // if (this.tickerText) {
    //     this.tickerText.update(deltaTime);
    // }

    // State machine logic - use elapsed time to determine state transitions
    switch (this.state) {
      case TICKER_STATES.FADE_IN:
        if (this.elapsed >= this.FADE_TIME) {
          console.log(
            "TickerEffect: Fade in complete, starting text scrolling"
          );
          this.state = TICKER_STATES.TEXT_SCROLLING;
          // Show the text and start scrolling
          this.tickerText.visible = true;
          this.startTextScrolling();
        }
        break;

      case TICKER_STATES.TEXT_SCROLLING:
        if (this.elapsed >= this.fadeOutStart) {
          console.log(
            "TickerEffect: Text scrolling complete, starting fade out"
          );
          this.state = TICKER_STATES.FADE_OUT;
          // Hide the text
          this.tickerText.visible = false;
        }
        break;

      case TICKER_STATES.FADE_OUT:
        if (this.elapsed >= this.duration) {
          console.log("TickerEffect: Fade out complete, ticker finished");
          this.state = TICKER_STATES.FINISHED;
          this.onFinish();
        }
        break;

      case TICKER_STATES.FINISHED:
        // Do nothing, effect is complete
        break;
    }
  }
}
