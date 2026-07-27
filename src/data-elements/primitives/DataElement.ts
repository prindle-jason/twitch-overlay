import type { LifecycleState } from "../../types/LifecycleStates";
import { logger } from "../../utils/logger";
import { EventBus } from "../../core/EventBus";
import { EventEmitter } from "./EventEmitter";

interface ChildEventListener {
  event: string;
  action: string;
  filter?: Record<string, unknown>;
}

export interface DataElementConfig {
  duration?: number;
  id?: string;
  childEventListeners?: ChildEventListener[];
}

/**
 * Base class for data-driven elements. Duplicates Element functionality
 * and adds a local event system for element-to-element communication.
 * Manages parent/child links, lifecycle transitions, and local events.
 *
 * Lifecycle: NEW → INITIALIZING → READY → PLAYING → FINISHED
 */
export class DataElement {
  // ---------------------------------------------------------------------------------
  // State management
  // ---------------------------------------------------------------------------------
  protected parent: DataElement | null = null;
  protected children: DataElement[] = [];
  protected duration!: number;
  protected elapsed = 0;
  protected state: LifecycleState = "NEW";
  protected id?: string;
  protected childEventListenersConfig: ChildEventListener[] = [];
  protected event: EventEmitter;

  // ---------------------------------------------------------------------------------
  // Local event system
  // ---------------------------------------------------------------------------------
  constructor(config: DataElementConfig = {}) {
    this.duration = config.duration ?? -1;
    this.id = config.id;
    this.childEventListenersConfig = config.childEventListeners ?? [];
    this.event = new EventEmitter();

    EventBus.emit("data-element-created", {
      ctor: this.constructor.name,
      instance: this,
    });
  }

  // ---------------------------------------------------------------------------------
  // Child management
  // ---------------------------------------------------------------------------------
  /** Attach a child element and wire its parent pointer. */
  addChild(child: DataElement): void {
    logger.debug(this.constructor.name, "adding child", child.constructor.name);
    child.setParent(this);
    this.children.push(child);
  }

