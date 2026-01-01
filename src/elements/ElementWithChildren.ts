import { Element } from "./Element";
import type { OverlaySettings } from "../core/OverlaySettings";

/**
 * ElementWithChildren is a base class for elements that contain child elements.
 * It provides common functionality for managing and propagating lifecycle events to children.
 *
 * This is a temporary stepping stone - eventually it will replace Element entirely.
 */
export abstract class ElementWithChildren extends Element {
  protected children: Element[] = [];

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
    this.children.push(child);
  }

  /**
   * Remove a child element from this element.
   */
  protected removeChild(child: Element): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
    this.children.forEach((child) => child.update(deltaTime));
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    this.children.forEach((child) => child.draw(ctx));
  }

  override onFinish(): void {
    this.children.forEach((child) => {
      child.setState("FINISHED");
      child.onFinish();
    });
    super.onFinish();
  }

  override onSettingsChanged(settings: OverlaySettings): void {
    this.children.forEach((child) => child.onSettingsChanged(settings));
  }
}
