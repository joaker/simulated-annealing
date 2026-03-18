import { describe, it, expect, vi, afterEach } from 'vitest';
import { metropolisAcceptance } from '../src/acceptance';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('metropolisAcceptance', () => {
  it('always accepts improvements (energyDelta < 0)', () => {
    expect(metropolisAcceptance(-1, 100)).toBe(true);
    expect(metropolisAcceptance(-100, 0)).toBe(true);
  });

  it('always rejects when temperature is 0 and energyDelta >= 0', () => {
    expect(metropolisAcceptance(1, 0)).toBe(false);
    expect(metropolisAcceptance(100, 0)).toBe(false);
  });

  it('accepts energyDelta=0 with prob 1 (exp(0)=1)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(metropolisAcceptance(0, 100)).toBe(true);
  });

  it('accepts uphill moves probabilistically based on Boltzmann', () => {
    // P = exp(-delta/T) = exp(-1/1) ≈ 0.368
    vi.spyOn(Math, 'random').mockReturnValue(0.3); // below threshold → accept
    expect(metropolisAcceptance(1, 1)).toBe(true);

    vi.spyOn(Math, 'random').mockReturnValue(0.5); // above threshold → reject
    expect(metropolisAcceptance(1, 1)).toBe(false);
  });

  it('rejects large uphill moves at low temperature', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    // exp(-1000/0.001) ≈ 0
    expect(metropolisAcceptance(1000, 0.001)).toBe(false);
  });
});
