import { type AppInputs } from '@rlc/engine';
import { statusFor, type InputStatus } from '@rlc/engine';

export type Listener = (inputs: AppInputs, status: InputStatus) => void;

export interface Store {
  get(): AppInputs;
  set(patch: Partial<AppInputs>): void;
  subscribe(fn: Listener): void;
}

export function initState(initial: AppInputs): Store {
  let inputs = { ...initial };
  const listeners: Listener[] = [];

  const notify = () => {
    const status = statusFor(inputs);
    for (const fn of listeners) fn(inputs, status);
  };

  return {
    get: () => inputs,
    set(patch) {
      inputs = { ...inputs, ...patch };
      notify();
    },
    subscribe(fn) {
      listeners.push(fn);
      fn(inputs, statusFor(inputs));
    },
  };
}
