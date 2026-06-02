import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { AgentEvent } from './types';

export interface StreamArgs {
  agentId: string;
  afterSeq: number;
  getToken: () => string | null;
  onEvent: (ev: AgentEvent) => void;
  onError?: (err: unknown, attempt: number) => number | void;
  onOpen?: () => void;
  on401?: () => void;
  signal: AbortSignal;
}

class FatalSseError extends Error {}

export async function streamAgentEvents(args: StreamArgs): Promise<void> {
  const {
    agentId,
    afterSeq,
    getToken,
    onEvent,
    onError,
    onOpen,
    on401,
    signal,
  } = args;

  let attempt = 0;
  const url = `/api/agents/${agentId}/events/stream?after=${afterSeq}`;

  const initialToken = getToken();
  const initialHeaders: Record<string, string> = initialToken
    ? { Authorization: `Bearer ${initialToken}` }
    : {};

  await fetchEventSource(url, {
    signal,
    openWhenHidden: false,
    headers: initialHeaders,
    async onopen(res) {
      if (res.ok && res.headers.get('content-type')?.includes('text/event-stream')) {
        attempt = 0;
        onOpen?.();
        return;
      }
      if (res.status === 401) {
        on401?.();
        throw new FatalSseError('unauthorized');
      }
      // 4xx other than 401 means we should give up rather than retry forever.
      if (res.status >= 400 && res.status < 500) {
        throw new FatalSseError(`SSE rejected: ${res.status}`);
      }
      throw new Error(`SSE open failed: ${res.status}`);
    },
    onmessage(ev) {
      if (!ev.data) return; // heartbeats / pings
      try {
        const parsed = JSON.parse(ev.data) as AgentEvent;
        onEvent(parsed);
      } catch {
        // ignore malformed frames
      }
    },
    onerror(err) {
      if (err instanceof FatalSseError) throw err;
      attempt += 1;
      const userRetry = onError?.(err, attempt);
      if (typeof userRetry === 'number' && userRetry > 0) return userRetry;
      // Exponential backoff capped at 30s.
      return Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
    },
  });
}
