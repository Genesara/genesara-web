// Deterministic PRNG keyed by agentId.
// Same agentId always produces the same appearance.

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  range(min: number, max: number): number;
  weightedIndex(weights: number[]): number;
  pick<T>(items: readonly T[]): T;
}

export function rngFor(seedInput: string, salt: string = ''): Rng {
  const seed = fnv1a(salt ? `${seedInput}::${salt}` : seedInput);
  const next = mulberry32(seed);
  return {
    next,
    int(maxExclusive) {
      return Math.floor(next() * maxExclusive);
    },
    range(min, max) {
      return min + next() * (max - min);
    },
    weightedIndex(weights) {
      const total = weights.reduce((a, b) => a + b, 0);
      if (total <= 0) return 0;
      let pick = next() * total;
      for (let i = 0; i < weights.length; i++) {
        pick -= weights[i];
        if (pick <= 0) return i;
      }
      return weights.length - 1;
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
  };
}
