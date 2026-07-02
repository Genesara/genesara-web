import type { RaceConfig, RaceId } from './types';

const HEAD_COUNT = 8;
const HAIR_COUNT = 9;

function uniformWeights(n: number): number[] {
  return Array(n).fill(1);
}

function biasedWeights(n: number, peak: number, weight: number): number[] {
  const w = uniformWeights(n);
  if (peak >= 0 && peak < n) w[peak] = weight;
  return w;
}

export const RACE_CONFIGS: Record<RaceId, RaceConfig> = {
  human_steppe: {
    raceId: 'human_steppe',
    headBias: biasedWeights(HEAD_COUNT, 2, 2.4),
    hairBias: biasedWeights(HAIR_COUNT, 1, 2.0),
    bodyBias: [0.9, 1.6, 1.0],
    skinPalette: ['#A77B5A', '#8E5E3F', '#B68C68', '#6F4A30', '#9C6E4A'],
    hairPalette: ['#2C1A0F', '#1A0F08', '#4A3220', '#3A2418', '#221510'],
    eyePalette: ['#3B2A1A', '#5A3E22', '#4A3220', '#2C1A10'],
    heightRange: [0.97, 1.04],
    headsRange: [7.3, 7.7],
  },
  human_coastal: {
    raceId: 'human_coastal',
    headBias: biasedWeights(HEAD_COUNT, 4, 1.8),
    hairBias: biasedWeights(HAIR_COUNT, 4, 1.6),
    bodyBias: [1.2, 1.5, 0.8],
    skinPalette: ['#C9A07A', '#B68868', '#D9B58A', '#9E7858', '#A88869'],
    hairPalette: ['#3A2418', '#5A3820', '#1F1208', '#6B4828', '#4A2E1A'],
    eyePalette: ['#4A3A20', '#3A2818', '#6B4A2A', '#284A4E'],
    heightRange: [0.95, 1.02],
    headsRange: [7.1, 7.5],
  },
  human_alpine: {
    raceId: 'human_alpine',
    headBias: biasedWeights(HEAD_COUNT, 5, 2.0),
    hairBias: biasedWeights(HAIR_COUNT, 6, 2.2),
    bodyBias: [0.8, 1.4, 1.4],
    skinPalette: ['#D9B89A', '#E2C5A8', '#C8A788', '#BEA086', '#D2B596'],
    hairPalette: ['#6B4828', '#8A6238', '#3A2418', '#A07A4A', '#241810'],
    eyePalette: ['#284A4E', '#3A5E62', '#4A4220', '#3B2A1A'],
    heightRange: [0.99, 1.06],
    headsRange: [7.5, 7.9],
  },
};
