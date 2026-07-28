import { FilterType, FILTER_UNITS } from "./FilterTypes";

/**
 * Manages composition of multiple CSS filters.
 * Allows independent addition/modification of filters without overwrites.
 * Handles unit application internally.
 */
export class FilterComposer {
  private filters: Map<FilterType, number> = new Map();

  /**
   * Set a filter, replacing any existing value for that type.
   */
  setFilter(type: FilterType, value: number): void {
    this.filters.set(type, value);
  }

  /**
   * Add or update a filter (semantically same as setFilter, but named for intent).
   */
  addFilter(type: FilterType, value: number): void {
    this.filters.set(type, value);
  }

  /**
   * Remove a filter by type.
   */
  removeFilter(type: FilterType): void {
    this.filters.delete(type);
  }

  /**
   * Check if a filter is currently set.
   */
  hasFilter(type: FilterType): boolean {
    return this.filters.has(type);
  }

  /**
   * Get the current value of a filter, or null if not set.
   */
  getFilter(type: FilterType): number | null {
    return this.filters.get(type) ?? null;
  }

  /**
   * Clear all filters.
   */
  clear(): void {
    this.filters.clear();
  }

  /**
   * Generate the CSS filter string with units applied.
   * Returns "none" if no filters are set.
   * Special handling for drop-shadow (not implemented yet; treat as string).
   */
  getFilterString(): string {
    if (this.filters.size === 0) {
      return "none";
    }

    const parts: string[] = [];

    for (const [type, value] of this.filters.entries()) {
      const unit = FILTER_UNITS[type];
      parts.push(`${type}(${value}${unit})`);
    }

    return parts.join(" ");
  }

  /**
   * Create a deep clone of this FilterComposer.
   */
  clone(): FilterComposer {
    const cloned = new FilterComposer();
    for (const [type, value] of this.filters.entries()) {
      cloned.setFilter(type, value);
    }
    return cloned;
  }
}
