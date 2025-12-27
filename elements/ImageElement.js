// elements/ImageElement.js
import { getImage, getWatermark } from "../core/resourceRegistry.js";
import { BaseElement } from "./BaseElement.js";

export class ImageElement extends BaseElement {
  constructor(image) {
    super();

    // Image properties
    //this.imageName = imageName;
    this.image = image;

    // Position and transform properties
    this.x = 0;
    this.y = 0;
    this.width = null; // null = use natural width
    this.height = null; // null = use natural height

    // Visual properties
    this.opacity = 1;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;

    // Canvas filter (for blur, etc.)
    this.filter = "none";
  }
  static fromImage(imageName) {
    return new ImageElement(getImage(imageName));
  }
  static fromWatermark(imageName) {
    return new ImageElement(getWatermark(imageName));
  }

  /**
   * Wait for the image to be ready (loaded or failed)
   * @returns {Promise<void>}
   */
  async ready() {
    const img = this.image;
    if (!img) return;

    // If already loaded, we're done
    if (img.complete) return;

    // Wait for load or error (whichever comes first)
    await new Promise((resolve) => {
      const onLoad = () => {
        img.removeEventListener("error", onError);
        resolve();
      };

      const onError = () => {
        img.removeEventListener("load", onLoad);
        resolve(); // Resolve even on error so effect doesn't hang
      };

      img.addEventListener("load", onLoad, { once: true });
      img.addEventListener("error", onError, { once: true });
    });
  }

  /**
   * Get the actual width to render (natural width if not specified)
   */
  getWidth() {
    if (this.width !== null) return this.width;
    return this.image ? this.image.naturalWidth * this.scaleX : 0;
  }

  /**
   * Get the actual height to render (natural height if not specified)
   */
  getHeight() {
    if (this.height !== null) return this.height;
    return this.image ? this.image.naturalHeight * this.scaleY : 0;
  }

  /**
   * Draw the image to the canvas
   */
  draw(ctx) {
    if (!this.image || this.opacity <= 0) return;

    ctx.save();

    // Apply transformations
    ctx.globalAlpha = this.opacity;
    ctx.filter = this.filter;

    // Move to position and apply rotation
    ctx.translate(this.x, this.y);
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }

    // Draw the image (at 0,0 since we translated)
    ctx.drawImage(this.image, 0, 0, this.getWidth(), this.getHeight());

    ctx.restore();
  }
}
