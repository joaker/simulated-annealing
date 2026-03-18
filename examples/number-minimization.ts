/**
 * Example: Find the integer closest to zero using simulated annealing.
 *
 * Run with: npx ts-node --esm examples/number-minimization.ts
 */

import { anneal, annealIterator, annealAsync, linearCooling, geometricCooling } from '../src/index';
import type { NeighborFn } from '../src/index';

// State is just a number. Energy = distance from 0.
const neighbor: NeighborFn<number> = (state) => {
  const delta = Math.random() < 0.5 ? -1 : 1;
  const nextState = state + delta;
  const energyDelta = Math.abs(nextState) - Math.abs(state);
  return { nextState, energyDelta };
};

const initialState = 100;
const initialEnergy = Math.abs(initialState);

console.log('=== Synchronous anneal ===');
const result = anneal(initialState, initialEnergy, {
  initialTemperature: 200,
  coolingSchedule: linearCooling(1),
  neighbor,
  maxSteps: 300,
});
console.log(`Best state: ${result.bestState}, best energy: ${result.bestEnergy}`);

console.log('\n=== Iterator (first 5 snapshots) ===');
let count = 0;
for (const snap of annealIterator(initialState, initialEnergy, {
  initialTemperature: 200,
  coolingSchedule: geometricCooling(0.95),
  neighbor,
  maxSteps: 500,
})) {
  if (count++ < 5) {
    console.log(`  step=${snap.step} state=${snap.state} temp=${snap.temperature.toFixed(2)}`);
  } else {
    break;
  }
}

console.log('\n=== Async anneal ===');
annealAsync(
  initialState,
  initialEnergy,
  {
    initialTemperature: 200,
    coolingSchedule: linearCooling(1),
    neighbor,
    maxSteps: 300,
  },
  {
    batchSize: 50,
    onProgress: (snap) => {
      process.stdout.write(`  progress: step=${snap.step} temp=${snap.temperature.toFixed(1)}\r`);
    },
  },
).then((snap) => {
  console.log(`\nDone. Best state: ${snap.bestState}, best energy: ${snap.bestEnergy}`);
});
