# simulated-annealing

[![npm version](https://img.shields.io/npm/v/simulated-annealing.svg)](https://www.npmjs.com/package/simulated-annealing)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/your-org/simulated-annealing/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/simulated-annealing/actions/workflows/ci.yml)

Simulated annealing is a probabilistic optimization technique inspired by the annealing process in metallurgy. Starting from an initial solution, the algorithm explores the search space by accepting neighboring solutions. Improvements are always accepted; worsening moves are accepted with a probability that decreases as the "temperature" cools — allowing the search to escape local optima early on while converging to a good solution as the run progresses. This library provides a generic, fully typed TypeScript implementation with three execution modes (synchronous, iterator, and async), pluggable cooling schedules, and a customizable acceptance criterion.

---

## Install

```
npm install simulated-annealing
```

Works in Node.js >=16. Ships both CommonJS (`require`) and ESM (`import`) builds with full TypeScript declaration files.

---

## Quick start

```typescript
import { anneal, geometricCooling } from 'simulated-annealing';
import type { NeighborFn } from 'simulated-annealing';

// Minimize a number toward zero
const neighbor: NeighborFn<number> = (state) => {
  const nextState = state + (Math.random() < 0.5 ? -1 : 1);
  return {
    nextState,
    energyDelta: Math.abs(nextState) - Math.abs(state),
  };
};

const result = anneal(100, 100, {
  initialTemperature: 200,
  coolingSchedule: geometricCooling(0.99),
  neighbor,
  maxSteps: 5_000,
});

console.log(result.bestState);  // close to 0
console.log(result.bestEnergy); // close to 0
```

---

## Execution modes

The library exposes three execution modes. Choose based on whether you need blocking execution, step-by-step control, or non-blocking operation in a UI context.

### `anneal` — synchronous, blocking

Runs the entire search to completion and returns a final snapshot. Best for scripts, CLIs, and server-side batch jobs where blocking is acceptable.

```typescript
import { anneal, linearCooling } from 'simulated-annealing';

const result = anneal(initialState, initialEnergy, {
  initialTemperature: 1000,
  coolingSchedule: linearCooling(0.5),
  neighbor,
  maxSteps: 10_000,
});

console.log(`Best energy: ${result.bestEnergy}`);
```

### `annealIterator` — generator, step-by-step

Returns a `Generator` that yields one `AnnealSnapshot` per step. Gives you full control: inspect intermediate state, break early, or pipe into any iterable consumer.

```typescript
import { annealIterator, geometricCooling } from 'simulated-annealing';

const iter = annealIterator(initialState, initialEnergy, {
  initialTemperature: 1000,
  coolingSchedule: geometricCooling(0.995),
  neighbor,
});

for (const snap of iter) {
  if (snap.step % 1000 === 0) {
    console.log(`step=${snap.step} temp=${snap.temperature.toFixed(2)} best=${snap.bestEnergy.toFixed(4)}`);
  }
  if (snap.bestEnergy < 0.01) break; // converged early
}
```

### `annealAsync` — promise-based, non-blocking

Runs the search in batches separated by `setTimeout(fn, 0)`, yielding control to the event loop between batches. Ideal for browser UIs or Node servers where you don't want to block the main thread. The `batchSize` parameter controls the temperature range processed per batch tick.

```typescript
import { annealAsync, geometricCooling } from 'simulated-annealing';

const result = await annealAsync(
  initialState,
  initialEnergy,
  {
    initialTemperature: 1000,
    coolingSchedule: geometricCooling(0.99),
    neighbor,
    maxSteps: 50_000,
  },
  {
    batchSize: 10,         // temperature units processed per tick
    onProgress: (snap) => {
      updateProgressBar(snap.step, snap.temperature);
    },
  },
);

console.log(`Done: best energy = ${result.bestEnergy}`);
```

---

## Cooling schedules

A cooling schedule is a function `(temperature, step) => number` that reduces the temperature over time. The rate of cooling determines the tradeoff between solution quality and run time: cooling too fast traps the search in local optima; cooling too slowly wastes computation.

### `linearCooling(rate = 1)`

```
T(n+1) = T(n) - rate
```

Reduces temperature by a fixed amount each step. Simple and predictable. The search terminates when `T <= 0`.

```typescript
import { linearCooling } from 'simulated-annealing';

const schedule = linearCooling(0.5); // subtract 0.5 each step
```

**When to use:** Problems where you know roughly how many steps to budget, or when you want a guaranteed termination time.

### `geometricCooling(alpha = 0.99)`

```
T(n+1) = T(n) * alpha
```

Multiplies temperature by a factor between 0 and 1 each step. Temperature decays exponentially. This is the most widely used schedule in practice.

```typescript
import { geometricCooling } from 'simulated-annealing';

const schedule = geometricCooling(0.995); // slow cooling, higher quality
const schedule2 = geometricCooling(0.9);  // fast cooling, fewer steps
```

**When to use:** General-purpose optimization. Start with `alpha = 0.99` and tune from there. Values between 0.99 and 0.999 are typical for large search spaces.

### `logarithmicCooling(c = 1)`

```
T(n) = c / ln(1 + step)
```

The theoretically optimal schedule — guaranteed to find the global optimum given sufficient time under certain conditions. In practice it cools so slowly that it is rarely used directly without a very large step budget.

```typescript
import { logarithmicCooling } from 'simulated-annealing';

const schedule = logarithmicCooling(100); // c controls the starting plateau
```

**When to use:** Theoretical benchmarking, or when you have a very large step budget and correctness guarantees matter more than speed.

**Note on step-0 singularity:** `logarithmicCooling` returns `Infinity` at step 0 because `ln(1 + 0) = 0`. This is expected behavior: the anneal loop starts at `step = 0` and immediately calls `coolingSchedule(temperature, step)` *after* processing the first transition, so step 0 produces the first updated temperature. Because `Infinity > 0`, the loop continues normally. If you use `logarithmicCooling` you should always set `maxSteps` to guarantee termination.

---

## API reference

### Types

```typescript
interface Transition<S> {
  nextState: S;
  energyDelta: number;   // positive = worse, negative = better
}

type NeighborFn<S> = (state: S, temperature: number) => Transition<S> | null;
// Return null to indicate no move is possible from the current state.

type AcceptanceFn = (energyDelta: number, temperature: number) => boolean;

type CoolingSchedule = (temperature: number, step: number) => number;

interface AnnealConfig<S> {
  initialTemperature: number;
  coolingSchedule: CoolingSchedule;
  neighbor: NeighborFn<S>;
  acceptance?: AcceptanceFn;  // defaults to metropolisAcceptance
  maxSteps?: number;          // omit to rely solely on temperature reaching 0
}

interface AnnealSnapshot<S> {
  state: S;         // current state at this step
  energy: number;   // current energy (may be higher than bestEnergy)
  temperature: number;
  step: number;
  bestState: S;     // lowest-energy state seen so far
  bestEnergy: number;
}

interface BatchConfig<S> {
  batchSize: number;                           // temperature delta per event-loop tick
  onProgress: (snapshot: AnnealSnapshot<S>) => void;
}
```

### Functions

#### `anneal<S>(initialState, initialEnergy, config): AnnealSnapshot<S>`

Runs the full annealing search synchronously and returns the final snapshot.

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `S` | Starting state |
| `initialEnergy` | `number` | Energy of the initial state |
| `config` | `AnnealConfig<S>` | Cooling schedule, neighbor function, and options |

Returns the snapshot at termination. `bestState`/`bestEnergy` hold the overall best seen across all steps — not necessarily the final state.

#### `annealIterator<S>(initialState, initialEnergy, config): Generator<AnnealSnapshot<S>>`

Returns a generator that yields one snapshot per step. Terminates when temperature reaches 0 or `maxSteps` is reached.

```typescript
const gen = annealIterator(start, energy, config);
const { value: firstSnap } = gen.next();
```

Calling `gen.return()` or using `break` in a `for...of` loop safely terminates the generator.

#### `annealAsync<S>(initialState, initialEnergy, config, batchConfig): Promise<AnnealSnapshot<S>>`

Runs the annealing search non-blockingly. Each batch processes steps until the temperature drops by `batchConfig.batchSize`, then schedules the next batch via `setTimeout(fn, 0)`. `onProgress` is called after each batch.

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `S` | Starting state |
| `initialEnergy` | `number` | Energy of the initial state |
| `config` | `AnnealConfig<S>` | Same as `anneal` |
| `batchConfig` | `BatchConfig<S>` | Batch size and progress callback |

The promise resolves with the final `AnnealSnapshot` when temperature reaches 0 or `maxSteps` is hit.

#### `metropolisAcceptance(energyDelta, temperature): boolean`

The default acceptance function. Implements the Metropolis criterion:
- Always accepts improvements (`energyDelta < 0`).
- Always rejects worsening moves when `temperature <= 0`.
- Accepts worsening moves with probability `exp(-energyDelta / temperature)`.

You can supply your own `AcceptanceFn` in `AnnealConfig.acceptance` to override this.

#### `linearCooling(rate?: number): CoolingSchedule`

Returns a cooling schedule that subtracts `rate` from the temperature each step. Default `rate = 1`.

#### `geometricCooling(alpha?: number): CoolingSchedule`

Returns a cooling schedule that multiplies the temperature by `alpha` each step. Default `alpha = 0.99`. Must satisfy `0 < alpha < 1`.

#### `logarithmicCooling(c?: number): CoolingSchedule`

Returns a cooling schedule `T = c / ln(1 + step)`. Default `c = 1`. Returns `Infinity` at step 0 (see note above). Always pair with `maxSteps`.

---

## TSP example

The classic Travelling Salesman Problem solved with 2-opt neighborhood moves. The full implementation is in [`examples/tsp.ts`](./examples/tsp.ts).

```typescript
import { anneal, geometricCooling } from 'simulated-annealing';
import type { NeighborFn } from 'simulated-annealing';

type Route = number[];

// Neighbor: random 2-opt swap between positions i and j
const neighbor: NeighborFn<Route> = (route) => {
  const i = Math.floor(Math.random() * (route.length - 1));
  const j = i + 1 + Math.floor(Math.random() * (route.length - 1 - i));
  const nextRoute = twoOptSwap(route, i, j);
  return {
    nextState: nextRoute,
    energyDelta: routeLength(nextRoute) - routeLength(route),
  };
};

const result = anneal(initialRoute, initialEnergy, {
  initialTemperature: 1000,
  coolingSchedule: geometricCooling(0.995),
  neighbor,
  maxSteps: 50_000,
});

console.log(`Improvement: ${improvement}%`);
```

---

## License

MIT — see [LICENSE](./LICENSE).
