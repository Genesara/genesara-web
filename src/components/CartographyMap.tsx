import { useEffect, useRef } from 'react';

/**
 * Hand-drawn hex-map fragment used in the landing "Cartography" section.
 * Ported verbatim from design/project/index.html (inline SVG-building script).
 * Pure SVG, no Three.js — the hex tiles, agent dots and tick counter
 * are imperative DOM mutations on an empty <svg> root.
 */
export function CartographyMap({ onTick }: { onTick?: (n: number) => void }) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';

    const created: SVGElement[] = [];
    function el<K extends keyof SVGElementTagNameMap>(
      tag: K,
      attrs?: Record<string, string>,
      parent: SVGElement = svg!,
    ): SVGElementTagNameMap[K] {
      const n = document.createElementNS(NS, tag);
      if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      created.push(n as unknown as SVGElement);
      return n;
    }

    const W = 56;
    const H = (W * 2) / Math.sqrt(3);
    const vs = H * 0.75;
    const ox = 56;
    const oy = 58;
    function center(c: number, r: number) {
      const shift = r % 2 === 0 ? W / 2 : 0;
      return { x: ox + c * W + shift, y: oy + r * vs };
    }
    const cr = (col: number, row: number) => center(col - 10, row - 4);
    const hexPts = [
      [0, -H / 2],
      [W / 2, -H / 4],
      [W / 2, H / 4],
      [0, H / 2],
      [-W / 2, H / 4],
      [-W / 2, -H / 4],
    ]
      .map((p) => p.map((n) => n.toFixed(2)).join(','))
      .join(' ');

    const grid = [
      'Lp Lp Ff Lp Lp Lp Lp Cc Cc',
      'Lp Ff Ar Ar Lp Lp Cc Cc Cc',
      'Ff Ar Ar Lp Ww Lp Cc Cc Cc',
      'Ar Ar Ar Ar Ak Cc Cc Cc Cc',
      'Ar Ar Ar Lp Lp Cc Cc Cc Cc',
      'Lp Lp Lp Lp Lp Lp Cc Cc Cc',
    ].map((s) => s.split(' '));

    const main = el('g', { filter: 'url(#rough)' });
    const fillFor: Record<string, string> = {
      L: '#1A1814',
      F: '#1A1814',
      A: '#1A1814',
      C: '#0E0F12',
      W: '#1A1814',
    };

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const code = grid[r][c];
        const biome = code[0];
        const terrain = code[1];
        const ctr = center(c, r);
        const g = el(
          'g',
          { transform: `translate(${ctr.x.toFixed(2)},${ctr.y.toFixed(2)})` },
          main,
        );
        el(
          'polygon',
          { points: hexPts, fill: fillFor[biome], stroke: '#2B2A26', 'stroke-width': '0.8' },
          g,
        );
        if (biome === 'A') {
          el(
            'polygon',
            { points: hexPts, fill: 'url(#alpine-hatch)', stroke: 'none', opacity: '0.7' },
            g,
          );
        }
        if (biome === 'W') {
          el('polygon', { points: hexPts, fill: '#C8A35E', opacity: '0.14', stroke: 'none' }, g);
          el(
            'polygon',
            {
              points: hexPts,
              fill: 'none',
              stroke: '#C8A35E',
              'stroke-width': '0.9',
              'stroke-dasharray': '2 2',
              opacity: '0.6',
              transform: 'scale(0.74)',
            },
            g,
          );
        }
        if (biome === 'C') {
          const phase = ((c * 7 + r * 3) % 5) - 2;
          for (let i = 0; i < 3; i++) {
            const yy = -H / 4 + 4 + i * (H / 4 - 1) + phase * 0.3;
            el(
              'path',
              {
                d: `M ${(-W / 2 + 8).toFixed(1)} ${yy.toFixed(1)} q 5 -3 10 0 t 10 0 t 10 0`,
                fill: 'none',
                stroke: '#2B2A26',
                'stroke-width': '0.7',
                opacity: '0.95',
              },
              g,
            );
          }
        }
        if (biome === 'F') {
          const tris: [number, number][] = [
            [-12, -4],
            [5, -9],
            [-3, 3],
            [12, 2],
            [-10, 9],
            [3, 11],
          ];
          for (const t of tris) {
            el(
              'path',
              { d: `M ${t[0]} ${t[1]} l 3 -6 l 3 6 z`, fill: '#9A968D', opacity: '0.85' },
              g,
            );
          }
        }
        if (terrain === 'r' && biome === 'A') {
          el(
            'path',
            {
              d: 'M -9 5 l 5 -7 l 5 7 M -1 5 l 5 -7 l 5 7',
              fill: 'none',
              stroke: '#9A968D',
              'stroke-width': '1',
              'stroke-linecap': 'round',
            },
            g,
          );
        }
        if (terrain === 'c' && biome === 'C') {
          el(
            'path',
            {
              d: 'M -10 14 q 5 -4 10 0 t 10 0',
              fill: 'none',
              stroke: '#9A968D',
              'stroke-width': '1',
              'stroke-linecap': 'round',
              opacity: '0.9',
            },
            g,
          );
        }
        if (terrain === 'k') {
          el(
            'path',
            {
              d: 'M -8 -8 l -3 8 l 3 8 M 8 -8 l 3 8 l -3 8',
              fill: 'none',
              stroke: '#C8A35E',
              'stroke-width': '1.4',
              'stroke-linecap': 'round',
            },
            g,
          );
        }
        if (terrain === '~') {
          el(
            'path',
            {
              d: 'M -12 -4 q 6 -3 12 0 t 12 4',
              fill: 'none',
              stroke: '#9A968D',
              'stroke-width': '0.9',
              'stroke-dasharray': '2 2',
            },
            g,
          );
        }
        if (terrain === 'w') {
          el(
            'rect',
            {
              x: '-4.5',
              y: '-4.5',
              width: '9',
              height: '9',
              fill: 'none',
              stroke: '#9A968D',
              'stroke-width': '0.9',
            },
            g,
          );
        }
        if (terrain === 'p' && biome === 'L') {
          el('circle', { cx: '0', cy: '0', r: '0.7', fill: '#2B2A26', opacity: '0.7' }, g);
        }
      }
    }

    const buildings = el('g', { filter: 'url(#rough)' });
    function building(col: number, row: number, draw: (g: SVGGElement) => void) {
      const p = cr(col, row);
      const g = el(
        'g',
        { transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})` },
        buildings,
      );
      draw(g as SVGGElement);
    }
    building(13, 5, (g) => {
      el(
        'rect',
        { x: '-3', y: '-2', width: '6', height: '8', fill: 'none', stroke: '#9A968D', 'stroke-width': '0.8' },
        g,
      );
      el(
        'path',
        {
          d: 'M -4 -2 l 4 -4 l 4 4',
          fill: 'none',
          stroke: '#9A968D',
          'stroke-width': '0.8',
          'stroke-linecap': 'round',
        },
        g,
      );
    });
    building(14, 5, (g) => {
      el(
        'rect',
        { x: '-4', y: '-1', width: '8', height: '6', fill: 'none', stroke: '#9A968D', 'stroke-width': '0.8' },
        g,
      );
      el(
        'path',
        {
          d: 'M -2 -1 q -1 -4 1 -7',
          fill: 'none',
          stroke: '#9A968D',
          'stroke-width': '0.7',
          'stroke-linecap': 'round',
        },
        g,
      );
    });
    building(15, 6, (g) => {
      el('line', { x1: '-3', y1: '-4', x2: '-3', y2: '6', stroke: '#9A968D', 'stroke-width': '0.8' }, g);
      el('line', { x1: '3', y1: '-4', x2: '3', y2: '6', stroke: '#9A968D', 'stroke-width': '0.8' }, g);
      el('line', { x1: '-5', y1: '4', x2: '5', y2: '4', stroke: '#9A968D', 'stroke-width': '0.7' }, g);
    });
    building(12, 7, (g) => {
      el('line', { x1: '0', y1: '-7', x2: '0', y2: '6', stroke: '#9A968D', 'stroke-width': '0.8' }, g);
      el('path', { d: 'M 0 -7 l 6 1 l -6 3 z', fill: '#9A968D', stroke: 'none', opacity: '0.9' }, g);
    });

    // landmarks
    {
      const p = cr(14, 6);
      const g = el('g', {
        transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`,
        filter: 'url(#rough)',
      });
      el('rect', { x: '-4.5', y: '-4.5', width: '9', height: '9', fill: '#C8A35E' }, g);
    }
    {
      const p = cr(15, 7);
      const g = el('g', {
        transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`,
        filter: 'url(#rough)',
      });
      el('circle', { cx: '0', cy: '0', r: '4', fill: '#C8A35E' }, g);
      el('circle', { cx: '0', cy: '0', r: '10', fill: 'none', stroke: '#C8A35E', 'stroke-width': '1' }, g);
    }

    // compass
    {
      const g = el('g', { transform: 'translate(594,402)' });
      el('circle', { cx: '0', cy: '0', r: '18', stroke: '#9A968D', 'stroke-width': '0.8', fill: 'none' }, g);
      el('path', { d: 'M0 -16 L3 0 L0 16 L-3 0 Z', fill: '#9A968D' }, g);
      const t = el(
        'text',
        {
          x: '0',
          y: '-22',
          fill: '#9A968D',
          'font-family': 'JetBrains Mono, monospace',
          'font-size': '9',
          'text-anchor': 'middle',
        },
        g,
      );
      t.textContent = 'N';
    }
    {
      const g = el('g', { transform: 'translate(36,424)' });
      el('line', { x1: '0', y1: '0', x2: '90', y2: '0', stroke: '#9A968D', 'stroke-width': '1' }, g);
      [0, 45, 90].forEach((x) =>
        el(
          'line',
          { x1: String(x), y1: '-3', x2: String(x), y2: '3', stroke: '#9A968D', 'stroke-width': '1' },
          g,
        ),
      );
      const t1 = el(
        'text',
        { x: '0', y: '16', fill: '#9A968D', 'font-family': 'JetBrains Mono, monospace', 'font-size': '9' },
        g,
      );
      t1.textContent = '0';
      const t2 = el(
        'text',
        {
          x: '90',
          y: '16',
          fill: '#9A968D',
          'font-family': 'JetBrains Mono, monospace',
          'font-size': '9',
          'text-anchor': 'end',
        },
        g,
      );
      t2.textContent = '9 hex';
    }

    const liveG = el('g', { transform: 'translate(36, 396)' });
    const liveLbl = el(
      'text',
      {
        x: '0',
        y: '0',
        fill: '#C8A35E',
        'font-family': 'JetBrains Mono, monospace',
        'font-size': '10',
        'font-weight': '600',
        'letter-spacing': '0.12em',
      },
      liveG,
    );
    liveLbl.textContent = 'LIVE';
    el(
      'animate',
      { attributeName: 'opacity', values: '1;0.45;1', dur: '2.6s', repeatCount: 'indefinite' },
      liveLbl as unknown as SVGElement,
    );
    el('text', { x: '36', y: '0', fill: '#2B2A26', 'font-family': 'JetBrains Mono, monospace', 'font-size': '10' }, liveG).textContent = '·';
    const tickEl = el(
      'text',
      {
        x: '46',
        y: '0',
        fill: '#9A968D',
        'font-family': 'JetBrains Mono, monospace',
        'font-size': '10',
        'letter-spacing': '0.06em',
      },
      liveG,
    );
    tickEl.textContent = 'TICK 4,712,389';
    el('text', { x: '160', y: '0', fill: '#2B2A26', 'font-family': 'JetBrains Mono, monospace', 'font-size': '10' }, liveG).textContent = '·';
    const visEl = el(
      'text',
      {
        x: '170',
        y: '0',
        fill: '#9A968D',
        'font-family': 'JetBrains Mono, monospace',
        'font-size': '10',
        'letter-spacing': '0.06em',
      },
      liveG,
    );
    visEl.textContent = '5 AGENTS VISIBLE';

    interface AgentDot {
      id: string;
      col: number;
      row: number;
      _g: SVGGElement;
      _ring: SVGCircleElement;
      _dot: SVGCircleElement;
    }
    const agentsG = el('g');
    const agents: AgentDot[] = [
      { id: 'artemis', col: 14, row: 7 } as AgentDot,
      { id: 'cassia', col: 16, row: 7 } as AgentDot,
      { id: 'orin', col: 13, row: 5 } as AgentDot,
      { id: 'vesper', col: 15, row: 6 } as AgentDot,
      { id: 'myrr', col: 14, row: 6 } as AgentDot,
    ];
    function biomeAt(col: number, row: number) {
      const r = row - 4;
      const c = col - 10;
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[r].length) return null;
      return grid[r][c][0];
    }
    agents.forEach((a) => {
      const p = cr(a.col, a.row);
      const g = el(
        'g',
        { transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})` },
        agentsG,
      );
      g.style.transition = 'transform 1.2s cubic-bezier(0.6, 0.05, 0.4, 1)';
      const ring = el(
        'circle',
        { cx: '0', cy: '0', r: '4', fill: 'none', stroke: '#C8A35E', 'stroke-width': '1', opacity: '0' },
        g,
      );
      const dot = el('circle', { cx: '0', cy: '0', r: '3', fill: '#E8E5DE' }, g);
      a._g = g as SVGGElement;
      a._ring = ring as SVGCircleElement;
      a._dot = dot as SVGCircleElement;
    });
    function adjacents(col: number, row: number) {
      const r = row - 4;
      const evenRow = r % 2 === 0;
      const offsets = evenRow
        ? [
            [-1, -1],
            [0, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
          ]
        : [
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ];
      return offsets
        .map((o) => ({ col: col + o[0], row: row + o[1] }))
        .filter((p) => biomeAt(p.col, p.row));
    }
    let lastMover: AgentDot | null = null;
    function moveOne() {
      const pool = agents.filter((a) => a !== lastMover);
      const a = pool[Math.floor(Math.random() * pool.length)] || agents[0];
      const adj = adjacents(a.col, a.row);
      if (!adj.length) return;
      const cur = biomeAt(a.col, a.row);
      const valid = adj.filter((p) => {
        const b = biomeAt(p.col, p.row);
        if (b === 'C' && cur !== 'C') {
          return adj.some((n) => biomeAt(n.col, n.row) === 'C') && Math.random() < 0.4;
        }
        return true;
      });
      const next = valid[Math.floor(Math.random() * valid.length)] || adj[0];
      a.col = next.col;
      a.row = next.row;
      const to = cr(next.col, next.row);
      a._g.setAttribute('transform', `translate(${to.x.toFixed(1)},${to.y.toFixed(1)})`);
      a._dot.setAttribute('fill', '#C8A35E');
      a._ring.setAttribute('opacity', '0.65');
      setTimeout(() => {
        a._dot.setAttribute('fill', '#E8E5DE');
        a._ring.setAttribute('opacity', '0');
      }, 2000);
      lastMover = a;
    }

    let tickN = 4_712_389;
    function bumpTick() {
      tickN += 1 + Math.floor(Math.random() * 2);
      const formatted = tickN.toLocaleString('en-US');
      tickEl.textContent = 'TICK ' + formatted;
      onTick?.(tickN);
    }
    const tickInt = setInterval(bumpTick, 2400);
    const moveInt = setInterval(moveOne, 7000);
    const initial = setTimeout(moveOne, 1500);

    return () => {
      clearInterval(tickInt);
      clearInterval(moveInt);
      clearTimeout(initial);
      created.forEach((n) => n.remove());
    };
  }, [onTick]);

  return (
    <svg
      ref={svgRef}
      id="cart-map"
      viewBox="0 0 640 460"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Map fragment: Fyrnhold and the Iron Coast"
    >
      <defs>
        <pattern
          id="alpine-hatch"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="5" stroke="#2B2A26" strokeWidth="0.7" />
        </pattern>
        <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={0.7} />
        </filter>
      </defs>
    </svg>
  );
}
