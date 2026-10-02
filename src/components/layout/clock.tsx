'use client';
import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/format';

// Empty on the server and first client render: a server-rendered time would never match the client's and cause a hydration error.
export function Clock() {
  const [text, setText] = useState('');
  useEffect(() => {
    const tick = () => setText(formatDateTime(new Date()));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return <time suppressHydrationWarning>{text}</time>;
}
