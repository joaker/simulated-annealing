/**
 * Example: Travelling Salesman Problem using simulated annealing.
 *
 * Finds a short route through N random cities using 2-opt swaps.
 * Run with: npx ts-node --esm examples/tsp.ts
 */

import { anneal, geometricCooling } from '../src/index';
import type { NeighborFn } from '../src/index';

type City = { x: number; y: number };
type Route = number[]; // indices into cities array

function distance(a: City, b: City): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function routeLength(route: Route, cities: City[]): number {
  let total = 0;
  for (let i = 0; i < route.length; i++) {
    total += distance(cities[route[i]], cities[route[(i + 1) % route.length]]);
  }
  return total;
}

// 2-opt swap: reverse the segment between indices i and j
function twoOptSwap(route: Route, i: number, j: number): Route {
  const next = [...route];
  let left = i;
  let right = j;
  while (left < right) {
    [next[left], next[right]] = [next[right], next[left]];
    left++;
    right--;
  }
  return next;
}

// Generate random cities
const NUM_CITIES = 20;
const cities: City[] = Array.from({ length: NUM_CITIES }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
}));

// Initial route: visit cities in order
const initialRoute: Route = Array.from({ length: NUM_CITIES }, (_, i) => i);
const initialEnergy = routeLength(initialRoute, cities);

// Neighbor: random 2-opt swap
const neighbor: NeighborFn<Route> = (route) => {
  const i = Math.floor(Math.random() * (route.length - 1));
  const j = i + 1 + Math.floor(Math.random() * (route.length - 1 - i));
  const nextRoute = twoOptSwap(route, i, j);
  const energyDelta = routeLength(nextRoute, cities) - routeLength(route, cities);
  return { nextState: nextRoute, energyDelta };
};

console.log(`Cities: ${NUM_CITIES}`);
console.log(`Initial route length: ${initialEnergy.toFixed(2)}`);

const result = anneal(initialRoute, initialEnergy, {
  initialTemperature: 1000,
  coolingSchedule: geometricCooling(0.995),
  neighbor,
  maxSteps: 50_000,
});

console.log(`Best route length: ${result.bestEnergy.toFixed(2)}`);
console.log(`Improvement: ${(((initialEnergy - result.bestEnergy) / initialEnergy) * 100).toFixed(1)}%`);
console.log(`Steps: ${result.step}`);
