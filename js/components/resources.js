// resources.js — static reference page: a glossary of DigitalOps' own terms, plus the
// reset-progress control (Section 6 of the brief: a clear way to reset, with confirmation).

import { resetProgress } from '../state.js';

const GLOSSARY = [
  ['The Market Pulse Check', 'DigitalOps’ four-signal market-readiness check — Hunger, Wallet, Reach, Momentum.'],
  ['The Problem Timeline', 'Mapping a customer’s problems across three stages — Before, During, After.'],
  ['The Pull/Drag Map', 'A two-axis diagnostic plotting Pull (Outcome Pull + Proof Pull) against Drag (Speed Drag + Effort Drag).'],
  ['DigitalOps Promise Types', 'Three ways to reduce a buyer’s uncertainty — Full Promise, Conditional Promise, Confidence Signal.'],
  ['The Obvious Yes', 'The organizing goal behind Modules 3–6: stack enough Pull and cut enough Drag that saying yes feels obvious.'],
  ['Offer Blueprint', 'The compiled, exportable document of all nine deliverables — the actual product.'],
];

export function renderResources() {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="breadcrumb">Reference</div>
    <h1 id="main-heading" class="h2" style="margin-bottom:24px">Resources &amp; Glossary</h1>
  `;
  const card = document.createElement('div');
  card.className = 'card';
  GLOSSARY.forEach(([term, def], i) => {
    const row = document.createElement('div');
    row.style.marginBottom = i < GLOSSARY.length - 1 ? '16px' : '0';
    row.style.paddingBottom = i < GLOSSARY.length - 1 ? '16px' : '0';
    row.style.borderBottom = i < GLOSSARY.length - 1 ? '1px solid var(--border)' : 'none';
    row.innerHTML = `<div class="label" style="color:var(--ink);margin-bottom:4px">${term}</div><div class="body-sm" style="color:var(--ink-muted)">${def}</div>`;
    card.appendChild(row);
  });
  wrap.appendChild(card);

  const resetZone = document.createElement('div');
  resetZone.className = 'reset-zone';
  resetZone.innerHTML = `
    <h2 class="h3" style="margin-bottom:8px">Reset your progress</h2>
    <p class="body-sm" style="color:var(--ink-muted);margin-bottom:12px">This clears every answer you've entered in this browser. It can't be undone, and progress isn't saved anywhere else — there's no account and no cloud sync.</p>
    <button class="btn btn-secondary" id="reset-btn">Reset all progress</button>
    <div id="confirm-area"></div>
  `;
  resetZone.querySelector('#reset-btn').addEventListener('click', () => {
    const area = resetZone.querySelector('#confirm-area');
    if (area.querySelector('.confirm-box')) return;
    const box = document.createElement('div');
    box.className = 'confirm-box';
    box.innerHTML = `
      <p class="body-sm" style="color:var(--ink);margin-bottom:12px"><strong>Are you sure?</strong> All lesson progress, exercise answers, and your Offer Blueprint will be permanently deleted from this browser.</p>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary" id="cancel-reset">Cancel</button>
        <button class="btn btn-primary" id="confirm-reset" style="background:var(--warning)">Yes, reset everything</button>
      </div>
    `;
    area.appendChild(box);
    box.querySelector('#cancel-reset').addEventListener('click', () => box.remove());
    box.querySelector('#confirm-reset').addEventListener('click', () => {
      resetProgress();
      window.location.hash = '#/';
    });
  });
  wrap.appendChild(resetZone);

  return wrap;
}
