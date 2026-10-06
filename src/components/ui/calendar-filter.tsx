'use client';

import { CalendarDays } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatIsoDate } from '@/lib/format';
import styles from './calendar-filter.module.css';

const POPOVER_WIDTH = 300;
const POPOVER_HEIGHT = 380;

type Position = { left: number; top: number };

function parseIsoDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getPosition(anchor: HTMLElement): Position {
  const rect = anchor.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8));
  const below = rect.bottom + POPOVER_HEIGHT + 8 <= window.innerHeight;
  return {
    left,
    top: below ? rect.bottom + 6 : Math.max(8, rect.top - POPOVER_HEIGHT - 6),
  };
}

export function CalendarFilter({
  label,
  value,
  availableDates,
  stockDates,
  onChange,
}: {
  label: string;
  value: string;
  availableDates: readonly string[];
  stockDates: readonly string[];
  onChange: (value: string) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [month, setMonth] = useState(
    () =>
      parseIsoDate(value) ??
      parseIsoDate(availableDates[availableDates.length - 1] ?? '') ??
      new Date(),
  );
  const selected = parseIsoDate(value);
  const minDate = parseIsoDate(availableDates[0] ?? '');
  const maxDate = parseIsoDate(availableDates[availableDates.length - 1] ?? '');
  const available = new Set(availableDates);
  const marked = stockDates.flatMap((date) => {
    const parsed = parseIsoDate(date);
    return parsed ? [parsed] : [];
  });

  useEffect(() => {
    if (selected) setMonth(selected);
  }, [value]);

  useLayoutEffect(() => {
    if (open && triggerRef.current) setPosition(getPosition(triggerRef.current));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !popoverRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const reposition = () => {
      if (triggerRef.current) setPosition(getPosition(triggerRef.current));
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      setMonth(
        selected ??
          parseIsoDate(availableDates[availableDates.length - 1] ?? '') ??
          new Date(),
      );
      setOpen(true);
    } else {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={`Choose ${label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <CalendarDays size={15} aria-hidden="true" />
        {value ? formatIsoDate(value) : 'Choose date'}
      </button>
      {open && position
        ? createPortal(
            <div
              ref={popoverRef}
              className={styles.popover}
              role="dialog"
              aria-label={`${label} calendar`}
              style={{ left: position.left, top: position.top }}
            >
              <DayPicker
                className={styles.calendar}
                mode="single"
                selected={selected}
                month={month}
                onMonthChange={setMonth}
                startMonth={minDate}
                endMonth={maxDate}
                disabled={(date) => !available.has(toIsoDate(date))}
                modifiers={{ hasStock: marked }}
                modifiersClassNames={{ hasStock: styles.hasStock }}
                weekStartsOn={1}
                showOutsideDays
                onSelect={(date) => {
                  if (!date) return;
                  onChange(toIsoDate(date));
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              />
              <div className={styles.legend}>
                <i aria-hidden="true" /> Days with stock
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}