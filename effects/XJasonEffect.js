// effects/XJasonEffect.js
import { BaseEffect } from "./BaseEffect.js";
import { TimedImageElement } from "../elements/TimedImageElement.js";
import { SoundElement } from "../elements/SoundElement.js";
import { ImageBlurInOutBehavior } from "../behaviors/ImageBlurInOutBehavior.js";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior.js";
import { ImageFadeInOutBehavior } from "../behaviors/__ImageFadeInOutBehavior.js";
import { ImageJitterBehavior } from "../behaviors/ImageJitterBehavior.js";
import { IntervalRangeTimer } from "../utils/IntervalRangeTimer.js";

export class XJasonEffect extends BaseEffect {
  constructor({ W, H }) {
    // heavyrain-jason.mp3 is approximately 18 seconds
    super({ W, H, duration: 18000 });

    // Popup configuration constants
    this.POPUP_MIN_INTERVAL = 500;
    this.POPUP_MAX_INTERVAL = 900;
    this.POPUP_MIN_DURATION = 1200;
    this.POPUP_MAX_DURATION = 1600;
    this.POPUP_WIDTH = 560;
    this.POPUP_HEIGHT = 120;

    // Initialize the popup spawner
    this.popupSpawner = new IntervalRangeTimer(
      this.POPUP_MIN_INTERVAL,
      this.POPUP_MAX_INTERVAL,
      () => this.trySpawnPopup()
    );

    // Add the sound element
    const sound = new SoundElement("heavyRainJason");
    sound.addBehavior(new SoundOnPlayBehavior());
    this.addElement(sound);
  }

  getRandomDuration() {
    return (
      this.POPUP_MIN_DURATION +
      Math.random() * (this.POPUP_MAX_DURATION - this.POPUP_MIN_DURATION)
    );
  }

  trySpawnPopup() {
    // Check if there's enough time left for a new popup
    const effectTimeRemaining = this.duration - this.elapsed;
    const newPopupDuration = this.getRandomDuration();

    // Only spawn if popup can complete before effect ends
    if (effectTimeRemaining >= newPopupDuration) {
      this.spawnPopup();
    }
  }

  spawnPopup() {
    // Create timed popup with random duration
    const duration = this.getRandomDuration();
    const popup = new TimedImageElement("xJason", duration);

    // Set size and random position
    popup.width = this.POPUP_WIDTH;
    popup.height = this.POPUP_HEIGHT;
    popup.x = Math.random() * (this.W - this.POPUP_WIDTH);
    popup.y = Math.random() * (this.H - this.POPUP_HEIGHT);

    // Add behaviors for jitter, fade, and blur effects
    popup.addBehavior(new ImageJitterBehavior({ jitterAmount: 6 }));
    popup.addBehavior(new ImageFadeInOutBehavior({ fadeTime: 0.4 }));
    popup.addBehavior(
      new ImageBlurInOutBehavior({ fadeTime: 0.4, maxBlur: 16 })
    );

    // Call onPlay() manually since this element was added after effect started
    popup.onPlay();

    // Add to effect
    this.addElement(popup);
  }

  update(deltaTime) {
    // Update all elements first
    super.update(deltaTime);

    // Handle popup spawning with the timer
    this.popupSpawner.update(deltaTime);

    // Remove expired popups
    this.elements = this.elements.filter((element) => !element.expired);
  }
}
