/**
 * Lifecycle state for Effects and Elements
 * NEW → INITIALIZING → READY → PLAYING → FINISHED
 */
export type LifecycleState =
  | "NEW"
  | "INITIALIZING"
  | "READY"
  | "PLAYING"
  | "FINISHED";
