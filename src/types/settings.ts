/**
 * Settings configuration for overlay behavior.
 *
 * This is a discriminated union type where `target` serves as the discriminator field.
 * TypeScript will automatically narrow the type based on the `target` value, allowing
 * type-safe access to setting properties without manual type guards or casting.
 *
 * Example usage:
 * ```typescript
 * function handleSettings(settings: Settings) {
 *   if (settings.target === "global") {
 *     // TypeScript knows this is GlobalSettings
 *     console.log(settings.masterVolume);  // ✓ OK
 *     console.log(settings.minMessageRate); // ✗ Error: doesn't exist
 *   } else if (settings.target === "hypeChat") {
 *     // TypeScript knows this is HypeChatSettings
 *     console.log(settings.minMessageRate); // ✓ OK
 *     console.log(settings.masterVolume);   // ✗ Error: doesn't exist
 *   }
 * }
 * ```
 */
export type Settings = GlobalSettings | HypeChatSettings;

/**
 * Global overlay settings that apply across all scenes.
 */
export interface GlobalSettings {
  target: "global";
  masterVolume?: number;
  stability?: number;
  togglePause?: boolean;
}

/**
 * Settings specific to the HypeChat scene.
 */
export interface HypeChatSettings {
  target: "hypeChat";
  minMessageRate?: number;
  maxMessageRate?: number;
  lerpFactor?: number;
  minBurstCount?: number;
  maxBurstCount?: number;
}
