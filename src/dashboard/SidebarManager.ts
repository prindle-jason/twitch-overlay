export type SidebarState = Record<string, boolean>;

export type SidebarChange = {
  sectionId: string;
  expanded: boolean;
  state: SidebarState;
};

/**
 * Manages expand/collapse state for dashboard sections.
 * Emits change callbacks when a section's state flips.
 */
export class SidebarManager {
  private state = new Map<string, boolean>();
  private listeners = new Set<(change: SidebarChange) => void>();

  constructor(initialState: SidebarState = SidebarManager.defaultState()) {
    this.applyInitialState(initialState);
  }

  /** Toggle the current state of a section and return the new state. */
  toggle(sectionId: string): boolean {
    const next = !this.isExpanded(sectionId);
    this.state.set(sectionId, next);
    this.emit(sectionId, next);
    return next;
  }

  /** Expand a section if it is not already expanded. */
  expand(sectionId: string): void {
    if (this.isExpanded(sectionId)) return;
    this.state.set(sectionId, true);
    this.emit(sectionId, true);
  }

  /** Collapse a section if it is not already collapsed. */
  collapse(sectionId: string): void {
    if (!this.isExpanded(sectionId)) return;
    this.state.set(sectionId, false);
    this.emit(sectionId, false);
  }

  /** Read-only check for whether a section is expanded. */
  isExpanded(sectionId: string): boolean {
    return this.state.get(sectionId) ?? false;
  }

  /** Get the entire current state as a snapshot. */
  getState(): SidebarState {
    return this.snapshot();
  }

  /** Register a listener for state changes. Returns an unsubscribe function. */
  onChange(listener: (change: SidebarChange) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(sectionId: string, expanded: boolean): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      listener({ sectionId, expanded, state: snapshot });
    }
  }

  private applyInitialState(initial: SidebarState): void {
    // Start with defaults, then apply any overrides from provided state
    const defaults = SidebarManager.defaultState();
    for (const [sectionId, expanded] of Object.entries(defaults)) {
      this.state.set(sectionId, expanded);
    }
    // Override with any provided state
    for (const [sectionId, expanded] of Object.entries(initial)) {
      this.state.set(sectionId, expanded);
    }
  }

  private snapshot(): SidebarState {
    const snapshot: SidebarState = {};
    for (const [sectionId, expanded] of this.state.entries()) {
      snapshot[sectionId] = expanded;
    }
    return snapshot;
  }

  private static defaultState(): SidebarState {
    return {
      "control-section": true,
      "stats-section": true,
      "scenes-section": true,
    };
  }
}
