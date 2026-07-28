/**
 * Simple local event emitter for element-to-element communication.
 */
export class EventEmitter {
  private listeners = new Map<string, Set<Function>>();

  /**
   * Register a listener for a specific event type.
   */
  addEventListener(eventType: string, listener: (detail?: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  /**
   * Unregister a listener for a specific event type.
   */
  removeEventListener(eventType: string, listener: Function): void {
    this.listeners.get(eventType)?.delete(listener);
  }

  /**
   * Emit an event to all registered listeners.
   */
  emit(eventType: string, detail?: any): void {
    this.listeners.get(eventType)?.forEach((listener) => listener(detail));
  }

  /**
   * Clear all listeners (useful for cleanup).
   */
  clear(): void {
    this.listeners.clear();
  }
}
