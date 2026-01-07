import { decode as decodeWebPLib } from "libwebp-wasm";
import { parseGIF, decompressFrames } from "gifuct-js";
import { logger } from "./logger";

export interface DecodedImageData {
  frames: ImageData[];
  durations: number[];
  width: number;
  height: number;
}

/**
 * Decode an animated WebP image into frame data
 */
export async function decodeWebP(
  buffer: ArrayBuffer
): Promise<DecodedImageData> {
  const decoded = await decodeWebPLib(new Uint8Array(buffer));

  if (!decoded.frameList || decoded.frameList.length === 0) {
    throw new Error("No frames decoded from WebP");
  }

  const width = decoded.width;
  const height = decoded.height;
  const frames: ImageData[] = [];
  const durations: number[] = [];

  for (let i = 0; i < decoded.frameList.length; i++) {
    const frame = decoded.frameList[i];
    const imageData = new ImageData(
      new Uint8ClampedArray(frame.data),
      width,
      height
    );
    frames.push(imageData);

    let frameDuration = 100; // Default 100ms
    if (i < decoded.frameList.length - 1) {
      const nextTimestamp = decoded.frameList[i + 1].timestamp;
      frameDuration = Math.max(
        nextTimestamp - frame.timestamp,
        10 // Minimum 10ms
      );
    }
    durations.push(frameDuration);
  }

  return { frames, durations, width, height };
}

/**
 * Apply the disposal mode from the previous frame.
 * Disposal modes:
 *   0, 1: No action / Do not dispose (render on top, keep for next)
 *   2: Restore to background (clear area to transparent)
 *   3: Restore to previous (restore backed-up frame state)
 */
function applyDisposal(
  disposalType: number | undefined,
  buffer: Uint8ClampedArray,
  prevFrameData: Uint8ClampedArray | null,
  width: number,
  height: number
): void {
  const mode = disposalType ?? 0;

  if (mode === 2) {
    // Restore to background: clear entire canvas to transparent
    buffer.fill(0);
  } else if (mode === 3 && prevFrameData) {
    // Restore to previous: restore backed-up frame state
    buffer.set(prevFrameData);
  }
  // modes 0 or 1: do nothing, render on top
}

/**
 * Paint a frame patch at offset (x, y) onto the composite buffer.
 * Respects transparency: only overwrites pixels that are not fully transparent.
 */
function compositePatch(
  buffer: Uint8ClampedArray,
  patch: Uint8ClampedArray,
  x: number,
  y: number,
  w: number,
  h: number,
  bufferWidth: number
): void {
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const bufferIdx = ((y + row) * bufferWidth + (x + col)) * 4;
      const patchIdx = (row * w + col) * 4;

      const alpha = patch[patchIdx + 3];
      if (alpha > 0) {
        // Only overwrite if pixel is not fully transparent
        buffer[bufferIdx] = patch[patchIdx]; // R
        buffer[bufferIdx + 1] = patch[patchIdx + 1]; // G
        buffer[bufferIdx + 2] = patch[patchIdx + 2]; // B
        buffer[bufferIdx + 3] = patch[patchIdx + 3]; // A
      }
      // If alpha === 0, leave existing buffer pixel unchanged (shows through)
    }
  }
}

/**
 * Decode an animated GIF image into frame data, properly handling disposal modes.
 * Returns full composited frames (not patches) so animation composites correctly.
 */
export async function decodeGif(
  buffer: ArrayBuffer
): Promise<DecodedImageData> {
  try {
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);

    if (!frames || frames.length === 0) {
      throw new Error("No frames decoded from GIF");
    }

    const { width, height } = gif.lsd;
    const compositeBuffer = new Uint8ClampedArray(width * height * 4);
    const decodedFrames: ImageData[] = [];
    const durations: number[] = [];
    let prevDisposal: number | undefined;
    let prevFrameData: Uint8ClampedArray | null = null;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameX = frame.dims?.left ?? 0;
      const frameY = frame.dims?.top ?? 0;
      const frameW = frame.dims?.width ?? width;
      const frameH = frame.dims?.height ?? height;

      if (frameW <= 0 || frameH <= 0) {
        const msg = `decodeGif frame ${i} has invalid dimensions ${frameW}x${frameH}`;
        logger.error(msg);
        throw new Error(msg);
      }

      if (!frame.patch || frame.patch.length !== frameW * frameH * 4) {
        const msg =
          `decodeGif frame ${i} patch size mismatch: expected=${
            frameW * frameH * 4
          }, ` + `got=${frame.patch?.length}`;
        logger.error(msg);
        throw new Error(msg);
      }

      // Apply previous frame's disposal mode
      if (i > 0) {
        applyDisposal(
          prevDisposal,
          compositeBuffer,
          prevFrameData,
          width,
          height
        );
      }

      // Back up current state before painting (for disposal mode 3)
      if (frame.disposalType === 3) {
        prevFrameData = new Uint8ClampedArray(compositeBuffer);
      }

      // Composite current frame onto buffer
      try {
        compositePatch(
          compositeBuffer,
          frame.patch,
          frameX,
          frameY,
          frameW,
          frameH,
          width
        );
      } catch (err) {
        const msg = `decodeGif frame ${i} composite failed: ${
          err instanceof Error ? err.message : String(err)
        }`;
        logger.error(msg);
        throw new Error(msg);
      }

      // Save full composited frame as ImageData
      const imageData = new ImageData(
        new Uint8ClampedArray(compositeBuffer),
        width,
        height
      );
      decodedFrames.push(imageData);

      // Save current frame's disposal type for next iteration
      prevDisposal = frame.disposalType;

      durations.push(Math.max(frame.delay || 10, 10));
    }

    return { frames: decodedFrames, durations, width, height };
  } catch (error) {
    throw new Error(
      `Failed to decode GIF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
