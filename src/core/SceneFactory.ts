import type { SceneElement } from "../elements/scenes/SceneElement";
import type { PoolType, SceneType } from "../utils/types";
import { pickRandom } from "../utils/random";
import * as Scenes from "../elements/scenes";

/**
 * Factory function type for creating scenes
 */
type SceneFactoryFn = (payload?: unknown) => SceneElement;

/**
 * SceneFactory manages scene creation through factory functions.
 * This avoids type issues with storing class constructors that have varied signatures.
 */
export class SceneFactory {
  private static sceneTypeMaps: Record<SceneType, SceneFactoryFn> = {
    // Regular pools
    ssbmSuccess: (p) => new Scenes.SsbmSuccessScene(),
    ssbmFail: (p) => new Scenes.SsbmFailScene(),
    bamSuccess: (p) => new Scenes.BamSuccessScene(),
    bamUhOh: (p) => new Scenes.BamFailureScene(),
    watermark: (p) => new Scenes.WatermarkScene(p as any),
    confetti: (p) => new Scenes.ConfettiScene(p as any),
    headblade: (p) => new Scenes.HeadbladeScene(p as any),
    ticker: (p) => new Scenes.TickerScene(p as any),
    xJason: (p) => new Scenes.XJasonScene(),

    // Triggerable pools
    hypeChat: (p) => new Scenes.HypeChatScene(p as Record<string, unknown>),
    dvdBounce: (p) => new Scenes.PooledDvdScene(),
    // Test pools
    richTextTest: (p) => new Scenes.RichTextTestScene(),
    chatMessageTest: (p) => new Scenes.ChatMessageTestScene(),
    newImageTest: (p) => new Scenes.ImageTestScene(),
  };

  private static pools: Record<PoolType, SceneFactoryFn[]> = {
    // Multi-variant pools
    success: [
      (p) => new Scenes.SsbmSuccessScene(),
      (p) => new Scenes.BamSuccessScene(),
    ],
    failure: [
      (p) => new Scenes.SsbmFailScene(),
      (p) => new Scenes.BamFailureScene(),
    ],
  };

  /**
   * Create a scene directly from a type, optionally passing a payload.
   * For multi-variant pools, picks a random factory.
   */
  static createScene(
    sceneType: SceneType,
    payload?: unknown
  ): SceneElement | null {
    return this.sceneTypeMaps[sceneType](payload);
  }

  /**
   * Create a random scene from a pool type, optionally passing a payload.
   *
   */
  static createSceneFromPool(
    poolType: PoolType,
    payload?: unknown
  ): SceneElement | null {
    const factory = this.pools[poolType];

    if (!factory) return null;
    const sceneFn = pickRandom(factory);

    return sceneFn(payload);
  }

  /**
   * Get all known pool IDs
   */
  static getPoolIds(): PoolType[] {
    return Object.keys(this.pools) as PoolType[];
  }

  /**
   * Check if a pool has any factories registered
   */
  static hasPool(poolId: PoolType): boolean {
    return !!this.pools[poolId]?.length;
  }
}
