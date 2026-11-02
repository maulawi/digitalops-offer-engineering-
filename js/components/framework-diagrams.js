// framework-diagrams.js — shared visual building blocks for DigitalOps' own frameworks,
// used by lesson-block.js (read-only, in the reading flow) and exercise-fields.js
// (the live, interactive version on Module 3's exercise screen).

export function marketPulseTable(signals) {
  return `<div class="label" style="margin-bottom:12px">The Market Pulse Check</div>` + signals
    .map((s) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)"><span class="body-sm" style="color:var(--ink);font-weight:600">${s.label}</span><span class="body-sm" style="color:var(--ink-muted);text-align:right">${s.question}</span></div>`)
    .join('');
}

export function problemTimelineDiagram(stages) {
  return `<div class="timeline-diagram"><div class="timeline-row">` + stages
    .map((s) => `<div class="tl-stage"><div class="tl-dot">◈</div><div class="tl-name">${s.label}</div><div class="tl-desc">${s.detail}</div></div>`)
    .join('') + `</div></div>`;
}

export function pullDragZoneLegend(zones) {
  return `<div class="label" style="margin-bottom:12px">The four zones</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">` + zones
    .map((z) => `<div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px"><div class="body-sm" style="font-weight:700;color:${z.id === 'magnetic' ? 'var(--gold)' : 'var(--ink)'}">${z.label}</div><div class="body-sm" style="color:var(--ink-faint)">${z.note}</div></div>`)
    .join('') + `</div>`;
}

export function promiseTypesGrid(types) {
  return `<div class="label" style="margin-bottom:12px">DigitalOps Promise Types</div><div class="promise-type-grid">` + types
    .map((p) => `<div class="promise-type-card" style="cursor:default"><div class="pt-label">${p.label}</div><div class="pt-purpose">${p.purpose}</div></div>`)
    .join('') + `</div>`;
}

/** The Pull/Drag Map itself. Axes are fixed by the approved model:
 *  Pull (horizontal, low→high) = avg(Outcome Pull, Proof Pull);
 *  Drag (vertical, low→high) = avg(Speed Drag, Effort Drag); Magnetic = high pull, low drag.
 *  Do not mirror or rotate these axes — see the Design System's Framework Diagrams guidelines. */
export function pullDragMapSvg() {
  return `
    <svg viewBox="0 0 560 390" role="img" aria-label="Pull/Drag Map">
      <rect x="60" y="20" width="460" height="300" fill="none" stroke="var(--border)" stroke-width="1.25"/>
      <line x1="290" y1="20" x2="290" y2="320" stroke="var(--border)" stroke-dasharray="4 4"/>
      <line x1="60" y1="170" x2="520" y2="170" stroke="var(--border)" stroke-dasharray="4 4"/>
      <rect x="290" y="170" width="230" height="150" fill="var(--gold)" fill-opacity="0.08"/>
      <text x="175" y="95" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink-muted)">Hard Sell</text>
      <text x="405" y="95" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink-muted)">Slow Burn</text>
      <text x="175" y="245" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink-muted)">Mild Interest</text>
      <text x="405" y="245" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink)">Magnetic</text>
      <text x="60" y="340" font-size="11" fill="var(--ink-faint)">low</text>
      <text x="520" y="340" text-anchor="end" font-size="11" fill="var(--ink-faint)">high</text>
      <text x="290" y="358" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">Pull</text>
      <text x="48" y="320" text-anchor="end" font-size="11" fill="var(--ink-faint)">low</text>
      <text x="48" y="28" text-anchor="end" font-size="11" fill="var(--ink-faint)">high</text>
      <circle data-marker cx="405" cy="245" r="7" fill="var(--gold)" style="display:none"/>
    </svg>
  `;
}

const PULLDRAG_BOUNDS = { left: 60, right: 520, top: 20, bottom: 320 };
const ZONE_NAMES = { magnetic: 'Magnetic', 'slow-burn': 'Slow Burn', 'mild-interest': 'Mild Interest', 'hard-sell': 'Hard Sell' };

export function updatePullDragMarker(container, pos) {
  const marker = container.querySelector('[data-marker]');
  if (!marker) return;
  if (!pos) { marker.style.display = 'none'; return; }
  const { left, right, top, bottom } = PULLDRAG_BOUNDS;
  marker.setAttribute('cx', left + (pos.pull / 10) * (right - left));
  marker.setAttribute('cy', bottom - (pos.drag / 10) * (bottom - top));
  marker.style.display = '';
}

export function pullDragZoneReadoutText(pos) {
  if (!pos) return 'Rate all four forces to see where your offer lands.';
  return `You're in ${ZONE_NAMES[pos.zone]}.`;
}
