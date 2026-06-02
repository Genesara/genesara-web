import { useQuery } from '@tanstack/react-query';
import { stats } from '@/api/stats';
import { qk } from '@/api/keys';

/**
 * Live `/api/stats` poll. Replaces the simulated tick.
 */
export function useStats() {
  return useQuery({
    queryKey: qk.stats,
    queryFn: stats.get,
    refetchInterval: 1500,
    staleTime: 1200,
  });
}

/**
 * @deprecated Use {@link useStats} directly to also access onlineAgents/totalAgents.
 * Kept as a thin shim so existing call sites still resolve.
 */
export function useTick(): number {
  const { data } = useStats();
  return data?.tick ?? 0;
}

export function formatTick(n: number): string {
  return n.toLocaleString('en-US');
}
