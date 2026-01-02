import { Behavior } from "../behaviors/Behavior";
import type { LifecycleState } from "../utils/types";
import { OverlaySettings } from "../core/OverlaySettings";

/**
 * Base node for overlay scenes. Orchestrates parent/child links, behavior
 * hooks, lifecycle transitions, and event dispatch so subclasses can focus on
 * their own draw/update concerns.
 */
export abstract class Element {
  // ---------------------------------------------------------------------------------
  // State management
  // ---------------------------------------------------------------------------------
  protected behaviors: Behavior[] = [];
  protected parent: Element | null = null;
  protected children: Element[] = [];
  protected duration: number = -1;
  protected elapsed = 0;
  protected state: LifecycleState = "NEW";
  protected eventTarget = new EventTarget();

  constructor(config: Record<string, unknown> = {}) {
    Object.assign(this, config);
  }

  // ---------------------------------------------------------------------------------
  // Child management
  // ---------------------------------------------------------------------------------
  protected addChild(child: Element): void {
    //console.log(`Adding child to ${this.constructor.name}:`, child);
    child.setParent(this);
    this.children.push(child);
  }

  protected removeChild(child: Element): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.setParent(null);
    }
  }

  getChildrenOfType<T extends Element>(ctor: new (...args: any[]) => T): T[] {
    return this.children.filter((c) => c instanceof ctor) as T[];
  }

  // ---------------------------------------------------------------------------------
  // Behavior management
  // ---------------------------------------------------------------------------------
  addBehavior(behavior: Behavior) {
    this.behaviors.push(behavior);
    return this;
  }

  removeBehavior(behavior: Behavior) {
    const index = this.behaviors.indexOf(behavior);
    if (index !== -1) {
      this.behaviors.splice(index, 1);
    }
    return this;
  }

  // ---------------------------------------------------------------------------------
  // Events API
  // ---------------------------------------------------------------------------------
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.eventTarget.addEventListener(type, listener, options);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    this.eventTarget.removeEventListener(type, listener, options);
  }

  protected dispatchEvent(event: Event): boolean {
    return this.eventTarget.dispatchEvent(event);
  }

  // ---------------------------------------------------------------------------------
  // Lifecycle management
  // ---------------------------------------------------------------------------------
  // Load async resources.  Any children already added will also be initialized.
  // Transitions to READY state when complete.
  async init() {
    if (this.state !== "NEW") {
      return;
    }

    this.state = "INITIALIZING";
    this.elapsed = 0;

    await Promise.all(this.children.map((child) => child.init()));
    this.state = "READY";
  }

  // Resources are ready, the element transitions to PLAYING state.
  // Can do any final preparations here with resources loaded.
  play() {
    if (this.state !== "READY") {
      return;
    }

    this.state = "PLAYING";
    this.behaviors.forEach((behavior) => behavior.play?.(this));
  }

  // Advance timers and children each frame while PLAYING.
  update(deltaTime: number) {
    if (this.state !== "PLAYING") {
      return;
    }

    this.elapsed += deltaTime;
    if (this.duration !== -1 && this.elapsed >= this.duration) {
      this.finish();
      return;
    }

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

    this.behaviors.forEach((behavior) => behavior.update?.(this, deltaTime));
  }

  // Transition to FINISHED state (cascading to all children), cleaning up resources.
  // Any final work can be done here.
  finish() {
    if (this.state === "FINISHED") {
      return;
    }

    this.state = "FINISHED";
    this.children.forEach((child) => {
      child.finish();
    });

    this.behaviors.forEach((behavior) => behavior.finish?.(this));
  }

  // ---------------------------------------------------------------------------------
  // Getters/Setters
  // ---------------------------------------------------------------------------------
  getState(): LifecycleState {
    return this.state;
  }

  setParent(parent: Element | null) {
    this.parent = parent;
  }

  getDuration(): number {
    return this.duration;
  }

  getProgress(): number {
    if (this.duration > 0) {
      return Math.min(1, this.elapsed / this.duration);
    }
    return this.parent ? this.parent.getProgress() : 0;
  }

  // Settings hooks
  onSettingsChanged(settings: OverlaySettings): void {
    this.children.forEach((child) => child.onSettingsChanged(settings));
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.children.forEach((child) => child.draw(ctx));
  }
}
