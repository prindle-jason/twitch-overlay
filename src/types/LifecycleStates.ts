/**
 * Lifecycle state for Effects and Elements
 * NEW → INITIALIZING → READY → PLAYING → PAUSED → FINISHED
 *
 * PAUSED can only be entered from PLAYING. Calling pause() on non-PLAYING elements is a no-op.
 * Similarly, resume() only works when already PAUSED. Paused elements still render but don't update.
 */
export type LifecycleState =
  | "NEW"
  | "INITIALIZING"
  | "READY"
  | "PLAYING"
  | "PAUSED"
  | "FINISHED";
