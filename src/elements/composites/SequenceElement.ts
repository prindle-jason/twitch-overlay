import { Element } from "../primitives/Element";
import { Sequence } from "../../utils/timing/Sequence";

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

  protected override updateSelf(deltaTime: number): void {
    this.sequence.update(deltaTime);
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
