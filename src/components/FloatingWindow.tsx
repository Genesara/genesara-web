import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface FloatingWindowProps {
  id: string;
  title: string;
  subtitle?: string;
  /** Initial top-left position, in viewport px. */
  position: { x: number; y: number };
  width: number;
  height: number;
  /** Stacking order — bumped by the manager on focus. */
  zIndex: number;
  onClose: () => void;
  /** Raise to front + persist the new position when the window moves. */
  onFocus: () => void;
  onMove: (pos: { x: number; y: number }) => void;
  children: ReactNode;
}

/**
 * A draggable, collapsible, non-resizable floating panel. Generalises the
 * original `.logwin` chrome. Drag is by the header only; the window is clamped
 * within the viewport. Collapse is local; position/z/open are owned by the
 * parent window manager so they survive remounts within the session.
 */
export function FloatingWindow({
  id,
  title,
  subtitle,
  position,
  width,
  height,
  zIndex,
  onClose,
  onFocus,
  onMove,
  children,
}: FloatingWindowProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  // Latest props for listeners we bind once (resize) — avoids re-subscribing
  // every render / every drag frame and dodges stale closures.
  const latest = useRef({ position, onMove, width, height });
  latest.current = { position, onMove, width, height };

  const clamp = useCallback((x: number, y: number) => {
    const w = elRef.current?.offsetWidth ?? latest.current.width;
    const h = elRef.current?.offsetHeight ?? latest.current.height;
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);
    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  }, []);

  // Re-clamp into view, but only emit when the position actually changes.
  const clampInto = useCallback(() => {
    const { position, onMove } = latest.current;
    const next = clamp(position.x, position.y);
    if (next.x !== position.x || next.y !== position.y) onMove(next);
  }, [clamp]);

  function onHeaderPointerDown(e: React.PointerEvent) {
    // Ignore clicks on the header buttons (close / collapse). Focus is handled
    // by the outer `.fwin` onPointerDown, which this event bubbles to.
    if ((e.target as HTMLElement).closest('button')) return;
    const rect = elRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    setDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Pointer no longer active (e.g. a too-fast click) — drag still tracks
      // via the move handler for mouse; capture is a nice-to-have.
    }
  }

  function onHeaderPointerMove(e: React.PointerEvent) {
    const d = dragState.current;
    if (!d || d.pointerId !== e.pointerId) return;
    onMove(clamp(e.clientX - d.offsetX, e.clientY - d.offsetY));
  }

  function endDrag(e: React.PointerEvent) {
    const d = dragState.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragState.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // capture may already be lost — ignore
    }
  }

  // Bind the viewport-resize re-clamp once.
  useEffect(() => {
    window.addEventListener('resize', clampInto);
    return () => window.removeEventListener('resize', clampInto);
  }, [clampInto]);

  // Focus the window on open so Escape can dismiss it immediately.
  useEffect(() => {
    elRef.current?.focus({ preventScroll: true });
  }, []);

  // Expanding grows the body, which can push it past the bottom edge — re-clamp.
  useLayoutEffect(() => {
    if (!collapsed) clampInto();
  }, [collapsed, clampInto]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  }

  return (
    <div
      ref={elRef}
      className={`fwin${dragging ? ' dragging' : ''}${collapsed ? ' collapsed' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width,
        height: collapsed ? undefined : height,
        zIndex,
      }}
      role="dialog"
      aria-label={title}
      data-fwin={id}
      tabIndex={-1}
      onPointerDown={onFocus}
      onKeyDown={onKeyDown}
    >
      <div
        className="fwin-head"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="title">
          <span className="dot online" />
          {title}
        </span>
        {subtitle && <span className="sub">{subtitle}</span>}
        <span className="actions">
          <button
            className="icon-btn"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'expand' : 'collapse'}
            aria-label={collapsed ? 'expand' : 'collapse'}
          >
            {collapsed ? '+' : '—'}
          </button>
          <button className="icon-btn" onClick={onClose} title="close" aria-label="close">
            ×
          </button>
        </span>
      </div>
      {!collapsed && <div className="fwin-body">{children}</div>}
    </div>
  );
}
