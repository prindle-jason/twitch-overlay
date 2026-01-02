import { Element } from "./Element";
import type { OverlaySettings } from "../core/OverlaySettings";

/**
 * ElementWithChildren is a base class for elements that contain child elements.
 * It provides common functionality for managing and propagating lifecycle events to children.
 * It also tracks duration and elapsed time for coordinating child animations.
 *
 * This is a temporary stepping stone - eventually it will replace Element entirely.
 */
export abstract class ElementWithChildren extends Element {
  protected children: Element[] = [];
  duration: number = -1;
  elapsed = 0;

  override async init(): Promise<void> {
    console.log("Initializing ElementWithChildren:", this.constructor.name);
    this.elapsed = 0;

    //this.children.forEach((child) => child.init());
    await Promise.all(this.children.map((c) => c.init()));
    //this.setState("READY");
  }

  /**
   * Get all children of a specific type.
   * Useful for targeting specific child elements (e.g., all ImageElements).
   */
  getChildrenOfType<T extends Element>(ctor: new (...args: any[]) => T): T[] {
    return this.children.filter((c) => c instanceof ctor) as T[];
  }

  /**
   * Add a child element to this element.
   */
  protected addChild(child: Element): void {
    console.log(`Adding child to ${this.constructor.name}:`, child);
    child.setParent(this);
    this.children.push(child);
  }

  /**
   * Remove a child element from this element.
   */
  protected removeChild(child: Element): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.setParent(null);
    }
  }

  override update(deltaTime: number): void {
    this.elapsed += deltaTime;

    this.children.forEach((child) => child.update(deltaTime));

    // Check if duration has elapsed and finish if so
    if (this.duration !== -1 && this.elapsed >= this.duration) {
      //this.setState("FINISHED");
      this.children.forEach((child) => {
        //child.setState("FINISHED");
        child.finish();
      });
    }

    super.update(deltaTime);
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    this.children.forEach((child) => child.draw(ctx));
  }

  override finish(): void {
    this.children.forEach((child) => {
      //child.setState("FINISHED");
      //child.finish();
    });
    super.finish();
  }

  override onSettingsChanged(settings: OverlaySettings): void {
    this.children.forEach((child) => child.onSettingsChanged(settings));
  }

  getProgress(): number {
    return this.duration > 0 ? Math.min(1, this.elapsed / this.duration) : 0;
  }
}
