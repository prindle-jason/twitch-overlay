// effects/ConvergingPairEffect.js
import { BaseEffect } from "./BaseEffect.js";
import { ImageElement } from "../elements/ImageElement.js";
import { SoundElement } from "../elements/SoundElement.js";
import { ImageScaleBehavior } from "../behaviors/ImageScaleBehavior.js";
import { SlideBehavior } from "../behaviors/SlideBehavior.js";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior.js";

/**
 * Generic effect for two images sliding in from off-screen toward target positions
 * Defaults converge from bottom-left and bottom-right toward the bottom edge.
 * Configurable to support any start/end positions and optional sound.
 */
export class ConvergingSlideEffect extends BaseEffect {
  /**
   * @param {Object} cfg
   * @param {number} cfg.W
   * @param {number} cfg.H
   * @param {number} [cfg.duration=4000]
   * @param {Object} cfg.left - Left/first image config
   * @param {string} cfg.left.imageKey - Resource key for imageMap
   * @param {number} [cfg.left.startX]
   * @param {number} [cfg.left.startY]
   * @param {number} [cfg.left.endX]
   * @param {number} [cfg.left.endY]
   * @param {Object} cfg.right - Right/second image config
   * @param {string} cfg.right.imageKey - Resource key for imageMap
   * @param {number} [cfg.right.startX]
   * @param {number} [cfg.right.startY]
   * @param {number} [cfg.right.endX]
   * @param {number} [cfg.right.endY]
   * @param {string} [cfg.soundKey] - Optional sound resource key
   * @param {number} [cfg.scale=0.25] - Uniform scale applied to both images
   * @param {number} [cfg.fadeTime=0.2] - Fade time for SlideBehavior easing
   */
  constructor(cfg) {
    const { W, H, duration = 4000 } = cfg;
    super({ W, H, duration });

    const scale = cfg.scale ?? 0.25;
    const fadeTime = cfg.fadeTime ?? 0.2;

    // Create left image element
    const leftImage = ImageElement.fromImage(cfg.left.imageKey);
    leftImage.addBehavior(
      new ImageScaleBehavior({ scaleX: scale, scaleY: scale })
    );

    // Compute dimensions for positioning
    const leftW = leftImage.image?.naturalWidth
      ? leftImage.image.naturalWidth * scale
      : 0;
    const leftH = leftImage.image?.naturalHeight
      ? leftImage.image.naturalHeight * scale
      : 0;

    // Defaults: bottom-left off-screen to bottom edge
    const leftStartX = cfg.left.startX ?? 0 - leftW;
    const leftStartY = cfg.left.startY ?? H;
    const leftEndX = cfg.left.endX ?? 0;
    const leftEndY = cfg.left.endY ?? H - leftH;

    leftImage.addBehavior(
      new SlideBehavior({
        startX: leftStartX,
        startY: leftStartY,
        endX: leftEndX,
        endY: leftEndY,
        fadeTime,
      })
    );

    // Create right image element
    const rightImage = ImageElement.fromImage(cfg.right.imageKey);
    rightImage.addBehavior(
      new ImageScaleBehavior({ scaleX: scale, scaleY: scale })
    );

    const rightW = rightImage.image?.naturalWidth
      ? rightImage.image.naturalWidth * scale
      : 0;
    const rightH = rightImage.image?.naturalHeight
      ? rightImage.image.naturalHeight * scale
      : 0;

    // Defaults: bottom-right off-screen to bottom edge
    const rightStartX = cfg.right.startX ?? W;
    const rightStartY = cfg.right.startY ?? H;
    const rightEndX = cfg.right.endX ?? W - rightW;
    const rightEndY = cfg.right.endY ?? H - rightH;

    rightImage.addBehavior(
      new SlideBehavior({
        startX: rightStartX,
        startY: rightStartY,
        endX: rightEndX,
        endY: rightEndY,
        fadeTime,
      })
    );

    this.addElement(leftImage);
    this.addElement(rightImage);

    // Optional sound
    if (cfg.soundKey) {
      const sound = new SoundElement(cfg.soundKey);
      sound.addBehavior(new SoundOnPlayBehavior());
      this.addElement(sound);
    }
  }
}
