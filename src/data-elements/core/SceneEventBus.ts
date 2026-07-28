/**
 * Scene-scoped event bus for inter-element communication within a single scene.
 * Unlike the global EventBus, each scene has its own instance, allowing elements
 * to communicate without affecting other scenes or global state.
 */
export class SceneEventBus {
  private eventTarget = new EventTarget();

  /**
   * Subscribe to an event type.
   * @param type The event type to listen for
   * @param listener Callback receiving the event detail
   */
  on(type: string, listener: (detail?: any) => void): void {
    const wrappedListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      listener(customEvent.detail);
    };

    (listener as any).__wrapped = wrappedListener;
    this.eventTarget.addEventListener(type, wrappedListener);
  }

  /**
   * Unsubscribe from an event type.
   * @param type The event type to stop listening for
   * @param listener The same callback passed to on()
   */
  off(type: string, listener: (detail?: any) => void): void {
    const wrappedListener = (listener as any).__wrapped;
    if (wrappedListener) {
      this.eventTarget.removeEventListener(type, wrappedListener);
      delete (listener as any).__wrapped;
    }
  }

  /**
   * Emit an event with detail payload.
   * @param type The event type to emit
   * @param detail The event payload
   */
  emit(type: string, detail?: any): void {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * Clear all listeners (useful for cleanup).
   */
  clear(): void {
    // Create a new EventTarget to clear all listeners
    this.eventTarget = new EventTarget();
  }
}
