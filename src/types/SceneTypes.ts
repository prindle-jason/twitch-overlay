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
  | "chatMessageTest"
  | "newImageTest"
  | "hypeChat"
  | "dvdBounce"
  | "glitch"
  | "glitchRepeater";

/**
 * Pool identifier type
 */
export type PoolType = "success" | "failure";
