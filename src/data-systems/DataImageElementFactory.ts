import {
  DataImageElement,
  DataImageElementConfig,
  DataStaticImageElement,
  DataAnimatedImageElement,
} from "../data-elements/primitives/DataImageElement";

/**
 * Factory for creating appropriate image element based on image type.
 */
export class DataImageElementFactory {
  /**
   * Creates DataStaticImageElement or DataAnimatedImageElement based on file extension.
   */
  static create(config: DataImageElementConfig): DataImageElement {
    const ext = config.imageUrl.split(".").pop()?.toLowerCase() ?? "";
    const isAnimated = ext === "gif" || ext === "webp" || ext === "apng";

    if (isAnimated) {
      return new DataAnimatedImageElement(config);
    }
    return new DataStaticImageElement(config);
  }
}
