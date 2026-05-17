import { useEffect, useState } from 'react';

/**
 * Drives the fake "world tick" counter on landing / soon / app pages.
 * Replace with a real WebSocket / SSE subscription to the engine when available.
 */
export function useTick(start = 4_712_389, intervalMs = 2400): number {
  const [tick, setTick] = useState(start);
  useEffect(() => {
    const t = setInterval(() => {
      setTick((v) => v + 1 + Math.floor(Math.random() * 3));
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return tick;
}

export function formatTick(n: number): string {
  return n.toLocaleString('en-US');
}
