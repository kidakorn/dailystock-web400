'use client';
import { useSyncExternalStore } from 'react';

/*
 * A tiny shared store: any component can start a "loading" job and the overlay in the
 * layout reacts, without wrapping the whole app in a context provider. A counter (not a
 * boolean) means overlapping jobs keep the overlay up until the last one finishes.
 */
let count = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Starts a job and returns its stop function (safe to call more than once). */
export function beginLoading(): () => void {
  count += 1;
  emit();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    count -= 1;
    emit();
  };
}

export const isLoading = (): boolean => count > 0;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// The server snapshot is false: nothing is loading during server rendering.
export const useIsLoading = (): boolean => useSyncExternalStore(subscribe, isLoading, () => false);