  /** Detach a child and clear its parent pointer if present. */
  removeChild(child: DataElement): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.setParent(null);
    }
  }

  setupChildEventListeners(): void {
    for (const listener of this.childEventListenersConfig) {
      logger.debug(
        `[${this.constructor.name}] Setting up child event listener`,
        {
          event: listener.event,
          action: listener.action,
        },
      );

      this.addEventListener(listener.event, (detail?: any) => {
        // Check filter if present
        if (listener.filter) {
          const matches = Object.entries(listener.filter).every(
            ([key, value]) => detail?.[key] === value,
          );
          if (!matches) {
            return;
          }
        }

        // Execute action
        logger.debug(
          `[${this.constructor.name}] Child event listener triggered`,
          {
            event: listener.event,
            action: listener.action,
          },
        );

        const actionFunc = (this as any)[listener.action];
        if (typeof actionFunc === "function") {
          actionFunc.call(this);
        } else {
          logger.warn(
            `[${this.constructor.name}] No function found with name`,
            {
              action: listener.action,
            },
          );
        }
      });
    }
  }

  // ---------------------------------------------------------------------------------
  // Lifecycle management
  // ---------------------------------------------------------------------------------
  /**
   * Begin async initialization; awaits all current children. Call super.init() last in overrides.
   */
  async init() {
    if (this.state !== "NEW") {
      return;
    }

    this.state = "INITIALIZING";
    this.elapsed = 0;

    // Set up child event listeners from config
    this.setupChildEventListeners();

    await Promise.all(this.children.map((child) => child.init()));
    this.state = "READY";
  }

  /**
   * Transition to PLAYING; auto-plays READY children. Do final prep that depends on async init.
   */
  play() {
    if (this.state !== "READY") {
      return;
    }

    this.state = "PLAYING";

    this.children.forEach((child) => child.play());
  }

  /**
   * Per-frame update while PLAYING.
   * Advances elapsed, auto-finishes on duration.
   * Then advances children lifecycles and runs element-specific logic via updateSelf().
   */
  update(deltaTime: number) {
    if (this.state !== "PLAYING") {
      return;
    }

    this.elapsed += deltaTime;
    if (this.duration !== -1 && this.elapsed >= this.duration) {
      this.finish();
      return;
    }

    this.updateSelf(deltaTime);
    this.updateChildren(deltaTime);
  }

  /** Pause this element and cascade to children. */
  pause(): void {
    if (this.state !== "PLAYING") {
      return;
    }

    this.state = "PAUSED";
    this.children.forEach((child) => child.pause());
  }

  /** Resume this element and cascade to children. */
  resume(): void {
    if (this.state !== "PAUSED") {
      return;
    }

    this.state = "PLAYING";
    this.children.forEach((child) => child.resume());
  }

  /**
   * Hook for subclasses to implement per-frame logic.
   * Default: no-op.
   */
  protected updateSelf(_deltaTime: number): void {
    // Default no-op; subclasses override as needed
  }

  /**
   * Advance child lifecycles (init/play/update).
   * FINISHED children are culled after updateSelf().
   */
  protected updateChildren(deltaTime: number): void {
    this.children.forEach((child) => {
      const childState = child.getState();
      switch (childState) {
        case "NEW":
          child.init();
          break;
        case "INITIALIZING":
          break;
        case "READY":
          child.play();
          break;
        case "PLAYING":
          child.update(deltaTime);
          break;
        case "FINISHED":
          break;
      }
    });

    this.children = this.children.filter((c) => c.getState() !== "FINISHED");
  }

  /**
   * Transition to FINISHED; cascades finish to children and clears links.
   * Override to release resources, then call super.
   */
  finish() {
    if (this.state === "FINISHED") {
      return;
    }

    this.state = "FINISHED";
    EventBus.emit("data-element-finished", {
      ctor: this.constructor.name,
      instance: this,
    });

    this.children.forEach((child) => {
      child.finish();
    });

    this.children = [];
    this.parent = null;
    this.event.clear();
  }

  // ---------------------------------------------------------------------------------
  // Getters/Setters
  // ---------------------------------------------------------------------------------
  /** Current lifecycle state. */
  getState(): LifecycleState {
    return this.state;
  }

  /** Element ID from config, if provided. */
  getId(): string | undefined {
    return this.id;
  }

  /** Set the parent link (normally managed by addChild/removeChild). */
  setParent(parent: DataElement | null) {
    this.parent = parent;
  }

  /** Current duration in ms; -1 means no auto-finish. */
  getDuration(): number {
    return this.duration;
  }

  /** Set duration; positive values enable auto-finish when elapsed exceeds duration. */
  setDuration(duration: number): void {
    this.duration = duration;
  }

  /** Progress 0–1; duration-driven when duration > 0, else inherits parent (or 0 at root). */
  getProgress(): number {
    if (this.duration > 0) {
      return Math.min(1, this.elapsed / this.duration);
    }
    return this.parent ? this.parent.getProgress() : 0;
  }

  /** Default rendering: calls drawSelf() then drawChildren(). Subclasses can override for custom control. */
  draw(ctx: CanvasRenderingContext2D) {
    this.drawSelf(ctx);
    this.drawChildren(ctx);
  }

  /**
   * Hook for subclasses to implement custom rendering.
   * Default: no-op; override to draw element-specific visuals.
   */
  protected drawSelf(_ctx: CanvasRenderingContext2D): void {
    // Default no-op; subclasses override as needed
  }

  /**
   * Helper to render all PLAYING children.
   */
  protected drawChildren(ctx: CanvasRenderingContext2D): void {
    this.children
      .filter((child) => {
        const childState = child.getState();
        return childState === "PLAYING" || childState === "PAUSED";
      })
      .forEach((child) => child.draw(ctx));
  }

  // ---------------------------------------------------------------------------------
  // Cloning
  // ---------------------------------------------------------------------------------
  /**
   * Create a deep clone of this element and its children.
   * Resets lifecycle state to NEW and clears parent/event listeners.
   * Subclasses can override to handle custom config/state.
   */
  clone(): DataElement {
    const cloned = new (this.constructor as new () => DataElement)();

    // Copy duration
    cloned.duration = this.duration;

    // Recursively clone all children
    this.children.forEach((child) => {
      cloned.addChild(child.clone());
    });

    return cloned;
  }

  // ---------------------------------------------------------------------------------
  // Local event system
  // ---------------------------------------------------------------------------------
  addEventListener(eventType: string, listener: (detail?: any) => void): void {
    this.event.addEventListener(eventType, listener);
  }

  removeEventListener(eventType: string, listener: Function): void {
    this.event.removeEventListener(eventType, listener);
  }

  emitEvent(eventType: string, detail?: any): void {
    this.event.emit(eventType, detail);
  }
}
