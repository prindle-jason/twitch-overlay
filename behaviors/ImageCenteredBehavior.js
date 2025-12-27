// behaviors/ImageCenteredBehavior.js
import { BaseBehavior } from "./BaseBehavior.js";

export class ImageCenteredBehavior extends BaseBehavior {
  onPlay(imageElement) {
    // Get canvas dimensions from the effect
    const { W, H } = imageElement.effect;

    console.log(imageElement.image.complete);
    console.log(
      `Centering image on canvas of size ${W}x${H} with image size ${imageElement.getWidth()}x${imageElement.getHeight()}`
    );
    console.log(imageElement.image.complete);

    // Center the element on the canvas
    imageElement.x = (W - imageElement.getWidth()) / 2;
    imageElement.y = (H - imageElement.getHeight()) / 2;
  }
}
