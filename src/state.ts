import { type LoanInputs } from './engine/loan';
import { statusFor, type InputStatus } from './engine/validate';

export type Listener = (inputs: LoanInputs, status: InputStatus) => void;

export interface Store {
  get(): LoanInputs;
  set(patch: Partial<LoanInputs>): void;
  subscribe(fn: Listener): void;
}

export function initState(initial: LoanInputs): Store {
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
