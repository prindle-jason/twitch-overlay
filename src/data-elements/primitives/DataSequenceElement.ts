import { DataElement } from "./DataElement";
import { Sequence } from "../../utils/timing/Sequence";

/**
 * Data-driven element wrapper for a Sequence.
 * Mirrors SequenceElement but extends DataElement for use in data-driven scenes.
 */
export class DataSequenceElement<T> extends DataElement {
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
