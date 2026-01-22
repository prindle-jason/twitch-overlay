import { logger } from "../logger";
import { decodeWebP, decodeGif, DecodedImageData } from "./decodeImage";
import { fetchArrayBuffer, resolveUrl, getContentType } from "../http";
import { Sequence } from "../timing/Sequence";

export interface LoadedImage {
  isAnimated: boolean;
  image: HTMLImageElement | Sequence<ImageData> | null;
}

/**
 * Handles image loading, format detection, and decoding with caching
 */
export class ImageLoader {
  private static cache = new Map<string, Promise<LoadedImage>>();

  /**
   * Load an image from URL, auto-detecting format
   * Handles static images (PNG, JPEG, SVG) and animated (GIF, WebP)
   * On error, attempts to load error placeholder at /images/error.png
   * Results are cached - multiple requests for the same URL share the same Promise
   */
  static async load(url: string): Promise<LoadedImage> {
    // Check cache first
    const cached = this.cache.get(url);
    if (cached) {
      logger.debug("[ImageLoader] cache hit", { url });
      return cached;
    }

    logger.debug("[ImageLoader] cache miss, loading image", { url });
    // Create promise for this load and cache it immediately
    // This ensures concurrent requests for the same URL share the same promise
    const loadPromise = this.loadUncached(url);
    this.cache.set(url, loadPromise);

    // If loading fails, remove from cache so retry is possible
    loadPromise.catch(() => {
      this.cache.delete(url);
    });

    return loadPromise;
  }

  private static async loadUncached(url: string): Promise<LoadedImage> {
    try {
      return await this.fetchImage(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(
        "[ImageLoader] Failed to load image, loading error placeholder",
        {
          url,
          errorMessage: message,
        },
      );

      try {
        // Recursively call load() so error image can also be cached
        return await this.load("/images/error.png");
      } catch (errorErr) {
        logger.error("[ImageLoader] Failed to load error placeholder", {
          errorMessage:
            errorErr instanceof Error ? errorErr.message : String(errorErr),
        });
        // Return empty result if all fails
        return { isAnimated: false, image: null };
      }
    }
  }

  private static async fetchImage(url: string): Promise<LoadedImage> {
    const type = await getContentType(url);
    logger.debug("[ImageLoader] detected content type", { url, type });
    if (type === "image/gif" || type === "image/webp") {
      const sequence = await this.loadAnimatedImage(url, type);
      logger.debug("[ImageLoader] loaded animated image", url);
      return { isAnimated: true, image: sequence };
    } else {
      const image = await this.loadStaticImage(url);
      logger.debug("[ImageLoader] loaded static image", url);
      return { isAnimated: false, image };
    }
  }

  private static async loadStaticImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load static image: ${url}`));
      };

      img.src = resolveUrl(url);
    });
  }

  private static async loadAnimatedImage(
    url: string,
    contentType: string,
  ): Promise<Sequence<ImageData>> {
    const buffer = await fetchArrayBuffer(url);

    let decoded: DecodedImageData;
    if (contentType === "image/webp") {
      decoded = await decodeWebP(buffer);
    } else if (contentType === "image/gif") {
      decoded = await decodeGif(buffer);
    } else {
      throw new Error(`Unsupported animated format: ${contentType}`);
    }

    const frames = decoded.frames.map((imageData, index) => ({
      item: imageData,
      duration: decoded.durations[index],
    }));

    return new Sequence(frames, true);
  }
}
