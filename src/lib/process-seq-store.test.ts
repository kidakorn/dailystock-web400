import { describe, expect, it } from 'vitest';
import {
  addProcessSeq,
  moveProcessSeq,
  parseProcessSeq,
  removeProcessSeq,
  updateProcessSeq,
} from './process-seq-store';

const entries = [
  { seq: 1, label: 'DICING', processCode: 100, subProcessCode: '' },
  { seq: 2, label: 'DIE BOND', processCode: 101, subProcessCode: '' },
];

describe('process sequence master', () => {
  it('normalizes order after adding, moving, and deleting entries', () => {
    const added = addProcessSeq(entries, {
      label: 'POST CURE',
      processCode: 112,
      subProcessCode: '',
    });
    const moved = moveProcessSeq(added, 2, -1);
    const removed = removeProcessSeq(moved, 0);
    expect(removed.map(({ seq, processCode }) => [seq, processCode])).toEqual([
      [1, 112],
      [2, 101],
    ]);
  });

  it('updates an entry and rejects duplicate process/sub-process pairs', () => {
    expect(updateProcessSeq(entries, 0, {
      label: 'WAFER CUT',
      processCode: 50,
      subProcessCode: '',
    })[0]?.label).toBe('WAFER CUT');
    expect(() => addProcessSeq(entries, {
      label: 'Duplicate',
      processCode: 100,
      subProcessCode: '',
    })).toThrow('Duplicate process and sub-process');
  });

  it('parses JSON entries in sequence order and rejects invalid data', () => {
    expect(parseProcessSeq([...entries].reverse()).map((entry) => entry.processCode)).toEqual([
      100,
      101,
    ]);
    expect(() => parseProcessSeq([{ seq: 1, label: '', processCode: 1, subProcessCode: '' }])).toThrow();
  });
});