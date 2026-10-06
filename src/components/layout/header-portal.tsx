'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState, type ReactNode } from 'react';

export function HeaderPortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById('header-tools'));
  }, []);

  return target ? createPortal(children, target) : null;
}
