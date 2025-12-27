// effects/WatermarkEffect.js
import { BaseEffect } from "./BaseEffect.js";
import { ImageElement } from "../elements/ImageElement.js";
import { ImageFadeInOutBehavior } from "../behaviors/ImageFadeInOutBehavior.js";

export class WatermarkEffect extends BaseEffect {
  constructor({ W, H, duration = 300000 }) {
    super({ W, H, duration });

    // List of watermark image keys to randomly choose from
    const watermarkImageKeys = [
      "activateWindows",
      "gettyImages",
      "hypercam",
      "notLive",
      "seelWatermark",
      "stockImage",
      "toBeContinued",
      "viewerDiscretion",
    ];

    // Create the image element with random watermark
    const watermarkImage = ImageElement.fromWatermark(
      watermarkImageKeys[Math.floor(Math.random() * watermarkImageKeys.length)]
    );

    watermarkImage.setEffect(this);

    // Position at top-left to cover full screen
    watermarkImage.x = 0;
    watermarkImage.y = 0;

    // Set explicit dimensions to ensure full screen coverage (1920x1080)
    watermarkImage.width = W;
    watermarkImage.height = H;

    // Add fade behavior with 20% fade time (60s fade / 300s total = 0.20)
    watermarkImage.addBehavior(
      new ImageFadeInOutBehavior({
        fadeTime: 0.05,
      })
    );

    // Add the image to the effect
    this.addElement(watermarkImage);
  }
}
