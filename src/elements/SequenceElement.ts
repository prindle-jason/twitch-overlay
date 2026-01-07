import { Element } from "./Element";
import { Sequence } from "../utils/Sequence";

/**
 * Element wrapper for a Sequence
 * Delegates to Sequence for all playback logic
 */
export class SequenceElement<T> extends Element {
  private sequence: Sequence<T>;

  constructor(sequence: Sequence<T>) {
    super();
    this.sequence = sequence;
  }

  override update(deltaTime: number): void {
    this.sequence.update(deltaTime);
    super.update(deltaTime);
  }

  getCurrent(): T | null {
    return this.sequence.getCurrent();
  }

  isFinished(): boolean {
    return this.sequence.isFinished();
  }

  getSequence(): Sequence<T> {
    return this.sequence;
  }
}
