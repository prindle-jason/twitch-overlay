import { TransformElement } from "./TransformElement";
import { logger } from "../utils/logger";

export enum ScrollDirection {
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

enum ItemState {
  FADE_IN = "FADE_IN",
  NORMAL = "NORMAL",
  FADE_OUT = "FADE_OUT",
}

interface ScrollingQueueConfig {
  direction?: ScrollDirection;
  maxItems?: number;
  itemGap?: number;
  baseSpeed?: number; // pixels per second
  urgencyFactor?: number; // speed multiplier per queued item
  lerpThreshold?: number; // distance at which to start lerping
  lerpFactor?: number; // lerp speed (0-1)
  fadeInDistance?: number; // proportion of travel distance to fade in (0-1)
  fadeOutDuration?: number; // ms
}

interface QueuedItem {
  element: TransformElement;
  state: ItemState;
  targetPosition: number; // target x or y depending on direction
  spawnPosition: number; // initial spawn position for distance-based fading
  fadeOutElapsed?: number; // only used in FADE_OUT state
}

/**
 * A container that manages a scrolling queue of items.
 * New items appear at the bottom/end and push older items up/away.
 * Supports dynamic speed adjustment based on queue depth.
 */
export class ScrollingQueueElement extends TransformElement {
  private direction: ScrollDirection;
  private maxItems: number;
  private itemGap: number;
  private baseSpeed: number;
  private urgencyFactor: number;
  private lerpThreshold: number;
  private lerpFactor: number;
  private fadeInDistance: number;
  private fadeOutDuration: number;

  private items: QueuedItem[] = [];
  private pendingQueue: TransformElement[] = [];
  private lastSizes: Map<TransformElement, number> = new Map();

  constructor(config: ScrollingQueueConfig = {}) {
    super();
    this.direction = config.direction ?? ScrollDirection.UP;
    this.maxItems = config.maxItems ?? 10;
    this.itemGap = config.itemGap ?? 10;
    this.baseSpeed = config.baseSpeed ?? 200; // pixels per second
    this.urgencyFactor = config.urgencyFactor ?? 0.5;
    this.lerpThreshold = config.lerpThreshold ?? 5;
    this.lerpFactor = config.lerpFactor ?? 8;
    this.fadeInDistance = config.fadeInDistance ?? 0.3; // Fade in first 30% of travel
    this.fadeOutDuration = config.fadeOutDuration ?? 300;
  }

  /**
   * Add a new item to the queue. It will appear at the bottom and animate in.
   */
  addItem(element: TransformElement): void {
    logger.debug("[ScrollingQueue] addItem", {
      pendingBefore: this.pendingQueue.length,
    });
    // SIMPLIFIED: Just add as child at 0,0
    element.x = 0;
    element.y = 0;
    element.setDuration(5000);
    this.addChild(element);
  }

  private processPendingQueue(): void {
    // SIMPLIFIED: Disabled pending queue processing
    // if (this.pendingQueue.length === 0) return;
    // const toProcess = this.pendingQueue.filter(
    //   (el) => el.getState() === "PLAYING"
    // );
    // toProcess.forEach((element) => this.queueItem(element));
    // // Mark excess items for removal (all at once)
    // this.markExcess();
    // // Recalculate targets once if anything changed
    // if (toProcess.length > 0) {
    //   this.recalculateTargets();
    // }
    // // Keep only non-PLAYING items in pending queue
    // this.pendingQueue = this.pendingQueue.filter(
    //   (el) => el.getState() !== "PLAYING"
    // );
  }

  private queueItem(element: TransformElement): void {
    // SIMPLIFIED: Disabled
    // // Initialize element position offscreen
    // const spawnPos = this.getSpawnOffset(element);
    // this.setElementPosition(element, spawnPos);
    // element.opacity = 0;
    // this.items.push({
    //   element,
    //   state: ItemState.FADE_IN,
    //   targetPosition: 0, // Will be recalculated
    //   spawnPosition: spawnPos,
    // });
    // logger.debug("[ScrollingQueue] enqueued item", {
    //   spawnPos,
    //   itemSize: this.getItemSize(element),
    //   itemsCount: this.items.length,
    // });
  }

  private markExcess(): void {
    // SIMPLIFIED: Disabled
    // if (this.items.length > this.maxItems) {
    //   const excessCount = this.items.length - this.maxItems;
    //   for (let i = 0; i < excessCount; i++) {
    //     const item = this.items[i];
    //     if (item.state !== ItemState.FADE_OUT) {
    //       item.state = ItemState.FADE_OUT;
    //       item.fadeOutElapsed = 0;
    //       logger.debug("[ScrollingQueue] mark FADE_OUT", {
    //         index: i,
    //         itemsCount: this.items.length,
    //         max: this.maxItems,
    //       });
    //     }
    //   }
    // }
  }

  private getSpawnOffset(element: TransformElement): number {
    const size = this.getItemSize(element);
    const offset = size + this.itemGap;

    switch (this.direction) {
      case ScrollDirection.UP:
        return offset; // Spawn below by element's height
      case ScrollDirection.DOWN:
        return -offset; // Spawn above
      case ScrollDirection.LEFT:
        return offset; // Spawn right
      case ScrollDirection.RIGHT:
        return -offset; // Spawn left
    }
  }

