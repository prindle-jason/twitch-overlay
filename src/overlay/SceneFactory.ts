import type { SceneElement } from "../elements/scenes/SceneElement";
import type { PoolType, SceneType } from "../types/SceneTypes";
import { pickRandom } from "../utils/random";
import * as Scenes from "../elements/scenes";

/**
 * Factory function type for creating scenes. The payload shape depends on the
 * target scene; callers are responsible for supplying the right shape.
 */
type SceneFactoryFn = (payload?: unknown) => SceneElement;

/**
 * Central registry for scene creation.
 *
 * - `SceneType` → single scene factory (one-to-one mapping). These are used
 *   when the caller knows the exact scene class to instantiate. Missing types
 *   will throw at lookup time; upstream validation (e.g., `SceneType` enums
 *   and route validation) is expected to guard against that.
 * - `PoolType` → array of factories (one-to-many). A pool represents a
 *   thematic category (e.g., `success`) and `createSceneFromPool` will pick a
 *   random variant from that pool.
 *
 * Payloads are forwarded verbatim to the chosen factory. Payload typing is
 * intentionally loose for now; refer to individual scene constructors for the
 * expected shape until stricter typing is introduced.
 */
export class SceneFactory {
  // Direct scene lookups: each SceneType maps to exactly one factory.
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
    brainrot: (p) => new Scenes.BrainrotScene(),

    // Triggerable pools
    hypeChat: (p) => new Scenes.HypeChatScene(p as Record<string, unknown>),
    dvdBounce: (p) => new Scenes.PooledDvdScene(),
    // Glitch scenes
    glitch: (p) => new Scenes.GlitchScene(),
    glitchRepeater: (p) => new Scenes.GlitchRepeaterScene(p as any),
    // Test pools
    chatMessageTest: (p) => new Scenes.ChatMessageTestScene(),
    newImageTest: (p) => new Scenes.ImageTestScene(),
  };

  // Thematic pools: each PoolType maps to one or more factories; a random
  // factory is chosen when the pool is triggered.
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
   * Create a scene directly from a SceneType, optionally passing a payload.
   * Unknown SceneTypes will throw because the lookup is direct; callers should
   * validate the type before invoking this.
   */
  static createScene(
    sceneType: SceneType,
    payload?: unknown,
  ): SceneElement | null {
    return this.sceneTypeMaps[sceneType](payload);
  }

  /**
   * Create a random scene from a PoolType, optionally passing a payload.
   * Returns null if the pool is unknown or empty.
   */
  static createSceneFromPool(
    poolType: PoolType,
    payload?: unknown,
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
