import { TransformElement } from "./TransformElement";
import { logger } from "../utils/logger";
import { configProps } from "../core/configProps";

export enum ScrollDirection {
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

interface ScrollingQueueConfig {
  direction?: ScrollDirection;
  maxItems?: number;
  itemGap?: number;
  lerpFactor?: number; // 0-1, controls spring convergence speed (default 0.15)
  snapThreshold?: number; // pixels - snap to target when within this distance (default 0.5)
  fadeInDistance?: number; // proportion of travel distance for fade-in (0-1)
  fadeOutDuration?: number; // ms to fade out when removing items
}

enum ItemState {
  FADE_IN = "FADE_IN",
  NORMAL = "NORMAL",
  FADE_OUT = "FADE_OUT",
}

interface QueuedItem {
  element: TransformElement;
  targetPosition: number; // target x or y depending on direction
  spawnPosition: number; // initial spawn position
  fadeDistance: number; // distance from spawn to target for fade calculation
  fadeInState: ItemState; // FADE_IN or NORMAL
  fadeOutElapsed?: number; // ms elapsed in fade-out (only used in FADE_OUT)
}

/**
 * A container that manages a scrolling queue of items.
 * Phase 1: Basic static positioning - items stack correctly without animation
 */
export class ScrollingQueueElement extends TransformElement {
  private direction: ScrollDirection;
  private maxItems: number;
  private itemGap: number;
  private lerpFactor: number; // 0-1, spring convergence speed
  private snapThreshold: number; // pixels, snap when within this distance
  private fadeInDistance: number; // 0-1, proportion of travel
  private fadeOutDuration: number; // ms
  private items: QueuedItem[] = [];
  private pendingItems: TransformElement[] = []; // Elements waiting to be PLAYING
  private normalItemCount: number = 0; // Track count of items in NORMAL state

  constructor(config: ScrollingQueueConfig = {}) {
    super();
    this.direction = config.direction ?? ScrollDirection.UP;
    this.maxItems = config.maxItems ?? 10;
    this.itemGap = config.itemGap ?? 10;
    this.lerpFactor = config.lerpFactor ?? 0.15; // 0.15 = smooth, 0.3 = snappy
    this.snapThreshold = config.snapThreshold ?? 0.5; // pixels
    this.fadeInDistance = config.fadeInDistance ?? 0.3; // fade in first 30% of travel
    this.fadeOutDuration = config.fadeOutDuration ?? 300; // ms
  }

  setLerpFactor(value: number) {
    this.lerpFactor = value;
  }

  /**
   * Add a new item to the queue. It will be added to pending list until PLAYING.
   */
  addItem(element: TransformElement): void {
    logger.debug("[ScrollingQueue] addItem", {
      currentItems: this.items.length,
      pendingItems: this.pendingItems.length,
      elementType: element.constructor.name,
    });

    // Add as child so it goes through lifecycle
    this.addChild(element);

    // Add to pending - will be moved to items list once PLAYING
    this.pendingItems.push(element);
  }

