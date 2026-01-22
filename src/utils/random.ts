export function pickRandom<T>(items: readonly T[]): T {
  if (!items.length) {
    throw new Error("Cannot pick from an empty array");
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export interface Range {
  min: number;
  max: number;
}

export interface Weighted<T> {
  weight: number;
  item: T;
}

export function pickRandomByWeight<T>(items: readonly Weighted<T>[]): T {
  if (!items.length) {
    throw new Error("Cannot pick from an empty array");
  }

  const totalWeight = items.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const weighted of items) {
    random -= weighted.weight;
    if (random <= 0) {
      return weighted.item;
    }
  }

  // Fallback (should not reach here)
  return items[items.length - 1].item;
}

export function getRandomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function getRandomInRange(range: Range): number {
  return getRandomBetween(range.min, range.max);
}

/* This may not produce a int between the values */
export function getRandomIntInRange(range: Range): number {
  return Math.floor(getRandomBetween(range.min, range.max + 1));
}
