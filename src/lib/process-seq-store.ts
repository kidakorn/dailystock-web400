import { processSeqSchema } from '@/lib/data/schemas';
import type { ProcessSeqEntry } from '@/types/domain';

export function normalizeProcessSeq(entries: readonly ProcessSeqEntry[]): ProcessSeqEntry[] {
  return entries.map((entry, index) => ({ ...entry, seq: index + 1 }));
}

export function parseProcessSeq(value: unknown): ProcessSeqEntry[] {
  const parsed = processSeqSchema.array().parse(value).sort((a, b) => a.seq - b.seq);
  const keys = new Set<string>();
  for (const entry of parsed) {
    if (!entry.label.trim()) throw new Error('Process label is required');
    const key = `${entry.processCode}|${entry.subProcessCode}`;
    if (keys.has(key)) throw new Error(`Duplicate process and sub-process: ${key}`);
    keys.add(key);
  }
  return normalizeProcessSeq(parsed);
}

export function addProcessSeq(
  entries: readonly ProcessSeqEntry[],
  entry: Omit<ProcessSeqEntry, 'seq'>,
): ProcessSeqEntry[] {
  return parseProcessSeq([...normalizeProcessSeq(entries), { ...entry, seq: entries.length + 1 }]);
}

export function updateProcessSeq(
  entries: readonly ProcessSeqEntry[],
  index: number,
  entry: Omit<ProcessSeqEntry, 'seq'>,
): ProcessSeqEntry[] {
  if (index < 0 || index >= entries.length) throw new Error('Process sequence entry not found');
  return parseProcessSeq(
    normalizeProcessSeq(entries).map((current, currentIndex) =>
      currentIndex === index ? { ...entry, seq: current.seq } : current,
    ),
  );
}

export function removeProcessSeq(
  entries: readonly ProcessSeqEntry[],
  index: number,
): ProcessSeqEntry[] {
  if (index < 0 || index >= entries.length) throw new Error('Process sequence entry not found');
  return normalizeProcessSeq(entries.filter((_, currentIndex) => currentIndex !== index));
}

export function moveProcessSeq(
  entries: readonly ProcessSeqEntry[],
  index: number,
  offset: -1 | 1,
): ProcessSeqEntry[] {
  const target = index + offset;
  if (index < 0 || index >= entries.length || target < 0 || target >= entries.length) {
    return normalizeProcessSeq(entries);
  }
  const next = [...entries];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return normalizeProcessSeq(next);
}