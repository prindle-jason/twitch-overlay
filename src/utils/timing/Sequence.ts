/**
 * A sequence manages playback through a list of items with durations
 * Similar to Scheduler but for playing through a fixed sequence
 */
export class Sequence<T> {
  private items: Array<{ item: T; duration: number }>;
  private currentIndex = 0;
  private currentItemRemaining = 0; // Time remaining in current item
  private elapsed = 0;
  private totalDuration = 0;
  private isLooped: boolean;

  constructor(
    items: Array<{ item: T; duration: number }>,
    isLooped: boolean = true
  ) {
    this.items = items;
    this.isLooped = isLooped;
    this.totalDuration = items.reduce((sum, entry) => sum + entry.duration, 0);

    // Initialize with first item's duration
    if (this.items.length > 0) {
      this.currentItemRemaining = this.items[0].duration;
    }
  }

  update(deltaTime: number): void {
    if (this.items.length === 0) return;
    if (!this.isLooped && this.isFinished()) return;

    this.elapsed += deltaTime;
    let remaining = deltaTime;

    while (remaining > 0) {
      if (remaining < this.currentItemRemaining) {
        // Still within current item
        this.currentItemRemaining -= remaining;
        remaining = 0;
      } else {
        // Move to next item
        remaining -= this.currentItemRemaining;
        this.currentIndex++;

        // Handle end/looping
        if (this.currentIndex >= this.items.length) {
          if (this.isLooped) {
            this.currentIndex = 0;
            this.elapsed = this.elapsed % this.totalDuration;
          } else {
            // Stay on last item when finished
            this.currentIndex = this.items.length - 1;
            this.currentItemRemaining = 0;
            break;
          }
        }

        // Set remaining time for new current item
        this.currentItemRemaining = this.items[this.currentIndex].duration;
      }
    }
  }

  getCurrent(): T | null {
    const entry = this.items[this.currentIndex];
    return entry ? entry.item : null;
  }

  isFinished(): boolean {
    if (this.isLooped) return false;
    return this.elapsed >= this.totalDuration;
  }

  getTotalDuration(): number {
    return this.totalDuration;
  }

  getItemCount(): number {
    return this.items.length;
  }

  reset(): void {
    this.currentIndex = 0;
    this.elapsed = 0;
    this.currentItemRemaining =
      this.items.length > 0 ? this.items[0].duration : 0;
  }
}