  /**
   * Process pending items - move PLAYING items to the active queue
   */
  private processPending(): void {
    const nowPlaying = this.pendingItems.filter(
      (el) => el.getState() === "PLAYING"
    );

    if (nowPlaying.length === 0) return;

    // Calculate spawn positions for the batch of newly playing items
    // Spawn position depends on direction - new items appear "after" the queue
    let spawnAccumulated: number;
    if (this.items.length > 0) {
      const endPos = this.getEndOfQueuePosition();
      // For UP/LEFT: spawn beyond the queue (positive offset from end)
      // For DOWN/RIGHT: spawn before the queue (negative offset from end)
      if (
        this.direction === ScrollDirection.UP ||
        this.direction === ScrollDirection.LEFT
      ) {
        spawnAccumulated = endPos + this.itemGap;
      } else {
        // DOWN or RIGHT: spawn in opposite direction
        spawnAccumulated = endPos - this.itemGap;
      }
    } else {
      spawnAccumulated = 0;
    }

    logger.debug("[ScrollingQueue] spawn position base", {
      direction: this.direction,
      endOfQueue: this.getEndOfQueuePosition(),
      spawnAccumulated,
    });

    // Add each to the active queue with calculated spawn position
    for (const element of nowPlaying) {
      const spawnPos = spawnAccumulated;

      this.items.push({
        element,
        targetPosition: 0, // Will be calculated
        spawnPosition: spawnPos,
        fadeDistance: 0, // Will be calculated after recalculateTargets
        fadeInState: ItemState.FADE_IN,
      });

      logger.debug("[ScrollingQueue] item added to queue", {
        elementType: element.constructor.name,
        spawnPos,
        size: this.getItemSize(element),
      });

      // Update spawn accumulation for next item
      // For UP/LEFT: accumulate positively (further away)
      // For DOWN/RIGHT: accumulate negatively (further away in opposite direction)
      if (
        this.direction === ScrollDirection.UP ||
        this.direction === ScrollDirection.LEFT
      ) {
        spawnAccumulated += this.getItemSize(element) + this.itemGap;
      } else {
        spawnAccumulated -= this.getItemSize(element) + this.itemGap;
      }
    }

    // Remove from pending
    this.pendingItems = this.pendingItems.filter(
      (el) => el.getState() !== "PLAYING"
    );

    // Recalculate all target positions now that we have valid sizes
    this.recalculateTargets();

    // Phase 2: Set only the NEW elements at spawn position, they will animate to target
    logger.debug("[ScrollingQueue] positioning NEW items after recalc", {
      newItemsCount: nowPlaying.length,
      totalItems: this.items.length,
    });

    for (const element of nowPlaying) {
      const item = this.items.find((it) => it.element === element);
      if (item) {
        // Calculate fade distance for this item
        item.fadeDistance = Math.abs(item.targetPosition - item.spawnPosition);

        this.setElementPosition(item.element, item.spawnPosition);
        logger.debug("[ScrollingQueue] new item positioned at spawn", {
          elementType: item.element.constructor.name,
          spawnPos: item.spawnPosition,
          targetPos: item.targetPosition,
          fadeDistance: item.fadeDistance,
        });
        item.element.opacity = 0; // Start fully transparent for fade-in
        item.fadeInState = ItemState.FADE_IN;
      }
    }

    // Phase 4: Mark excess items for fade-out
    this.markExcess();
  }

  /**
   * Mark excess items (oldest) for fade-out when queue exceeds maxItems
   */
  private markExcess(): void {
    if (this.normalItemCount <= this.maxItems) return;

    const excessCount = this.normalItemCount - this.maxItems;
    for (let i = 0; i < excessCount; i++) {
      const item = this.items[i];
      if (item.fadeInState === ItemState.NORMAL) {
        item.fadeInState = ItemState.FADE_OUT;
        item.fadeOutElapsed = 0;
        this.normalItemCount--;
      }
    }
  }

  /**
   * Get the position where new items should start spawning (end of queue, accounting for direction and gap)
   * Uses current position of last item, not target, so new items spawn relative to where items actually are
   */
  private getEndOfQueuePosition(): number {
    if (this.items.length === 0) return 0;

    const lastItem = this.items[this.items.length - 1];
    const currentPos = this.getElementPosition(lastItem.element);
    const itemSize = this.getItemSize(lastItem.element);

    // For UP/LEFT: spawn extends positively from the current position
    // For DOWN/RIGHT: spawn extends negatively from the current position
    if (
      this.direction === ScrollDirection.UP ||
      this.direction === ScrollDirection.LEFT
    ) {
      return currentPos + itemSize + this.itemGap;
    } else {
      // DOWN or RIGHT
      return currentPos - itemSize - this.itemGap;
    }
  }

  /**
   * Calculate target positions for all items in the queue.
   * Items stack from position 0 outward based on their size and gap.
   */
  private recalculateTargets(): void {
    let accumulatedPosition = 0;

    logger.debug("[ScrollingQueue] recalculateTargets START", {
      itemsCount: this.items.length,
    });

    // Calculate from newest (bottom/end) to oldest (top/beginning)
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const size = this.getItemSize(item.element);

      // Set target position based on direction
      switch (this.direction) {
        case ScrollDirection.UP:
          item.targetPosition = -accumulatedPosition; // Negative = upward
          break;
        case ScrollDirection.DOWN:
          item.targetPosition = accumulatedPosition; // Positive = downward
          break;
        case ScrollDirection.LEFT:
          item.targetPosition = -accumulatedPosition; // Negative = leftward
          break;
        case ScrollDirection.RIGHT:
          item.targetPosition = accumulatedPosition; // Positive = rightward
          break;
      }

      logger.debug("[ScrollingQueue] target calc", {
        index: i,
        accumulated: accumulatedPosition,
        size,
        target: item.targetPosition,
        elementType: item.element.constructor.name,
      });

      accumulatedPosition += size + this.itemGap;
    }

    logger.debug("[ScrollingQueue] recalculateTargets END", {
      items: this.items.map((it, idx) => ({
        idx,
        target: it.targetPosition,
        size: this.getItemSize(it.element),
      })),
    });
  }

