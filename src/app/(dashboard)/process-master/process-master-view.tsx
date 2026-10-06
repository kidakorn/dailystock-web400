'use client';

import { ArrowDown, ArrowUp, Download, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { HeaderPortal } from '@/components/layout/header-portal';
import { FilterBar } from '@/components/ui/filter-bar';
import ui from '@/components/ui/ui.module.css';
import {
  addProcessSeq,
  moveProcessSeq,
  parseProcessSeq,
  removeProcessSeq,
  updateProcessSeq,
} from '@/lib/process-seq-store';
import { param } from '@/lib/query';
import { useSearchRecord } from '@/lib/use-search-record';
import { resetProcessSeq, saveProcessSeq, useProcessSeq } from '@/lib/use-process-seq';
import type { ProcessSeqEntry } from '@/types/domain';
import styles from './process-master.module.css';

type Draft = { label: string; processCode: string; subProcessCode: string };
const emptyDraft: Draft = { label: '', processCode: '', subProcessCode: '' };

function draftFrom(entry: ProcessSeqEntry): Draft {
  return {
    label: entry.label,
    processCode: String(entry.processCode),
    subProcessCode: entry.subProcessCode,
  };
}

function entryFrom(draft: Draft): Omit<ProcessSeqEntry, 'seq'> {
  const processCode = Number(draft.processCode);
  if (!Number.isInteger(processCode)) throw new Error('Process code must be an integer');
  return {
    label: draft.label.trim(),
    processCode,
    subProcessCode: draft.subProcessCode.trim(),
  };
}

function downloadJson(entries: ProcessSeqEntry[]) {
  const blob = new Blob([`${JSON.stringify(entries, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'process-seq.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProcessMasterView({ defaultEntries }: { defaultEntries: ProcessSeqEntry[] }) {
  const entries = useProcessSeq(defaultEntries);
  const searchParams = useSearchRecord();
  const query = param(searchParams, 'q').trim().toLowerCase();
  const [newDraft, setNewDraft] = useState(emptyDraft);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  function commit(operation: () => ProcessSeqEntry[]) {
    try {
      saveProcessSeq(operation());
      setError('');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save process master');
      return false;
    }
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (commit(() => addProcessSeq(entries, entryFrom(newDraft)))) setNewDraft(emptyDraft);
  }

  function handleEdit(event: FormEvent<HTMLFormElement>, index: number) {
    event.preventDefault();
    if (commit(() => updateProcessSeq(entries, index, entryFrom(editDraft)))) setEditIndex(null);
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      const imported = parseProcessSeq(JSON.parse(await file.text()));
      saveProcessSeq(imported);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid process sequence JSON');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <section className={styles.page}>
      <FilterBar fields={[{ name: 'q', label: 'Process name', type: 'search' }]} />
      <HeaderPortal>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${ui.btn} ${styles.exportButton}`}
            onClick={() => downloadJson(entries)}
          >
            <Download size={16} aria-hidden="true" /> Export
          </button>
          <button
            type="button"
            className={`${ui.btn} ${styles.importButton}`}
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} aria-hidden="true" /> Import
          </button>
          <input
            ref={fileInput}
            className={styles.fileInput}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleImport(event.currentTarget.files?.[0])}
          />
          <button
            type="button"
            className={`${ui.btn} ${styles.resetButton}`}
            onClick={() => resetProcessSeq(defaultEntries)}
          >
            <RotateCcw size={16} aria-hidden="true" /> Reset
          </button>
        </div>
      </HeaderPortal>
      <fieldset className={styles.addForm}>
        <legend>Add process / sub-process</legend>
        <form onSubmit={handleAdd} aria-label="Add process">
          <label className={ui.field}>
            <span>Process code</span>
            <input
              required
              type="number"
              step="1"
              value={newDraft.processCode}
              onChange={(event) => setNewDraft({ ...newDraft, processCode: event.target.value })}
            />
          </label>
          <label className={`${ui.field} ${styles.labelField}`}>
            <span>Process / sub-process name</span>
            <input
              required
              value={newDraft.label}
              onChange={(event) => setNewDraft({ ...newDraft, label: event.target.value })}
            />
          </label>
          <label className={ui.field}>
            <span>Sub-process code</span>
            <input
              value={newDraft.subProcessCode}
              onChange={(event) => setNewDraft({ ...newDraft, subProcessCode: event.target.value })}
            />
          </label>
          <button type="submit" className={`${ui.btn} ${styles.addButton}`}>
            Add entry
          </button>
        </form>
      </fieldset>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={`${ui.card} ${styles.tableWrap}`}>
        <table className={ui.table} aria-label="Process sequence master">
          <thead>
            <tr>
              <th>Order</th>
              <th>Process code</th>
              <th>Process / sub-process name</th>
              <th>Sub-process code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              if (
                query &&
                !`${entry.processCode} ${entry.label} ${entry.subProcessCode}`
                  .toLowerCase()
                  .includes(query)
              )
                return null;
              return editIndex === index ? (
                <tr key={`${entry.processCode}|${entry.subProcessCode}`}>
                  <td>{entry.seq}</td>
                  <td>
                    <input
                      aria-label="Edit process code"
                      type="number"
                      step="1"
                      value={editDraft.processCode}
                      onChange={(event) =>
                        setEditDraft({ ...editDraft, processCode: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Edit process name"
                      value={editDraft.label}
                      onChange={(event) =>
                        setEditDraft({ ...editDraft, label: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label="Edit sub-process code"
                      value={editDraft.subProcessCode}
                      onChange={(event) =>
                        setEditDraft({ ...editDraft, subProcessCode: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <form
                      className={styles.rowActions}
                      onSubmit={(event) => handleEdit(event, index)}
                    >
                      <button type="submit" className={ui.btn}>
                        Save
                      </button>
                      <button type="button" className={ui.btn} onClick={() => setEditIndex(null)}>
                        Cancel
                      </button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={`${entry.processCode}|${entry.subProcessCode}`}>
                  <td className={ui.num}>{entry.seq}</td>
                  <td>{entry.processCode}</td>
                  <td>{entry.label}</td>
                  <td>{entry.subProcessCode || '—'}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={ui.btn}
                        aria-label={`Move ${entry.label} up`}
                        title="Move up"
                        disabled={index === 0}
                        onClick={() => commit(() => moveProcessSeq(entries, index, -1))}
                      >
                        <ArrowUp size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={ui.btn}
                        aria-label={`Move ${entry.label} down`}
                        title="Move down"
                        disabled={index === entries.length - 1}
                        onClick={() => commit(() => moveProcessSeq(entries, index, 1))}
                      >
                        <ArrowDown size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={ui.btn}
                        onClick={() => {
                          setEditIndex(index);
                          setEditDraft(draftFrom(entry));
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={ui.btn}
                        onClick={() => commit(() => removeProcessSeq(entries, index))}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
