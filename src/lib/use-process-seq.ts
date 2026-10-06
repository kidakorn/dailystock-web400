'use client';

import { useSyncExternalStore } from 'react';
import type { ProcessSeqEntry } from '@/types/domain';
import { parseProcessSeq } from './process-seq-store';

const STORAGE_KEY = 'daily-stock-process-seq-v1';
let snapshot: ProcessSeqEntry[] | undefined;
const listeners = new Set<() => void>();

function getSnapshot(fallback: ProcessSeqEntry[]): ProcessSeqEntry[] {
  if (snapshot) return snapshot;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    snapshot = stored ? parseProcessSeq(JSON.parse(stored)) : fallback;
  } catch {
    snapshot = fallback;
  }
  return snapshot;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    try {
      snapshot = event.newValue ? parseProcessSeq(JSON.parse(event.newValue)) : undefined;
    } catch {
      snapshot = undefined;
    }
    notify();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function saveProcessSeq(entries: ProcessSeqEntry[]) {
  snapshot = parseProcessSeq(entries);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  notify();
}

export function resetProcessSeq(entries: ProcessSeqEntry[]) {
  snapshot = parseProcessSeq(entries);
  localStorage.removeItem(STORAGE_KEY);
  notify();
}

export function useProcessSeq(defaultEntries: ProcessSeqEntry[]) {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(defaultEntries),
    () => defaultEntries,
  );
}