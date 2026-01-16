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

/**
 * Scene type identifiers - identifies the actual scene class
 * Used for routing scene config messages (scene.type must match one of these)
 * Naming follows the simplified pool naming pattern
 */
export type SceneType =
  | "ssbmSuccess"
  | "ssbmFail"
  | "bamSuccess"
  | "bamUhOh"
  | "watermark"
  | "confetti"
  | "headblade"
  | "ticker"
  | "xJason"
  | "richTextTest"
  | "chatMessageTest"
  | "newImageTest"
  | "hypeChat"
  | "dvdBounce";

/**
 * Pool identifier type
 */
export type PoolType = "success" | "failure";
