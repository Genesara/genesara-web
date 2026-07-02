import { rngFor } from './prng';
import { RACE_CONFIGS } from './races';
import {
  BODY_SHAPES,
  DEFAULT_RACE,
  RACES,
  type Appearance,
  type Build,
  type BodyShape,
  type RaceId,
} from './types';

// Base build per body shape. Per-agent PRNG jitter is layered on top so two
// "heavy" agents still read as distinct people.
const BASE_BUILD: Record<BodyShape, Omit<Build, 'heads' | 'armSplay' | 'weightShift'>> = {
  lean:    { shoulderWidth: 0.94, torsoMass: 0.86, waist: 0.84, hipWidth: 0.92, limbThickness: 0.84, headWidth: 0.97, jaw: 0.7 },
  average: { shoulderWidth: 1.0,  torsoMass: 1.0,  waist: 1.0,  hipWidth: 1.0,  limbThickness: 1.0,  headWidth: 1.0,  jaw: 0.5 },
  heavy:   { shoulderWidth: 1.1,  torsoMass: 1.22, waist: 1.3,  hipWidth: 1.12, limbThickness: 1.22, headWidth: 1.04, jaw: 0.32 },
};

// ±jitter amounts applied as multipliers/offsets to the base build.
function deriveBuild(agentId: string, shape: BodyShape, headsRange: [number, number]): Build {
  const base = BASE_BUILD[shape];
  const r = rngFor(agentId, 'build');
  const j = (amt: number) => 1 + r.range(-amt, amt); // multiplicative jitter
  return {
    heads: r.range(headsRange[0], headsRange[1]),
    shoulderWidth: base.shoulderWidth * j(0.08),
    torsoMass: base.torsoMass * j(0.1),
    waist: base.waist * j(0.1),
    hipWidth: base.hipWidth * j(0.08),
    limbThickness: base.limbThickness * j(0.1),
    headWidth: base.headWidth * j(0.05),
    jaw: Math.min(1, Math.max(0, base.jaw + r.range(-0.18, 0.18))),
    armSplay: r.range(0.34, 0.5), // ~19–29° from vertical (clear A-pose)
    weightShift: r.range(-1, 1) * 0.06,
  };
}

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

  const gender = rng.int(2) === 0 ? ('male' as const) : ('female' as const);
  const headIndex = rng.weightedIndex(cfg.headBias);
  const hairIndex = rng.weightedIndex(cfg.hairBias);
  const bodyShape: BodyShape = BODY_SHAPES[rng.weightedIndex(cfg.bodyBias)];
  const skinColor = cfg.skinPalette[rng.int(cfg.skinPalette.length)];
  const hairColor = cfg.hairPalette[rng.int(cfg.hairPalette.length)];
  const eyeColor = cfg.eyePalette[rng.int(cfg.eyePalette.length)];
  const heightScale = rng.range(cfg.heightRange[0], cfg.heightRange[1]);
  const build = deriveBuild(agentId, bodyShape, cfg.headsRange);

  return {
    raceId: requestedRace,
    authoredRaceId: authoredRace,
    gender,
    headIndex,
    hairIndex,
    hairColor,
    skinColor,
    eyeColor,
    bodyShape,
    heightScale,
    build,
  };
}
