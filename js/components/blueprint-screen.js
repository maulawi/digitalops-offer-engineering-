// blueprint-screen.js — Screen 06, the product's payoff. Compiles all nine
// deliverables from live state; Export as PDF builds a print-only DOM tree
// (see css/print.css) and calls window.print().

import * as state from '../state.js';
import { moduleHash } from '../router.js';
import { summarizeDeliverable } from './deliverable-tracker.js';
import { esc, escMultiline } from '../util.js';

export function renderBlueprintScreen({ content, state: s, onNavigate }) {
  const wrap = document.createElement('div');
  const deliverables = state.allDeliverables(s);
  const doneCount = deliverables.filter((d) => d.done).length;

  wrap.innerHTML = `
    <div class="breadcrumb">Final Output</div>
    <h1 id="main-heading" class="h2" style="margin-bottom:4px">Your Offer Blueprint</h1>
    <p class="body-sm" style="color:var(--ink-muted);margin-bottom:24px">A complete, professional document ready to use. ${doneCount} of ${deliverables.length} complete.</p>
  `;

  const layout = document.createElement('div');
  layout.className = 'blueprint-layout';

  const left = document.createElement('div');
  const trackerCard = document.createElement('div');
  trackerCard.className = 'card';
  deliverables.forEach((d, i) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `tracker-row ${d.done ? 'is-done' : ''}`;
    row.innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${d.label}</span><span class="tracker-check"></span>`;
    row.title = 'Edit this deliverable';
    row.addEventListener('click', () => onNavigate(moduleHash(d.module, 'exercise')));
    trackerCard.appendChild(row);
  });
  left.appendChild(trackerCard);

  const actions = document.createElement('div');
  actions.className = 'blueprint-actions';
  actions.innerHTML = `
    <button class="btn btn-secondary" id="edit-btn">Edit Blueprint</button>
    <button class="btn btn-primary" id="export-btn">⬇ Export as PDF</button>
  `;
  left.appendChild(actions);
  layout.appendChild(left);

  const cover = document.createElement('div');
  cover.className = 'blueprint-cover-preview';
  cover.innerHTML = `
    <div class="bcp-wordmark">DIGITALOPS</div>
    <div class="bcp-title">OFFER<br>BLUEPRINT</div>
    <div class="bcp-tag">TURN EXPERTISE INTO A MARKETABLE OFFER</div>
  `;
  layout.appendChild(cover);

  wrap.appendChild(layout);

  // The actual compiled document (on-screen, full content) — below the summary card.
  const doc = document.createElement('div');
  doc.style.marginTop = '48px';
  doc.appendChild(buildDocSections(s, onNavigate));
  wrap.appendChild(doc);

  wrap.querySelector('#edit-btn').addEventListener('click', () => onNavigate('#/m1/exercise'));
  wrap.querySelector('#export-btn').addEventListener('click', () => exportPdf(s));

  return wrap;
}

function buildDocSections(s, onNavigate) {
  const container = document.createElement('div');
  state.DELIVERABLES.forEach((d, i) => {
    const done = state.deliverableStatus(d.id, s);
    const section = document.createElement('section');
    section.className = 'blueprint-doc-section';
    const text = summarizeDeliverable(d.id, s);
    section.innerHTML = `
      <h3 class="h3">${String(i + 1).padStart(2, '0')} · ${d.label}</h3>
      <p class="body" style="${done ? '' : 'color:var(--ink-faint);font-style:italic'}">${done ? text : 'Not completed yet.'}</p>
      <a class="edit-link" href="${moduleHash(d.module, 'exercise')}">Edit →</a>
    `;
    section.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); onNavigate(moduleHash(d.module, 'exercise')); });
    container.appendChild(section);
  });
  return container;
}

function exportPdf(s) {
  let printRoot = document.getElementById('print-root');
  if (printRoot) printRoot.remove();
  printRoot = document.createElement('div');
  printRoot.id = 'print-root';

  const header = document.createElement('div');
  header.innerHTML = `
    <div class="print-wordmark">DigitalOps · CREATE / 001</div>
    <h1>Offer Blueprint</h1>
    <div class="print-tagline">Generated ${new Date().toLocaleDateString()} · Offer Engineering</div>
  `;
  printRoot.appendChild(header);

  state.DELIVERABLES.forEach((d, i) => {
    const section = document.createElement('section');
    // Keeps the printed document balanced across its two pages: 01–04 on page one,
    // 05–09 on page two (see css/print.css .print-page-break).
    if (d.id === 'offer-stack') section.classList.add('print-page-break');
    section.innerHTML = `<h2>${String(i + 1).padStart(2, '0')} · ${d.label}</h2>${printSectionBody(d.id, s)}`;
    printRoot.appendChild(section);
  });

  document.body.appendChild(printRoot);

  // Browsers suggest document.title as the default filename when the person chooses
  // "Save as PDF" in the print dialog — set it to something sensible for the duration
  // of the print call, then restore the real tab title immediately after.
  const originalTitle = document.title;
  document.title = 'DigitalOps-Offer-Blueprint';
  window.print();
  document.title = originalTitle;

  setTimeout(() => printRoot.remove(), 500);
}

// ---------------------------------------------------------------------------
// PDF-only section formatting. Four deliverables (outcome-statement is left as-is)
// get dedicated, more readable layouts in the exported document than the single-line
// summaries used on-screen (summarizeDeliverable, still used for the other five and
// for the on-screen Blueprint via buildDocSections — neither of those changes here).
// Every value comes from real saved state; nothing here is invented, and any field
// the app never actually collects is shown as "Not provided" rather than guessed at.
const NOT_PROVIDED = '<span class="print-not-provided">Not provided</span>';

function printField(label, value) {
  return `<div class="print-field"><span class="print-field-label">${label}:</span> ${value}</div>`;
}

function formatPrintDate(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function printSectionBody(id, s) {
  const done = state.deliverableStatus(id, s);

  if (id === 'product-concept') {
    if (!done) return `<p class="print-missing">Not completed.</p>`;
    const core = s.answers.m4.coreDeliverable.trim();
    const top = state.topMarket(s);
    const problem = [...s.answers.m2.during, ...s.answers.m2.before, ...s.answers.m2.after].find((p) => p.trim());
    const pos = state.pullDragPosition(s);
    const zoneNames = { magnetic: 'Magnetic', 'slow-burn': 'Slow Burn', 'mild-interest': 'Mild Interest', 'hard-sell': 'Hard Sell' };
    return [
      printField('What it is', core ? escMultiline(core) : NOT_PROVIDED),
      printField('Built for', top ? esc(top.name) : NOT_PROVIDED),
      printField('Addresses', problem ? escMultiline(problem) : NOT_PROVIDED),
      printField('Pull/Drag position', pos ? `${zoneNames[pos.zone]} on the Pull/Drag Map` : NOT_PROVIDED),
    ].join('');
  }

  if (id === 'pricing-hypothesis') {
    if (!done) return `<p class="print-missing">Not completed.</p>`;
    // Only what the app actually collects: the two prices, and how they compare.
    const a = s.answers.m6;
    const cmp = state.anchorComparison(a);
    return [
      printField('Proposed price', `$${a.price}`),
      printField('Comparable anchor', `$${a.anchorPrice}`),
      cmp ? printField('Compared with anchor', cmp.text) : '',
    ].join('');
  }

  if (id === 'validation-test-plan') {
    if (!done) return `<p class="print-missing">Not completed.</p>`;
    const a = s.answers.m8;
    const name = s.answers.m7.candidates.find((c) => c.trim());
    const price = s.answers.m6.price;
    const offerLine = name ? `${esc(name)}${price !== null ? ` at $${price}` : ''}` : NOT_PROVIDED;
    const deadlineText = formatPrintDate(a.deadline);
    const deadline = deadlineText ? esc(deadlineText) : NOT_PROVIDED;
    return [
      printField('Offer being tested', offerLine),
      printField('Target prospects', a.who.trim() ? escMultiline(a.who.trim()) : NOT_PROVIDED),
      printField('What counts as a yes', a.countsAsYes.trim() ? escMultiline(a.countsAsYes.trim()) : NOT_PROVIDED),
      printField('Deadline', deadline),
      printField('Status', 'Planned — not yet tested.'),
    ].join('');
  }

  // Every other deliverable keeps the same summary used on-screen.
  const text = summarizeDeliverable(id, s);
  return `<p class="${done ? '' : 'print-missing'}">${done ? text : 'Not completed.'}</p>`;
}
