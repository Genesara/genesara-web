import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AgentEvent } from '@/api/types';
import { agents } from '@/api/agents';
import { streamAgentEvents } from '@/api/events';
import { qk } from '@/api/keys';
import { useAuth } from '@/stores/auth';

const BUFFER_CAP = 200;

export interface ReceivedAgentEvent extends AgentEvent {
  receivedAt: number;
}

type Invalidator = (id: string, qc: ReturnType<typeof useQueryClient>) => void;

// Map an event type to the cache invalidations it should trigger.
const INVALIDATE: Record<string, Invalidator> = {
  'agent.moved': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agent(id) });
    qc.invalidateQueries({ queryKey: qk.agentMap(id) });
  },
  'agent.spawned': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agent(id) });
    qc.invalidateQueries({ queryKey: qk.agents });
  },
  'agent.died': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agent(id) });
    qc.invalidateQueries({ queryKey: qk.agents });
  },
  'agent.levelup': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agent(id) });
    qc.invalidateQueries({ queryKey: qk.agentSkills(id) });
  },
  'agent.class.chosen': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agent(id) });
  },
  'inventory.changed': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agentInventory(id) });
    qc.invalidateQueries({ queryKey: qk.agentLoadout(id) });
  },
  'loadout.changed': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agentLoadout(id) });
  },
  'skill.gained': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agentSkills(id) });
  },
  'relationship.changed': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agentRelationships(id) });
  },
  'gauge.changed': (id, qc) => {
    qc.invalidateQueries({ queryKey: qk.agent(id) });
  },
};

export interface UseAgentEventsResult {
  events: ReceivedAgentEvent[];
  lastSeq: number;
  connected: boolean;
}

export function useAgentEvents(agentId: string | undefined): UseAgentEventsResult {
  const qc = useQueryClient();
  // Restart the stream when the JWT changes so a rotated token takes effect.
  const jwt = useAuth((s) => s.jwt);
  const [events, setEvents] = useState<ReceivedAgentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const lastSeqRef = useRef(0);

  useEffect(() => {
    if (!agentId || !jwt) return;

    let cancelled = false;
    const controller = new AbortController();

    function stamp(ev: AgentEvent): ReceivedAgentEvent {
      return { ...ev, receivedAt: Date.now() };
    }

    function invalidate(type: string) {
      const handler = INVALIDATE[type];
      if (handler) handler(agentId!, qc);
    }

    function apply(ev: AgentEvent) {
      if (cancelled) return;
      lastSeqRef.current = Math.max(lastSeqRef.current, ev.seq);
      const received = stamp(ev);
      setEvents((prev) => {
        const next = prev.concat(received);
        return next.length > BUFFER_CAP ? next.slice(next.length - BUFFER_CAP) : next;
      });
      invalidate(ev.type);
    }

    async function run() {
      let afterSeq = 0;
      try {
        const backfill = await agents.eventsSince(agentId!, 0, 50);
        if (cancelled) return;
        if (backfill.length) {
          const stamped = backfill.slice(-BUFFER_CAP).map(stamp);
          setEvents(stamped);
          afterSeq = backfill[backfill.length - 1].seq;
          lastSeqRef.current = afterSeq;
          // Backfill may have superseded the last cached snapshot we polled —
          // invalidate the matching keys so the panels refresh in lockstep.
          const seenTypes = new Set(backfill.map((e) => e.type));
          for (const t of seenTypes) invalidate(t);
        }
      } catch {
        // No backfill — start fresh from seq 0.
      }

      if (cancelled) return;

      try {
        await streamAgentEvents({
          agentId: agentId!,
          afterSeq,
          getToken: () => useAuth.getState().jwt,
          on401: () => useAuth.getState().handle401(),
          onOpen: () => !cancelled && setConnected(true),
          onEvent: apply,
          signal: controller.signal,
        });
      } catch {
        // Aborted on unmount or fatal — just stop.
      } finally {
        if (!cancelled) setConnected(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
      controller.abort();
      setConnected(false);
    };
  }, [agentId, qc, jwt]);

  return { events, lastSeq: lastSeqRef.current, connected };
}
