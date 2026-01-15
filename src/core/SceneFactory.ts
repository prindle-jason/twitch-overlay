import type { SceneElement } from "../elements/scenes/SceneElement";
import type { PoolId } from "../utils/types";
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
  private static pools: Record<PoolId, SceneFactoryFn[]> = {
    // Regular pools
    ssbmSuccess: [(p) => new Scenes.SsbmSuccessScene()],
    ssbmFail: [(p) => new Scenes.SsbmFailScene()],
    bamSuccess: [(p) => new Scenes.BamSuccessScene()],
    bamUhOh: [(p) => new Scenes.BamFailureScene()],
    watermark: [(p) => new Scenes.WatermarkScene(p as any)],
    confetti: [(p) => new Scenes.ConfettiScene(p as any)],
    headblade: [(p) => new Scenes.HeadbladeScene(p as any)],
    ticker: [(p) => new Scenes.TickerScene(p as any)],
    xJason: [(p) => new Scenes.XJasonScene()],

    // Triggerable pools
    hypeChat: [(p) => new Scenes.HypeChatScene()],
    dvdBounce: [(p) => new Scenes.PooledDvdScene()],

    // Multi-variant pools
    success: [
      (p) => new Scenes.SsbmSuccessScene(),
      (p) => new Scenes.BamSuccessScene(),
    ],
    failure: [
      (p) => new Scenes.SsbmFailScene(),
      (p) => new Scenes.BamFailureScene(),
    ],

    // Test pools
    richTextTest: [(p) => new Scenes.RichTextTestScene()],
    chatMessageTest: [(p) => new Scenes.ChatMessageTestScene()],
    newImageTest: [(p) => new Scenes.ImageTestScene()],
  };

  /**
   * Create a scene from a pool ID, optionally passing a payload.
   * For multi-variant pools, picks a random factory.
   */
  static createScene(poolId: PoolId, payload?: unknown): SceneElement | null {
    const factories = this.pools[poolId];
    if (!factories?.length) return null;

    const factory = pickRandom(factories);
    return factory(payload);
  }

  /**
   * Get all known pool IDs
   */
  static getPoolIds(): PoolId[] {
    return Object.keys(this.pools) as PoolId[];
  }

  /**
   * Check if a pool has any factories registered
   */
  static hasPool(poolId: PoolId): boolean {
    return !!this.pools[poolId]?.length;
  }
}
