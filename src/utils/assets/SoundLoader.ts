// Minimal sound loader utility using URLs (like ImageLoader).
// Consumers pass an absolute or public-root URL to load.

import { pickRandom } from "../random";

/**
 * Create an HTMLAudioElement for the given sound URL.
 * Returns a promise for API parity with prior usage.
 */
export function getSound(url: string): Promise<HTMLAudioElement> {
  const audio = new Audio(url);
  return Promise.resolve(audio);
}

/** Create an HTMLAudioElement for a randomly chosen URL from a folder/list of sounds. */
export function getRandomSound(urls: readonly string[]): Promise<HTMLAudioElement> {
  return getSound(pickRandom(urls));
}

