'use client';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HeaderPortal } from '@/components/layout/header-portal';
import { useQueryParams } from '@/lib/use-query-params';
import { CalendarFilter } from './calendar-filter';
import styles from './ui.module.css';

export interface FilterField {
  name: string;
  label: string;
  type: 'select' | 'date' | 'search';
  options?: { value: string; label: string }[];
  /** With a default there is no "All" entry (sort, view). */
  default?: string;
  max?: string;
  min?: string;
  availableDates?: readonly string[];
  stockDates?: readonly string[];
}

function SearchInput({ name }: { name: string }) {
  const { get, set } = useQueryParams();
  const [value, setValue] = useState(get(name));
  // Debounced so each keystroke does not trigger a server round trip.
  useEffect(() => {
    const t = setTimeout(() => {
      if (value !== get(name)) set({ [name]: value });
    }, 300);
    return () => clearTimeout(t);
  }, [value, get, set, name]);
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search"
    />
  );
}

export function FilterBar({
  fields,
  inHeader = true,
  showRefresh = true,
}: {
  fields: FilterField[];
  inHeader?: boolean;
  showRefresh?: boolean;
}) {
  const { get, set, refresh, pending } = useQueryParams();
  const form = (
      <form
        className={`${styles.toolbar} ${styles.filterBar} ${inHeader ? '' : styles.contentFilterBar}`}
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filters"
      >
        {fields.map((f) => (
          <label key={f.name} className={styles.field}>
            <span>{f.label}</span>
            {f.type === 'select' ? (
              <select
                value={get(f.name) || f.default || ''}
                onChange={(e) => set({ [f.name]: e.target.value })}
              >
                {f.default ? null : <option value="">All</option>}
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === 'date' ? (
              <CalendarFilter
                label={f.label}
                value={get(f.name) || f.default || ''}
                availableDates={f.availableDates ?? []}
                stockDates={f.stockDates ?? []}
                onChange={(value) => set({ [f.name]: value })}
              />
            ) : (
              <SearchInput name={f.name} />
            )}
          </label>
        ))}
        {showRefresh ? (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={refresh}
            aria-busy={pending}
            disabled={pending}
          >
            <RefreshCw size={14} className={pending ? styles.spin : undefined} aria-hidden="true" />
            Refresh
          </button>
        ) : null}
      </form>
  );
  return inHeader ? <HeaderPortal>{form}</HeaderPortal> : form;
}
