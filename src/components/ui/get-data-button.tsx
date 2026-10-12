'use client';

import { RotateCw } from 'lucide-react';
import { useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { loadDataset, reasonOf, type Dataset } from '@/lib/data/live-data';
import ui from './ui.module.css';
import styles from './get-data-button.module.css';

// Client-side only: the API's own rate limit is the real server-side guard.
const COOLDOWN_MS = 30_000;

export function GetDataButton({ dataset }: { dataset: Dataset }) {
  const [isLoading, setIsLoading] = useState(false);
  const lastStartedAt = useRef(0);

  async function handleClick() {
    const waitMs = COOLDOWN_MS - (Date.now() - lastStartedAt.current);
    if (waitMs > 0) {
      toast.warn(`Wait ${Math.ceil(waitMs / 1000)}s before loading again`);
      return;
    }
    lastStartedAt.current = Date.now();
    setIsLoading(true);
    try {
      const { count } = await loadDataset(dataset);
      toast.success(`Loaded ${count} rows from API`);
    } catch (cause) {
      toast.error(`Load failed: ${reasonOf(cause)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`${ui.btn} ${ui.btnPrimary}`}
        onClick={() => void handleClick()}
        disabled={isLoading}
      >
        <RotateCw size={16} aria-hidden="true" /> {isLoading ? 'Loading…' : 'GET DATA'}
      </button>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        limit={3}
        toastClassName={styles.toast}
        progressClassName={styles.toastProgress}
      />
    </>
  );
}