  /**
   * Get the size of an item (width or height depending on scroll direction)
   */
  private getItemSize(element: TransformElement): number {
    if (this.isVertical()) {
      const height = element.getHeight() ?? 0;
      if (height === 0) {
        logger.warn("[ScrollingQueue] element height is 0", {
          elementType: element.constructor.name,
          state: element.getState(),
        });
      }
      return height;
    } else {
      const width = element.getWidth() ?? 0;
      if (width === 0) {
        logger.warn("[ScrollingQueue] element width is 0", {
          elementType: element.constructor.name,
          state: element.getState(),
        });
      }
      return width;
    }
  }

  /**
   * Check if scrolling vertically (UP or DOWN)
   */
  private isVertical(): boolean {
    return (
      this.direction === ScrollDirection.UP ||
      this.direction === ScrollDirection.DOWN
    );
  }

  /**
   * Set an element's position along the scroll axis
   */
  private setElementPosition(
    element: TransformElement,
    position: number
  ): void {
    if (this.isVertical()) {
      element.y = position;
    } else {
      element.x = position;
    }
  }

  /**
   * Get an element's position along the scroll axis
   */
  private getElementPosition(element: TransformElement): number {
    if (this.isVertical()) {
      return element.y;
    } else {
      return element.x;
    }
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    // Check if any pending items are now PLAYING
    this.processPending();

    // Phase 2, 3, & 4: Move items toward their targets, apply fade-in, handle fade-out
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const currentPos = this.getElementPosition(item.element);
      const distance = item.targetPosition - currentPos;
      const absDistance = Math.abs(distance);

      // Phase 4: Handle fade-out and removal
      if (item.fadeInState === ItemState.FADE_OUT) {
        item.fadeOutElapsed = (item.fadeOutElapsed ?? 0) + deltaTime;
        const fadeOutProgress = Math.min(
          1,
          item.fadeOutElapsed / this.fadeOutDuration
        );
        item.element.opacity = Math.max(0, 1 - fadeOutProgress);

        // Remove item when fade-out complete
        if (fadeOutProgress >= 1) {
          // this.removeChild(item.element);
          item.element.finish();
          this.items.splice(i, 1);
          logger.debug("[ScrollingQueue] item removed after fade-out", {
            elementType: item.element.constructor.name,
            remainingItems: this.items.length,
          });
          continue; // Skip remaining logic for this item
        }
      }

      // Phase 3: Apply fade-in
      if (item.fadeInState === ItemState.FADE_IN) {
        const distanceTraveled = Math.abs(currentPos - item.spawnPosition);
        if (item.fadeDistance > 0) {
          const fadeProgress = Math.min(
            1,
            distanceTraveled / item.fadeDistance
          );
          item.element.opacity = fadeProgress;

          // Transition to NORMAL when fade is complete
          if (fadeProgress >= 1) {
            item.element.opacity = 1;
            item.fadeInState = ItemState.NORMAL;
            this.normalItemCount++;
          }
        } else {
          // Zero fade distance - just set to 1
          item.element.opacity = 1;
          item.fadeInState = ItemState.NORMAL;
          this.normalItemCount++;
        }
      }

      // Phase 6: Move toward target with spring-like lerp
      if (absDistance > this.snapThreshold) {
        // Frame-rate independent exponential decay
        const frameNormalizedFactor =
          1 - Math.pow(1 - this.lerpFactor, deltaTime / 16.67);
        const movement = distance * frameNormalizedFactor;
        const newPos = currentPos + movement;
        this.setElementPosition(item.element, newPos);
      } else {
        // Snap to target when close enough
        this.setElementPosition(item.element, item.targetPosition);
      }
    }
  }

  override drawSelf(ctx: CanvasRenderingContext2D): void {
    // Phase 1: Debug visualization - draw bounds around queue area
    // This is called within the element's transformed context
    if (configProps.debugMode && this.items.length > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      // Draw a box showing the queue extent (in local coordinates)
      if (this.isVertical()) {
        const minY = Math.min(...this.items.map((it) => it.targetPosition));
        const maxY = Math.max(
          ...this.items.map(
            (it) => it.targetPosition + this.getItemSize(it.element)
          )
        );
        ctx.strokeRect(-10, minY, 500, maxY - minY);
      } else {
        const minX = Math.min(...this.items.map((it) => it.targetPosition));
        const maxX = Math.max(
          ...this.items.map(
            (it) => it.targetPosition + this.getItemSize(it.element)
          )
        );
        ctx.strokeRect(minX, -10, maxX - minX, 200);
      }

      ctx.restore();
    }
  }

  override finish(): void {
    super.finish();
    // Clear tracking arrays to release element references
    this.items = [];
    this.pendingItems = [];
  }
}