  private recalculateTargets(): void {
    let accumulatedPosition = 0;

    // Calculate from bottom to top (newest to oldest)
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const size = this.getItemSize(item.element);

      if (this.direction === ScrollDirection.UP) {
        item.targetPosition = -accumulatedPosition;
      } else if (this.direction === ScrollDirection.DOWN) {
        item.targetPosition = accumulatedPosition;
      } else if (this.direction === ScrollDirection.LEFT) {
        item.targetPosition = -accumulatedPosition;
      } else {
        // RIGHT
        item.targetPosition = accumulatedPosition;
      }

      accumulatedPosition += size + this.itemGap;
    }

    logger.debug("[ScrollingQueue] recalculateTargets end", {
      items: this.items.map((it, idx) => ({ idx, target: it.targetPosition })),
    });
  }

  private getItemSize(element: TransformElement): number {
    if (this.isVertical()) {
      const h = element.getHeight() ?? 0;
      if (h === 0) {
        logger.warn("[ScrollingQueue] getItemSize vertical returned 0");
      }
      return h;
    } else {
      const w = element.getWidth() ?? 0;
      if (w === 0) {
        logger.warn("[ScrollingQueue] getItemSize horizontal returned 0");
      }
      return w;
    }
  }

  private isVertical(): boolean {
    const vertical =
      this.direction === ScrollDirection.UP ||
      this.direction === ScrollDirection.DOWN;
    //logger.debug("[ScrollingQueue] isVertical", { vertical });
    return vertical;
  }

  private setElementPosition(
    element: TransformElement,
    position: number
  ): void {
    if (this.isVertical()) {
      element.y = position;
    } else {
      element.x = position;
    }
    //logger.debug("[ScrollingQueue] setElementPosition", {
    //  position,
    //  x: element.x,
    //  y: element.y,
    //});
  }

  private getElementPosition(element: TransformElement): number {
    if (this.isVertical()) {
      const pos = element.y;
      //logger.debug("[ScrollingQueue] getElementPosition vertical", { pos });
      return pos;
    } else {
      const pos = element.x;
      //logger.debug("[ScrollingQueue] getElementPosition horizontal", { pos });
      return pos;
    }
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    // SIMPLIFIED: All update logic disabled
    // this.processPendingQueue();

    // // If any item size changed after async init, recalc targets
    // let sizesChanged = false;
    // for (const item of this.items) {
    //   const size = this.getItemSize(item.element);
    //   const prev = this.lastSizes.get(item.element);
    //   if (prev !== size) {
    //     this.lastSizes.set(item.element, size);
    //     sizesChanged = true;
    //   }
    // }
    // if (sizesChanged) {
    //   this.recalculateTargets();
    // }

    // if (this.items.length === 0) return;

    // // Calculate urgency multiplier based on how many items are not at target
    // const itemsNotAtTarget = this.items.filter(
    //   (item) =>
    //     Math.abs(this.getElementPosition(item.element) - item.targetPosition) >
    //     0.5
    // ).length;
    // const urgencyMultiplier = 1 + itemsNotAtTarget * this.urgencyFactor;
    // const currentSpeed = this.baseSpeed * urgencyMultiplier;

    // // Update each item
    // for (let i = this.items.length - 1; i >= 0; i--) {
    //   const item = this.items[i];
    //   const currentPos = this.getElementPosition(item.element);

    //   // State machine
    //   switch (item.state) {
    //     case ItemState.FADE_IN: {
    //       const travelDistance = Math.abs(
    //         item.spawnPosition - item.targetPosition
    //       );
    //       const distanceTraveled = Math.abs(item.spawnPosition - currentPos);
    //       const fadeInThreshold = travelDistance * this.fadeInDistance;

    //       if (distanceTraveled < fadeInThreshold) {
    //         const fadeInProgress =
    //           fadeInThreshold > 0 ? distanceTraveled / fadeInThreshold : 1;
    //         item.element.opacity = fadeInProgress;
    //       } else {
    //         item.element.opacity = 1;
    //         item.state = ItemState.NORMAL;
    //       }
    //       break;
    //     }

    //     case ItemState.NORMAL: {
    //       item.element.opacity = 1;
    //       break;
    //     }

    //     case ItemState.FADE_OUT: {
    //       item.fadeOutElapsed = (item.fadeOutElapsed ?? 0) + deltaTime;
    //       const fadeOutProgress = Math.min(
    //         1,
    //         item.fadeOutElapsed / this.fadeOutDuration
    //       );
    //       item.element.opacity = Math.max(0, 1 - fadeOutProgress);

    //       // if (fadeOutProgress >= 1) {
    //       //   // Remove from queue
    //       //   this.removeChild(item.element);
    //       //   this.items.splice(i, 1);
    //       //   this.lastSizes.delete(item.element);
    //       //   this.recalculateTargets();
    //       //   continue; // Skip movement logic for removed items
    //       // }
    //       break;
    //     }
    //   }

    //   // Move toward target (for all states)
    //   const distance = item.targetPosition - currentPos;
    //   const absDistance = Math.abs(distance);

    //   if (absDistance > 0.1) {
    //     let movement: number;

    //     if (absDistance < this.lerpThreshold) {
    //       // Smooth lerp when close
    //       movement = distance * this.lerpFactor * (deltaTime / 1000);
    //     } else {
    //       // Constant velocity when far
    //       const velocity = currentSpeed * (deltaTime / 1000);
    //       movement = Math.sign(distance) * Math.min(absDistance, velocity);
    //     }

    //     this.setElementPosition(item.element, currentPos + movement);
    //   }
    // }
  }
}
