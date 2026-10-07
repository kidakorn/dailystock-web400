'use client';

import { ArrowDown, ArrowUp, Download, Plus, RotateCcw, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
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

type Draft = {
  processCode: string;
  processName: string;
  subProcessCode: string;
  subProcessName: string;
};
const emptyDraft: Draft = {
  processCode: '',
  processName: '',
  subProcessCode: '',
  subProcessName: '',
};

function processNameOf(entry: ProcessSeqEntry, entries: ProcessSeqEntry[]) {
  const parent = entries.find(
    (candidate) => candidate.processCode === entry.processCode && !candidate.subProcessCode,
  );
  return entry.processName || parent?.processName || parent?.label || (!entry.subProcessCode ? entry.label : '');
}

function subProcessNameOf(entry: ProcessSeqEntry) {
  return entry.subProcessName || (entry.subProcessCode ? entry.label : '');
}

function draftFrom(entry: ProcessSeqEntry, entries: ProcessSeqEntry[]): Draft {
  return {
    processCode: String(entry.processCode),
    processName: processNameOf(entry, entries),
    subProcessCode: entry.subProcessCode,
    subProcessName: subProcessNameOf(entry),
  };
}

function entryFrom(draft: Draft): Omit<ProcessSeqEntry, 'seq'> {
  const processCode = Number(draft.processCode);
  if (!Number.isInteger(processCode)) throw new Error('Process code must be an integer');
  const processName = draft.processName.trim();
  const subProcessCode = draft.subProcessCode.trim();
  const subProcessName = draft.subProcessName.trim();
  if (!processName) throw new Error('Process name is required');
  if (Boolean(subProcessCode) !== Boolean(subProcessName)) {
    throw new Error('Sub-process code and name are both required');
  }
  return {
    label: subProcessCode ? subProcessName : processName,
    processCode,
    processName,
    subProcessCode,
    subProcessName,
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const addDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = addDialog.current;
    if (!dialog) return;
    if (isAddOpen && !dialog.open) dialog.showModal();
    if (!isAddOpen && dialog.open) dialog.close();
  }, [isAddOpen]);

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
    if (commit(() => addProcessSeq(entries, entryFrom(newDraft)))) {
      setNewDraft(emptyDraft);
      setIsAddOpen(false);
    }
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
        <div className={styles.headerActions} data-process-master-actions>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnInfo}`}
            onClick={() => downloadJson(entries)}
          >
            <Download size={16} aria-hidden="true" /> Export
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSuccess}`}
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
            className={`${ui.btn} ${ui.btnWarning}`}
            onClick={() => resetProcessSeq(defaultEntries)}
          >
            <RotateCcw size={16} aria-hidden="true" /> Reset
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={() => {
              setError('');
              setIsAddOpen(true);
            }}
          >
            <Plus size={16} aria-hidden="true" /> Add process
          </button>
        </div>
      </HeaderPortal>
      <dialog
        ref={addDialog}
        className={styles.addDialog}
        aria-labelledby="add-process-title"
        onClose={() => setIsAddOpen(false)}
      >
        <div className={styles.dialogHeader}>
          <h2 id="add-process-title">Add process / sub-process</h2>
          <button
            type="button"
            className={`${ui.btn} ${styles.closeDialog}`}
            aria-label="Close dialog"
            onClick={() => setIsAddOpen(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleAdd} aria-label="Add process">
          <div className={styles.dialogFields}>
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
          <label className={ui.field}>
            <span>Process name</span>
            <input
              required
              value={newDraft.processName}
              onChange={(event) => setNewDraft({ ...newDraft, processName: event.target.value })}
            />
          </label>
          <label className={ui.field}>
            <span>Sub-process code</span>
            <input
              value={newDraft.subProcessCode}
              onChange={(event) => setNewDraft({ ...newDraft, subProcessCode: event.target.value })}
            />
          </label>
          <label className={ui.field}>
            <span>Sub-process name</span>
            <input
              value={newDraft.subProcessName}
              onChange={(event) => setNewDraft({ ...newDraft, subProcessName: event.target.value })}
            />
          </label>
          </div>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.dialogActions}>
            <button type="button" className={ui.btn} onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`}>
              Add entry
            </button>
          </div>
        </form>
      </dialog>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.tableWrap}>
        <table className={ui.table} aria-label="Process sequence master">
          <thead>
            <tr>
              <th>Order</th>
              <th>Process code</th>
              <th>Process name</th>
              <th>Sub-process code</th>
              <th>Sub-process name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              if (
                query &&
                !`${entry.processCode} ${processNameOf(entry, entries)} ${entry.subProcessCode} ${subProcessNameOf(entry)}`
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
                      value={editDraft.processName}
                      onChange={(event) =>
                        setEditDraft({ ...editDraft, processName: event.target.value })
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
                    <input
                      aria-label="Edit sub-process name"
                      value={editDraft.subProcessName}
                      onChange={(event) =>
                        setEditDraft({ ...editDraft, subProcessName: event.target.value })
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
                  <td>{processNameOf(entry, entries) || '—'}</td>
                  <td>{entry.subProcessCode || '—'}</td>
                  <td>{subProcessNameOf(entry) || '—'}</td>
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
                          setEditDraft(draftFrom(entry, entries));
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
