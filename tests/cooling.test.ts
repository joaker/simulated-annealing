import { describe, it, expect } from 'vitest';
import { linearCooling, geometricCooling, logarithmicCooling } from '../src/cooling';

describe('linearCooling', () => {
  it('decreases temperature by rate each step', () => {
    const cool = linearCooling(1);
    expect(cool(100, 0)).toBe(99);
    expect(cool(99, 1)).toBe(98);
  });

  it('uses default rate of 1', () => {
    const cool = linearCooling();
    expect(cool(50, 0)).toBe(49);
  });

  it('respects custom rate', () => {
    const cool = linearCooling(5);
    expect(cool(100, 0)).toBe(95);
  });
});

describe('geometricCooling', () => {
  it('multiplies temperature by alpha each step', () => {
    const cool = geometricCooling(0.9);
    expect(cool(100, 0)).toBeCloseTo(90);
  });

  it('uses default alpha of 0.99', () => {
    const cool = geometricCooling();
    expect(cool(100, 0)).toBeCloseTo(99);
  });

  it('approaches zero over many steps', () => {
    const cool = geometricCooling(0.5);
    let temp = 1024;
    for (let i = 0; i < 10; i++) temp = cool(temp, i);
    expect(temp).toBeCloseTo(1);
  });
});

describe('logarithmicCooling', () => {
  it('returns c / log(1 + step)', () => {
    const cool = logarithmicCooling(1);
    expect(cool(999, 1)).toBeCloseTo(1 / Math.log(2));
    expect(cool(999, 2)).toBeCloseTo(1 / Math.log(3));
  });

  it('uses default c of 1', () => {
    const cool = logarithmicCooling();
    expect(cool(999, 1)).toBeCloseTo(1 / Math.log(2));
  });

  it('returns Infinity at step 0 (log singularity — expected)', () => {
    const cool = logarithmicCooling(1);
    expect(cool(999, 0)).toBe(Infinity);
  });
});
