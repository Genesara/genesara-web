import { rngFor } from './prng';
import { RACE_CONFIGS } from './races';
import {
  BODY_SHAPES,
  DEFAULT_RACE,
  RACES,
  type Appearance,
  type BodyShape,
  type RaceId,
} from './types';

function isKnownRace(value: string): value is RaceId {
  return (RACES as string[]).includes(value);
}

// Deterministically derives an agent's appearance from its ID + race.
// Same (agentId, race) pair always yields the same Appearance.
//
// If the engine race is unknown to the client, we fall back to DEFAULT_RACE
// for the *authored* mesh catalog while preserving the original race string
// for any UI that needs it.
export function deriveAppearance(agentId: string, race: string): Appearance {
  const requestedRace: RaceId = isKnownRace(race) ? race : DEFAULT_RACE;
  const authoredRace: RaceId = requestedRace;
  const cfg = RACE_CONFIGS[authoredRace];

  const rng = rngFor(agentId, 'appearance');

  const headIndex = rng.weightedIndex(cfg.headBias);
  const hairIndex = rng.weightedIndex(cfg.hairBias);
  const bodyShape: BodyShape = BODY_SHAPES[rng.weightedIndex(cfg.bodyBias)];
  const skinColor = cfg.skinPalette[rng.int(cfg.skinPalette.length)];
  const hairColor = cfg.hairPalette[rng.int(cfg.hairPalette.length)];
  const eyeColor = cfg.eyePalette[rng.int(cfg.eyePalette.length)];
  const heightScale = rng.range(cfg.heightRange[0], cfg.heightRange[1]);

  return {
    raceId: requestedRace,
    authoredRaceId: authoredRace,
    headIndex,
    hairIndex,
    hairColor,
    skinColor,
    eyeColor,
    bodyShape,
    heightScale,
  };
}
