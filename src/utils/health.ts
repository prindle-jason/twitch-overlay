import type { Element } from "../elements/primitives/Element";
import { EventBus } from "../core/EventBus";

export type HealthSnapshot = {
  timestamp: number;
  fps: number;
  frameMsAvg: number;
  activeScenes: number;
  wsReadyState: number | null;
  memory: {
    totalCreated: number;
    totalFinished: number;
    active: number;
    byClass: Record<string, number>;
  };
};

export class Health {
  private frames = 0;
  private accumulatedMs = 0;
  private fps = 0;
  private emaFrameMs = 16.67;
  private readonly alpha = 0.1;

  // Memory diagnostics tracking
  private elementCounts = new Map<string, number>();
  private activeElements = new Map<string, Element[]>();
  private totalCreated = 0;
  private totalFinished = 0;

  constructor() {
    // Subscribe to element lifecycle events
    EventBus.on("element-created", (detail) => {
      this.trackElementCreation(detail.ctor, detail.instance);
    });

    EventBus.on("element-finished", (detail) => {
      this.trackElementFinish(detail.ctor, detail.instance);
    });
  }

  recordFrame(deltaMs: number) {
    this.frames += 1;
    this.accumulatedMs += deltaMs;
    this.emaFrameMs = this.alpha * deltaMs + (1 - this.alpha) * this.emaFrameMs;

    if (this.accumulatedMs >= 1000) {
      this.fps = (this.frames * 1000) / this.accumulatedMs;
      this.frames = 0;
      this.accumulatedMs = 0;
    }
  }

  trackElementCreation(className: string, element: Element) {
    this.totalCreated++;
    const count = this.elementCounts.get(className) || 0;
    this.elementCounts.set(className, count + 1);

    // Track active element references
    if (!this.activeElements.has(className)) {
      this.activeElements.set(className, []);
    }
    this.activeElements.get(className)!.push(element);
  }

  trackElementFinish(className: string, element: Element) {
    this.totalFinished++;
    const count = this.elementCounts.get(className) || 0;
    this.elementCounts.set(className, count - 1);

    // Remove from active elements
    const active = this.activeElements.get(className);
    if (active) {
      const idx = active.indexOf(element);
      if (idx !== -1) {
        active.splice(idx, 1);
      }
    }
  }

  reset() {
    this.elementCounts.clear();
    this.activeElements.clear();
    this.totalCreated = 0;
    this.totalFinished = 0;
  }

  getActiveElements(): Record<string, Element[]> {
    const result: Record<string, Element[]> = {};
    for (const [className, elements] of this.activeElements.entries()) {
      if (elements.length > 0) {
        result[className] = elements;
      }
    }
    return result;
  }

  snapshot(extra: {
    activeScenes: number;
    wsReadyState: number | null;
  }): HealthSnapshot {
    // Build per-class counts, only including active elements
    const byClass: Record<string, number> = {};
    for (const [className, count] of this.elementCounts.entries()) {
      if (count > 0) {
        byClass[className] = count;
      }
    }

    return {
      timestamp: Date.now(),
      fps: Number(this.fps.toFixed(1)),
      frameMsAvg: Number(this.emaFrameMs.toFixed(2)),
      activeScenes: extra.activeScenes,
      wsReadyState: extra.wsReadyState,
      memory: {
        totalCreated: this.totalCreated,
        totalFinished: this.totalFinished,
        active: this.totalCreated - this.totalFinished,
        byClass,
      },
    };
  }
}
