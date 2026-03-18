import { describe, it, expect, vi } from 'vitest';
import { anneal } from '../src/anneal';
import { annealIterator } from '../src/anneal-iterator';
import { annealAsync } from '../src/anneal-async';
import { linearCooling } from '../src/cooling';
import type { AnnealConfig } from '../src/types';

// Deterministic acceptance: always accept improvements, never accept worsening
const greedyAcceptance = (delta: number) => delta < 0;

// Neighbor: move integer one step closer to 0
function towardZeroNeighbor(state: number) {
  if (state === 0) return null;
  const nextState = state > 0 ? state - 1 : state + 1;
  return { nextState, energyDelta: -1 }; // always an improvement
}

const baseConfig: AnnealConfig<number> = {
  initialTemperature: 100,
  coolingSchedule: linearCooling(1),
  neighbor: towardZeroNeighbor,
  acceptance: greedyAcceptance,
};

describe('anneal', () => {
  it('minimizes toward zero from a positive start', () => {
    const result = anneal(50, 50, { ...baseConfig, maxSteps: 60 });
    expect(result.bestEnergy).toBeLessThan(50);
    expect(result.bestState).toBeLessThan(50);
  });

  it('respects maxSteps', () => {
    const result = anneal(1000, 1000, { ...baseConfig, maxSteps: 10 });
    expect(result.step).toBe(10);
  });

  it('tracks bestState and bestEnergy across all steps', () => {
    const result = anneal(10, 10, { ...baseConfig, maxSteps: 100 });
    expect(result.bestEnergy).toBeLessThanOrEqual(result.energy);
  });

  it('terminates when temperature reaches 0', () => {
    const result = anneal(50, 50, {
      ...baseConfig,
      initialTemperature: 5,
      maxSteps: undefined,
    });
    expect(result.temperature).toBeLessThanOrEqual(0);
  });

  it('returns a snapshot with all required fields', () => {
    const result = anneal(1, 1, { ...baseConfig, maxSteps: 1 });
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('energy');
    expect(result).toHaveProperty('temperature');
    expect(result).toHaveProperty('step');
    expect(result).toHaveProperty('bestState');
    expect(result).toHaveProperty('bestEnergy');
  });
});

describe('annealIterator', () => {
  it('yields a snapshot at each step', () => {
    const iter = annealIterator(5, 5, { ...baseConfig, maxSteps: 3 });
    const snapshots = [...iter];
    expect(snapshots).toHaveLength(3);
  });

  it('increments step count on each yield', () => {
    const iter = annealIterator(5, 5, { ...baseConfig, maxSteps: 3 });
    let prev = 0;
    for (const snap of iter) {
      expect(snap.step).toBe(prev + 1);
      prev = snap.step;
    }
  });

  it('can be broken early', () => {
    const iter = annealIterator(100, 100, { ...baseConfig, maxSteps: 100 });
    let count = 0;
    for (const _ of iter) {
      count++;
      if (count === 5) break;
    }
    expect(count).toBe(5);
  });

  it('tracks bestState throughout iteration', () => {
    const iter = annealIterator(10, 10, { ...baseConfig, maxSteps: 10 });
    for (const snap of iter) {
      expect(snap.bestEnergy).toBeLessThanOrEqual(snap.energy + 0.001);
    }
  });
});

describe('annealAsync', () => {
  it('resolves with a final snapshot', async () => {
    const result = await annealAsync(
      10,
      10,
      { ...baseConfig, maxSteps: 5 },
      { batchSize: 100, onProgress: () => {} },
    );
    expect(result).toHaveProperty('bestState');
    expect(result.step).toBe(5);
  });

  it('calls onProgress at least once', async () => {
    const onProgress = vi.fn();
    await annealAsync(
      10,
      10,
      { ...baseConfig, maxSteps: 5 },
      { batchSize: 100, onProgress },
    );
    expect(onProgress).toHaveBeenCalled();
  });

  it('resolves when temperature reaches 0', async () => {
    const result = await annealAsync(
      5,
      5,
      { ...baseConfig, initialTemperature: 3, maxSteps: undefined },
      { batchSize: 100, onProgress: () => {} },
    );
    expect(result.temperature).toBeLessThanOrEqual(0);
  });
});
