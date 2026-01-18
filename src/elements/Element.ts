import type { LifecycleState } from "../utils/types";
import { logger } from "../utils/logger";
import { EventBus } from "../core/EventBus";

/**
 * Base node in the overlay tree.
 * Manages parent/child links, lifecycle transitions, and event hooks so subclasses focus on rendering/logic.
 *
 * Lifecycle: NEW → INITIALIZING → READY → PLAYING → FINISHED
 * - NEW: constructor done; avoid async work.
 * - init(): start async prep; awaits all current children; call super.init() last; transitions to READY.
 * - play(): final prep that assumes async is ready; auto-plays READY children; transitions to PLAYING.
 * - update(): per-frame while PLAYING; advances elapsed, auto-finishes on duration, and steps children.
 * - finish(): clean shutdown; cascades to children and clears links.
 *
 * Duration/progress:
 * - duration -1 → never auto-finish; positive duration calls finish() when elapsed exceeds it.
 * - getProgress(): duration-driven when > 0; otherwise inherits parent progress; root without duration returns 0.
 *
 * Child orchestration:
 * - Children added before init() are awaited in init().
 * - Children added while PLAYING are initialized/played during updateChildren().
 * - FINISHED children are culled automatically each update.
 *
 * Events: Lifecycle events (created/finished) emitted via EventBus for diagnostics. For tight coupling, expose resources directly.
 * Settings: onSettingsChanged() propagates to children; current usage mainly volume/pause and may evolve.
 * Rendering: default draw() only draws children so non-drawing parents can host drawable children.
 */
export abstract class Element {
  // ---------------------------------------------------------------------------------
  // State management
  // ---------------------------------------------------------------------------------
  protected parent: Element | null = null;
  protected children: Element[] = [];
  protected duration: number = -1;
  protected elapsed = 0;
  protected state: LifecycleState = "NEW";

  constructor(config: Record<string, unknown> = {}) {
    Object.assign(this, config);
    EventBus.emit("element-created", {
      ctor: this.constructor.name,
      instance: this,
    });
  }

  // ---------------------------------------------------------------------------------
  // Child management
  // ---------------------------------------------------------------------------------
  /** Attach a child element and wire its parent pointer. */
  addChild(child: Element): void {
    logger.debug(this.constructor.name, "adding child", child.constructor.name);
    child.setParent(this);
    this.children.push(child);
  }

  /** Detach a child and clear its parent pointer if present. */
  removeChild(child: Element): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.setParent(null);
    }
  }

  /** First child matching ctor or null if none. */
  getChildOfType<T extends Element>(ctor: new (...args: any[]) => T): T | null {
    for (const child of this.children) {
      if (child instanceof ctor) {
        return child;
      }
    }
    return null;
  }

  /** All children matching ctor (non-recursive). */
  getChildrenOfType<T extends Element>(
    ctor: abstract new (...args: any[]) => T
  ): T[] {
    return this.children.filter((c) => c instanceof ctor) as T[];
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

    // Start any children that were added before play (play() will no-op if child isn't READY)
    this.children.forEach((child) => child.play());
  }

  /**
   * Per-frame update while PLAYING; advances elapsed, auto-finishes on duration, and steps children.
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

    this.updateChildren(deltaTime);
  }

  /**
   * Transition to FINISHED; cascades finish to children and clears links. Override to release resources, then call super.
   */
  finish() {
    if (this.state === "FINISHED") {
      return;
    }

    this.state = "FINISHED";
    EventBus.emit("element-finished", {
      ctor: this.constructor.name,
      instance: this,
    });

    this.children.forEach((child) => {
      child.finish();
    });

    this.children = [];
    this.parent = null;
  }

  // ---------------------------------------------------------------------------------
  // Getters/Setters
  // ---------------------------------------------------------------------------------
  /** Current lifecycle state. */
  getState(): LifecycleState {
    return this.state;
  }

  /** Set the parent link (normally managed by addChild/removeChild). */
  setParent(parent: Element | null) {
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

  /** Default rendering: draws all children (supports drawable descendants even if parent has no visuals). */
  draw(ctx: CanvasRenderingContext2D) {
    this.children.forEach((child) => child.draw(ctx));
  }

  /** Internal: advance child lifecycles and cull FINISHED children. */
  private updateChildren(deltaTime: number): void {
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
}
