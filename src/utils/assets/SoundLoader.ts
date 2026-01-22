// Minimal sound loader utility using URLs (like ImageLoader).
// Consumers pass an absolute or public-root URL to load.

/**
 * Create an HTMLAudioElement for the given sound URL.
 * Returns a promise for API parity with prior usage.
 */
export function getSound(url: string): Promise<HTMLAudioElement> {
  const audio = new Audio(url);
  return Promise.resolve(audio);
}

