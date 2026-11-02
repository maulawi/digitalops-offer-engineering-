// deliverable-tracker.js — the 9-item list, in two forms: a single-item "snapshot" at
// the end of each module (Screen 02's 4th stage), and the full list used on the
// Offer Blueprint screen. summarizeDeliverable() is the one place that turns raw
// answers into the human-readable text both forms (and the printed Blueprint) show.

import * as state from '../state.js';
import { moduleHash } from '../router.js';
import { esc, escMultiline } from '../util.js';

export function renderDeliverableTracker(ctx) {
  const { state: s, variant } = ctx;
  if (variant === 'module-snapshot') return renderSnapshot(ctx);
  return renderFullList(ctx);
}

function renderSnapshot({ mod, state: s }) {
  const wrap = document.createElement('div');
  const ids = [mod.deliverable, mod.deliverable2].filter(Boolean);
  if (!ids.length) {
    wrap.innerHTML = `<div class="card"><p class="body-sm" style="color:var(--ink-faint)">This module has no standalone deliverable — continue to the next module.</p></div>`;
    return wrap;
  }
  ids.forEach((d) => {
    const done = state.deliverableStatus(d.id, s);
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '16px';
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span class="h3">${d.label}</span>
        <span class="badge ${done ? 'badge-success' : 'badge-neutral'}">${done ? '✓ Complete' : 'Incomplete'}</span>
      </div>
      <div class="body-sm" style="color:var(--ink-muted)">${summarizeDeliverable(d.id, s, { empty: 'Complete the exercise above to fill this in.' })}</div>
    `;
    wrap.appendChild(card);
  });
  return wrap;
}

function renderFullList({ state: s, onNavigate }) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  state.allDeliverables(s).forEach((d) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `tracker-row ${d.done ? 'is-done' : ''}`;
    const num = String(state.DELIVERABLES.findIndex((x) => x.id === d.id) + 1).padStart(2, '0');
    row.innerHTML = `<span class="n">${num}</span><span class="t">${d.label}</span><span class="tracker-check"></span>`;
    row.addEventListener('click', () => onNavigate(moduleHash(d.module, 'exercise')));
    wrap.appendChild(row);
  });
  return wrap;
}

// Returns an HTML string. Every piece of customer-entered text in it goes through esc()/escMultiline()
// first, so whatever a customer types — including <, >, & and quotes — is shown as plain text and
// never interpreted as markup. `empty` is app-authored copy, not customer input.
export function summarizeDeliverable(id, s, opts = {}) {
  const empty = opts.empty || 'Not completed yet.';
  switch (id) {
    case 'target-customer-profile': {
      const top = state.topMarket(s);
      if (!top) return empty;
      const score = state.marketScore(top);
      return `${esc(top.name)} — Market Pulse score ${score.toFixed(1)}/10.`;
    }
    case 'problem-inventory': {
      const a = s.answers.m2;
      const filled = (arr) => arr.filter((p) => p.trim());
      const before = filled(a.before);
      const during = filled(a.during);
      const after = filled(a.after);
      if (!before.length && !during.length && !after.length) return empty;
      // Lists the actual problem statements under each stage, not just a count — so the
      // Blueprint (and its PDF export) shows the real inventory the customer wrote, matching
      // how every other deliverable shows real content rather than a checklist tally.
      const group = (label, items) => items.length
        ? `<div style="margin-top:8px"><strong>${label}:</strong><ul style="list-style:disc;padding-left:20px;margin:4px 0 0;display:flex;flex-direction:column;gap:2px">${items.map((p) => `<li>${escMultiline(p)}</li>`).join('')}</ul></div>`
        : '';
      return `${before.length} before · ${during.length} during · ${after.length} after.${group('Before', before)}${group('During', during)}${group('After', after)}`;
    }
    case 'outcome-statement':
      return s.answers.m3.outcomeStatement.trim() ? escMultiline(s.answers.m3.outcomeStatement.trim()) : empty;
    case 'product-concept': {
      const pos = state.pullDragPosition(s);
      if (!s.answers.m3.outcomeStatement.trim() || !pos) return empty;
      const names = { magnetic: 'Magnetic', 'slow-burn': 'Slow Burn', 'mild-interest': 'Mild Interest', 'hard-sell': 'Hard Sell' };
      return `${escMultiline(s.answers.m3.outcomeStatement)} — ${names[pos.zone]} on the Pull/Drag Map.`;
    }
    case 'offer-stack': {
      const a = s.answers.m4;
      if (!a.coreDeliverable.trim()) return empty;
      const bonuses = a.bonuses.filter((b) => b.name.trim());
      if (!bonuses.length) return `${escMultiline(a.coreDeliverable)}.`;
      // Each bonus names the problem it solves, so the Blueprint reflects the full stack —
      // not just a count — per the approved M4 deliverable requirements.
      const list = bonuses.map((b) => `<li>${esc(b.name)}${b.problem.trim() ? ` — solves: ${esc(b.problem)}` : ''}</li>`).join('');
      return `${escMultiline(a.coreDeliverable)}<ul style="list-style:disc;padding-left:20px;margin:8px 0 0;display:flex;flex-direction:column;gap:4px">${list}</ul>`;
    }
    case 'promise': {
      const a = s.answers.m4;
      if (!a.promiseType || !a.promiseStatement.trim()) return empty;
      const labels = { full: 'Full Promise', conditional: 'Conditional Promise', confidence: 'Confidence Signal' };
      return `${labels[a.promiseType]}: “${escMultiline(a.promiseStatement)}”`;
    }
    case 'pricing-hypothesis': {
      const a = s.answers.m6;
      if (a.anchorPrice === null || a.price === null) return empty;
      const cmp = state.anchorComparison(a);
      return `$${a.price} (anchor $${a.anchorPrice}${cmp ? `, ${cmp.text}` : ''}).`;
    }
    case 'offer-name-positioning': {
      const names = s.answers.m7.candidates.filter((c) => c.trim());
      const p = s.answers.m7.positioning;
      if (!names.length) return empty;
      const posLine = (p.who.trim() && p.format.trim() && p.outcome.trim() && p.obstacle.trim())
        ? `For ${esc(p.who)}, this is the ${esc(p.format)} that ${esc(p.outcome)} without ${esc(p.obstacle)}.`
        : '';
      // Shows the selected name plus the other candidates considered, so the Blueprint
      // reflects all three — not just the one chosen — per the approved M7 requirements.
      const others = names.slice(1);
      const headline = `${esc(names[0])} (selected)${others.length ? ` — also considered: ${others.map(esc).join(', ')}` : ''}${posLine ? '<br>' + posLine : ''}`;

      // The M5 integration brief folds the Unique Value Proposition into this same
      // deliverable instead of adding a tenth Blueprint entry (Part 6). Each field below
      // is its own line, kept deliberately separate from the positioning sentence above,
      // and shown only when the customer has actually provided it — nothing here is invented.
      const top = state.topMarket(s);
      const firstProblem = [...s.answers.m2.before, ...s.answers.m2.during, ...s.answers.m2.after].find((x) => x.trim());
      const extraFields = [
        ['Target audience', top ? top.name : ''],
        ['Main problem', firstProblem || ''],
        ['Desired outcome', s.answers.m3.outcomeStatement.trim()],
        ['Unique Value Proposition', s.answers.m5.uvpStatement.trim()],
        ['Main alternative', s.answers.m5.mainAlternative.trim()],
        ["Alternative's limitation", s.answers.m5.alternativeLimitation.trim()],
        ['Main meaningful differentiation', s.answers.m5.yourDifference.trim()],
        ['Why the customer should care', s.answers.m5.whyCustomersCare.trim()],
      ];
      const extra = extraFields
        .filter(([, value]) => value)
        .map(([label, value]) => `<div style="margin-top:6px"><strong>${label}:</strong> ${escMultiline(value)}</div>`)
        .join('');

      return headline + extra;
    }
    case 'validation-test-plan': {
      const a = s.answers.m8;
      if (!a.who.trim() || !a.countsAsYes.trim() || !a.deadline.trim()) return empty;
      // Pulls in the offer name and price already captured in M6/M7, so the plan names what's
      // being tested, not just who and when. Explicitly labeled a plan, not a completed result —
      // this module never fabricates outcomes that haven't actually happened yet.
      const offerName = s.answers.m7.candidates.find((c) => c.trim());
      const price = s.answers.m6.price;
      const offerLine = offerName ? `${esc(offerName)}${price !== null ? ` at $${price}` : ''} — ` : '';
      return `${offerLine}testing with ${escMultiline(a.who)} by ${esc(a.deadline)}. Counts as yes: ${escMultiline(a.countsAsYes)}. (Plan only — not yet run.)`;
    }
    default:
      return empty;
  }
}
