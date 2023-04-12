// @ts-ignoreabove
import { setTimeout } from 'isomorphic-timers-promises';

import GuestList from '../types/guest-list';
import annealStep from './annealing';
import { DEFAULT_MODE, DEFAULT_TABLE_SIZE, config, DEFAULT_MAX_TEMPERATURE } from './constants';

const createStepper = (tableSize: number, maxTemperature: number, mode: string) => (list: GuestList, currentTemperature: number) => {
  return annealStep(list, tableSize, currentTemperature, maxTemperature, mode);
}

const isFrozen = (t: number) => t < 1;

const queueNextBatch = (list: GuestList, t: number, props: any, delay: number | void) => (

  setTimeout(() => {
    batch(list, t, props)
  }), delay);

const batch = (list: GuestList, startT: number, props: any) => {
  if (isFrozen(startT)) {
    props.relay.finish(list.guests);
    return;
  }
  const batchEnd = Math.max(startT - props.config.size, 0);
  for (let t = startT; t > batchEnd; t--) {
    list = props.stepper(list, t);
  }


  props.count += 1;

  const rate = props.config.rate;
  const throttled = (props.count % rate);
  if (!throttled) {
    const ratio = (props.maxTemperature - batchEnd) / props.maxTemperature;

    // Post the updated lists
    props.relay.update(list.guests, ratio);
  }

  const nextDelay = throttled ? props.delay : props.updateDelay;

  queueNextBatch(list, batchEnd, props, nextDelay);

}

export interface UpdateRelay {
  start(): void;
  update(): void;
  finish(): void;
}

const makeProps = (relay: UpdateRelay, stepper: any, maxTemperature: number, batchConfig: any = config) => ({
  relay,
  stepper,
  maxTemperature,
  config: batchConfig,
  count: 0,
});



export interface OptimizationConfig {
  maxTemperature?: number;
  tableSize?: number;
  mode?: string;
}


export const createOptimizationRun = (
  GuestList: GuestList,
  relay: UpdateRelay,
  { maxTemperature = DEFAULT_MAX_TEMPERATURE, tableSize = DEFAULT_TABLE_SIZE, mode = DEFAULT_MODE }: OptimizationConfig) => {

  // Signal the start of a new optimization run
  relay.start();

  const stepper = createStepper(tableSize, maxTemperature, mode);
  const props = makeProps(relay, stepper, maxTemperature);

  batch(GuestList, maxTemperature, props);

}

const optimizer = {
  run: createOptimizationRun,
};

export default optimizer;
