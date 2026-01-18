import type { EventType, EventDetailMap } from "../utils/EventTypes";

/**
 * Singleton event bus for loosely-coupled communication between system components.
 * Use for lifecycle events, settings changes, and other global notifications.
 *
 * For tight parent-child coupling (e.g., monitoring a specific sound's end),
 * use Element's instance-level addEventListener instead.
 *
 * @example
 * ```ts
 * // Subscribe to lifecycle events
 * EventBus.on("element-created", (detail) => {
 *   console.log(`Created: ${detail.ctor}`);
 * });
 *
 * // Subscribe to settings changes
 * EventBus.on("settings-changed", (detail) => {
 *   this.volume = detail.masterVolume;
 * });
 *
 * // Emit an event
 * EventBus.emit("element-finished", { ctor: "DvdElement", instance: this });
 * ```
 */
class EventBusImpl {
  private eventTarget = new EventTarget();

  /**
   * Subscribe to an event type.
   * @param type The event type to listen for
   * @param listener Callback receiving the event detail
   */
  on<T extends EventType>(
    type: T,
    listener: (detail: EventDetailMap[T]) => void
  ): void {
    const wrappedListener = (e: Event) => {
      const customEvent = e as CustomEvent<EventDetailMap[T]>;
      listener(customEvent.detail);
    };

    // Store original listener for removal
    (listener as any).__wrapped = wrappedListener;
    this.eventTarget.addEventListener(type, wrappedListener);
  }

  /**
   * Unsubscribe from an event type.
   * @param type The event type to stop listening for
   * @param listener The same callback passed to on()
   */
  off<T extends EventType>(
    type: T,
    listener: (detail: EventDetailMap[T]) => void
  ): void {
    const wrappedListener = (listener as any).__wrapped;
    if (wrappedListener) {
      this.eventTarget.removeEventListener(type, wrappedListener);
      delete (listener as any).__wrapped;
    }
  }

  /**
   * Emit an event with typed detail payload.
   * @param type The event type to emit
   * @param detail The event payload
   */
  emit<T extends EventType>(type: T, detail: EventDetailMap[T]): void {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

/**
 * Global singleton event bus instance.
 */
export const EventBus = new EventBusImpl();
