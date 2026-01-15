import * as Scenes from "../elements/scenes";
import type { SceneElement } from "../elements/scenes/SceneElement";

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
 * Pool identifier type
 */
export type PoolId =
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
  | "dvdBounce"
  | "success"
  | "failure";
