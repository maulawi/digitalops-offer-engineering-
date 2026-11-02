// exercise-fields.js — Screen 04. One renderer per exercise type. Text/slider inputs
// update state directly (no full rebuild, so focus is never lost); row add/remove and
// selections call ctx.rerenderMain() since those genuinely restructure the screen.

import * as state from '../state.js';
import { esc } from '../util.js';
import { pullDragMapSvg, updatePullDragMarker, pullDragZoneReadoutText } from './framework-diagrams.js';

export function renderExerciseFields(ctx) {
  const { mod } = ctx;
  const type = mod.exercise.type;
  const el = document.createElement('div');
  el.className = 'card';
  const instructions = document.createElement('p');
  instructions.className = 'body-sm';
  instructions.style.color = 'var(--ink-muted)';
  instructions.style.marginBottom = '20px';
  instructions.textContent = mod.exercise.instructions;
  el.appendChild(instructions);

  const builders = {
    diagnostic: buildDiagnostic,
    'market-pulse': buildMarketPulse,
    'problem-timeline': buildProblemTimeline,
    'pull-drag': buildPullDrag,
    'offer-stack': buildOfferStack,
    uvp: buildUVP,
    pricing: buildPricing,
    naming: buildNaming,
    validation: buildValidation,
  };
  const builder = builders[type];
  if (builder) el.appendChild(builder(ctx));
  linkFieldLabels(el, mod.id);
  return el;
}

// Gives every `.field` block's visible <label> a real for/id link to its control (and ties the hint
// text to it via aria-describedby), so screen readers announce "Core deliverable", not just "edit text".
// Controls that already carry an explicit aria-label (rows of repeated inputs) are left as they are.
function linkFieldLabels(root, prefix) {
  root.querySelectorAll('.field').forEach((field, i) => {
    const label = field.querySelector('label');
    const control = field.querySelector('input, textarea, select');
    if (!label || !control) return;
    if (!control.id) control.id = `${prefix}-field-${i}`;
    if (!label.htmlFor) label.htmlFor = control.id;
    const hint = field.querySelector('.field-hint');
    if (hint) {
      if (!hint.id) hint.id = `${control.id}-hint`;
      control.setAttribute('aria-describedby', hint.id);
    }
  });
}

// ---------------------------------------------------------------- M0
function buildDiagnostic(ctx) {
  const { mod, state: s, rerenderMain } = ctx;
  const wrap = document.createElement('div');
  mod.exercise.options.forEach((opt) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'promise-type-card';
    card.style.width = '100%';
    card.style.marginBottom = '10px';
    card.style.cursor = 'pointer';
    if (s.answers.m0.path === opt.value) card.classList.add('is-selected');
    card.innerHTML = `<div class="pt-label">${opt.label}</div><div class="pt-purpose">${opt.hint}</div>`;
    card.addEventListener('click', () => { state.setPath(opt.value); rerenderMain(); });
    wrap.appendChild(card);
  });
  return wrap;
}

// ---------------------------------------------------------------- M1
function buildMarketPulse(ctx) {
  const { mod, state: s, rerenderMain } = ctx;
  const wrap = document.createElement('div');
  s.answers.m1.markets.forEach((market, i) => {
    const row = document.createElement('div');
    row.className = 'market-option';
    const score = state.marketScore(market);
    const scoreLabel = state.scoreLabel(score);
    row.innerHTML = `
      <div class="market-option-head">
        <span class="label">Market option ${i + 1}</span>
        ${s.answers.m1.markets.length > 1 ? '<button type="button" class="remove-link" data-remove aria-label="Remove market option ' + (i + 1) + '">Remove</button>' : ''}
      </div>
      <div class="field"><input type="text" aria-label="Market option ${i + 1}: name" placeholder="e.g. Freelancers who want to automate invoicing" value="${escAttr(market.name)}" data-field="name"></div>
      ${mod.signals.map((sig) => `
        <div class="slider-row">
          <div class="s-meta"><div class="s-label">${sig.label}</div><div class="s-q">${sig.question}</div></div>
          <input type="range" min="0" max="10" value="${market[sig.id] ?? 5}" data-field="${sig.id}" aria-label="Market option ${i + 1}: ${esc(sig.label)}, 0 to 10">
          <span class="s-val" data-readout="${sig.id}">${market[sig.id] ?? '—'}</span>
        </div>`).join('')}
      <div class="score-row" data-score-row>
        ${score === null
          ? '<span class="score-empty">Score appears once you rate all four</span>'
          : `<span class="score-value">${score.toFixed(1)}<small> / 10</small></span><span class="badge badge-${scoreLabel.tone === 'success' ? 'success' : scoreLabel.tone === 'warning' ? 'warning' : 'neutral'}">${scoreLabel.text}</span>`}
      </div>
    `;

    row.querySelector('[data-field="name"]').addEventListener('input', (e) => state.setMarketField(i, 'name', e.target.value));
    mod.signals.forEach((sig) => {
      const input = row.querySelector(`input[data-field="${sig.id}"]`);
      const readout = row.querySelector(`[data-readout="${sig.id}"]`);
      input.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        state.setMarketField(i, sig.id, val);
        readout.textContent = String(val);
        updateMarketScoreRow(row, state.getState().answers.m1.markets[i]);
      });
    });
    const removeBtn = row.querySelector('[data-remove]');
    if (removeBtn) removeBtn.addEventListener('click', () => { state.removeMarket(i); rerenderMain(); });

    wrap.appendChild(row);
  });

  if (s.answers.m1.markets.length < mod.exercise.maxOptions) {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-row-btn';
    addBtn.textContent = '+ Add another market option';
    addBtn.addEventListener('click', () => { state.addMarket(); rerenderMain(); });
    wrap.appendChild(addBtn);
  }
  return wrap;
}

function updateMarketScoreRow(rowEl, market) {
  const score = state.marketScore(market);
  const label = state.scoreLabel(score);
  const scoreRow = rowEl.querySelector('[data-score-row]');
  scoreRow.innerHTML = score === null
    ? '<span class="score-empty">Score appears once you rate all four</span>'
    : `<span class="score-value">${score.toFixed(1)}<small> / 10</small></span><span class="badge badge-${label.tone === 'success' ? 'success' : label.tone === 'warning' ? 'warning' : 'neutral'}">${label.text}</span>`;
}

// ---------------------------------------------------------------- M2
function buildProblemTimeline(ctx) {
  const { mod, state: s, rerenderMain } = ctx;
  const wrap = document.createElement('div');
  mod.stages.forEach((stage) => {
    const col = document.createElement('div');
    col.className = 'timeline-stage-col';
    const items = s.answers.m2[stage.id];
    col.innerHTML = `<h4 class="label">${stage.label}</h4><div class="stage-q">${stage.question}</div>`;
    const list = document.createElement('div');
    items.forEach((text, i) => {
      const row = document.createElement('div');
      row.className = 'problem-item';
      row.innerHTML = `<input type="text" aria-label="${esc(stage.label)} problem ${i + 1}" placeholder="One sentence a real customer would say" value="${escAttr(text)}"><button type="button" class="remove-link" aria-label="Remove ${esc(stage.label.toLowerCase())} problem ${i + 1}">✕</button>`;
      row.querySelector('input').addEventListener('input', (e) => state.setProblem(stage.id, i, e.target.value));
      row.querySelector('button').addEventListener('click', () => { state.removeProblem(stage.id, i); rerenderMain(); });
      list.appendChild(row);
    });
    col.appendChild(list);
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-row-btn';
    addBtn.textContent = `+ Add a ${stage.label.toLowerCase()} problem`;
    addBtn.addEventListener('click', () => { state.addProblem(stage.id); rerenderMain(); });
    col.appendChild(addBtn);
    if (items.filter((t) => t.trim()).length < mod.exercise.minPerStage) {
      const note = document.createElement('div');
      note.className = 'field-error';
      note.textContent = `Add at least ${mod.exercise.minPerStage} to complete this stage.`;
      col.appendChild(note);
    }
    wrap.appendChild(col);
  });
  return wrap;
}

// ---------------------------------------------------------------- M3
function buildPullDrag(ctx) {
  const { mod, state: s } = ctx;
  const wrap = document.createElement('div');

  const field = document.createElement('div');
  field.className = 'field';
  field.innerHTML = `<label>Your outcome statement</label><textarea placeholder="e.g. A cohesive brand I can hand to any designer or platform without re-explaining myself.">${escHtml(s.answers.m3.outcomeStatement)}</textarea>`;
  field.querySelector('textarea').addEventListener('input', (e) => state.setM3Field('outcomeStatement', e.target.value));
  wrap.appendChild(field);

  const pulldrag = document.createElement('div');
  pulldrag.className = 'pulldrag';
  pulldrag.innerHTML = `
    <div class="pulldrag-sliders">
      ${mod.forces.map((f) => `
        <div class="slider-row">
          <div class="s-meta"><div class="s-label">${f.label}</div><div class="s-q">${f.question}</div></div>
          <input type="range" min="0" max="10" value="${s.answers.m3[f.id] ?? 5}" data-force="${f.id}" aria-label="${f.label}, 0 to 10">
          <span class="s-val" data-readout="${f.id}">${s.answers.m3[f.id] ?? '—'}</span>
        </div>`).join('')}
    </div>
    <div class="pulldrag-map-wrap">
      ${pullDragMapSvg()}
      <div class="pulldrag-zone-readout" data-zone-readout>${pullDragZoneReadoutText(state.pullDragPosition(s))}</div>
    </div>
  `;
  pulldrag.innerHTML += `<div class="pulldrag-disclaimer">${mod.disclaimer}</div>`;
  wrap.appendChild(pulldrag);

  mod.forces.forEach((f) => {
    const input = pulldrag.querySelector(`input[data-force="${f.id}"]`);
    const readout = pulldrag.querySelector(`[data-readout="${f.id}"]`);
    input.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      state.setM3Field(f.id, val);
      readout.textContent = String(val);
      const pos = state.pullDragPosition(state.getState());
      updatePullDragMarker(pulldrag, pos);
      pulldrag.querySelector('[data-zone-readout]').textContent = pullDragZoneReadoutText(pos);
    });
  });

  return wrap;
}

// ---------------------------------------------------------------- M4
function buildOfferStack(ctx) {
  const { mod, state: s, rerenderMain } = ctx;
  const wrap = document.createElement('div');

  const core = document.createElement('div');
  core.className = 'field';
  core.innerHTML = `<label>Core deliverable</label><div class="field-hint">What must the customer receive to reach the outcome from Module 3? A deliverable, not just a feature of one.</div><input type="text" placeholder="e.g. Brand Visual System in a Weekend" value="${escAttr(s.answers.m4.coreDeliverable)}">`;
  core.querySelector('input').addEventListener('input', (e) => state.setCoreDeliverable(e.target.value));
  wrap.appendChild(core);

  const bonusLabel = document.createElement('div');
  bonusLabel.className = 'label';
  bonusLabel.style.margin = '20px 0 4px';
  bonusLabel.textContent = 'Bonuses (match each to a problem from Module 2)';
  wrap.appendChild(bonusLabel);

  const bonusHint = document.createElement('div');
  bonusHint.className = 'field-hint';
  bonusHint.style.marginBottom = '10px';
  bonusHint.textContent = "Pull from the During and After problems your core deliverable doesn't already solve — not every remaining problem needs to become one.";
  wrap.appendChild(bonusHint);

  s.answers.m4.bonuses.forEach((b, i) => {
    const row = document.createElement('div');
    row.className = 'stack-row';
    row.innerHTML = `
      <input type="text" aria-label="Bonus ${i + 1}: problem it solves" placeholder="Problem it solves" value="${escAttr(b.problem)}" data-f="problem">
      <input type="text" aria-label="Bonus ${i + 1}: name" placeholder="Bonus name" value="${escAttr(b.name)}" data-f="name">
      <input type="text" aria-label="Bonus ${i + 1}: one-sentence description" placeholder="One-sentence description" value="${escAttr(b.note)}" data-f="note">
      <button type="button" class="remove-link" aria-label="Remove bonus ${i + 1}">✕</button>
    `;
    ['problem', 'name', 'note'].forEach((f) => row.querySelector(`[data-f="${f}"]`).addEventListener('input', (e) => state.setBonusField(i, f, e.target.value)));
    row.querySelector('button').addEventListener('click', () => { state.removeBonus(i); rerenderMain(); });
    wrap.appendChild(row);
  });
  if (s.answers.m4.bonuses.length < 5) {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-row-btn';
    addBtn.textContent = '+ Add a bonus';
    addBtn.addEventListener('click', () => { state.addBonus(); rerenderMain(); });
    wrap.appendChild(addBtn);
  }

  const promiseLabel = document.createElement('div');
  promiseLabel.className = 'label';
  promiseLabel.style.margin = '24px 0 4px';
  promiseLabel.textContent = 'Promise type';
  wrap.appendChild(promiseLabel);

  const promiseHint = document.createElement('div');
  promiseHint.className = 'field-hint';
  promiseHint.style.marginBottom = '10px';
  promiseHint.textContent = "Choose whichever type fits what you can genuinely commit to — an offer can combine more than one.";
  wrap.appendChild(promiseHint);

  const grid = document.createElement('div');
  grid.className = 'promise-type-grid';
  mod.promiseTypes.forEach((p) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `promise-type-card ${s.answers.m4.promiseType === p.id ? 'is-selected' : ''}`;
    card.innerHTML = `<div class="pt-label">${p.label}</div><div class="pt-purpose">${p.purpose}</div>`;
    card.addEventListener('click', () => { state.setPromiseType(p.id); rerenderMain(); });
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  const promiseField = document.createElement('div');
  promiseField.className = 'field';
  promiseField.innerHTML = `<label>Your promise statement</label><div class="field-hint">Name the fear you identified in Lesson 4.2, state the commitment plainly, and check it matches the offer stack above.</div><textarea placeholder="e.g. Usable logo + palette in 48 hours or it's free.">${escHtml(s.answers.m4.promiseStatement)}</textarea>`;
  promiseField.querySelector('textarea').addEventListener('input', (e) => state.setPromiseStatement(e.target.value));
  wrap.appendChild(promiseField);

  return wrap;
}

// ---------------------------------------------------------------- M5
function buildUVP(ctx) {
  const { state: s } = ctx;
  const wrap = document.createElement('div');
  const u = s.answers.m5;
  wrap.innerHTML = `
    <div class="field">
      <label>Main alternative</label>
      <div class="field-hint">The single closest alternative from your Lesson 5.2 comparison — a competitor, a piece of software, a freelancer, a free resource, or even doing nothing, from the list you started in Module 1.</div>
      <input type="text" placeholder="e.g. A content-planning course covering a similar weekly workflow" value="${escAttr(u.mainAlternative)}" data-f="mainAlternative">
    </div>
    <div class="field">
      <label>Alternative's limitation</label>
      <div class="field-hint">What that alternative doesn't cover, or doesn't do well, for the customer you mapped in Module 1 — not a guess, but something you actually found in your research.</div>
      <textarea placeholder="e.g. Teaches the concepts but has no templates, so I still have to build everything myself" data-f="alternativeLimitation">${escHtml(u.alternativeLimitation)}</textarea>
    </div>
    <div class="field">
      <label>Your meaningful difference</label>
      <div class="field-hint">What your actual offer stack from Module 4 delivers that the alternative above doesn't — something your customer would notice using it, not just a feature you can point to.</div>
      <textarea placeholder="e.g. A complete planning process plus the templates, not one or the other" data-f="yourDifference">${escHtml(u.yourDifference)}</textarea>
    </div>
    <div class="field">
      <label>Why your customer should care</label>
      <div class="field-hint">Connect this back to the main problem from Module 2 and the outcome from Module 3 — why this specific difference matters to this specific customer, not customers in general.</div>
      <textarea placeholder="e.g. They're already juggling five tools — one system that actually finishes the job saves them from stitching the rest together" data-f="whyCustomersCare">${escHtml(u.whyCustomersCare)}</textarea>
    </div>
    <div class="field">
      <label>Your UVP statement</label>
      <div class="field-hint">Use the template from Lesson 5.3 — for [target customer] who need [outcome], [offer] provides [meaningful difference], helping them [benefit] without [limitation, if supported].</div>
      <textarea placeholder="e.g. For small business owners who need a week's worth of social content without starting from a blank page, the 7-Day Content Planner provides a complete planning system..." data-f="uvpStatement">${escHtml(u.uvpStatement)}</textarea>
    </div>
  `;
  wrap.querySelector('[data-f="mainAlternative"]').addEventListener('input', (e) => state.setM5Field('mainAlternative', e.target.value));
  ['alternativeLimitation', 'yourDifference', 'whyCustomersCare', 'uvpStatement'].forEach((f) => {
    wrap.querySelector(`[data-f="${f}"]`).addEventListener('input', (e) => state.setM5Field(f, e.target.value));
  });
  return wrap;
}

// ---------------------------------------------------------------- M6
function buildPricing(ctx) {
  const { state: s } = ctx;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="field">
      <label>Anchor price — what the closest existing alternative costs</label>
      <div class="field-hint">The single most relevant, directly-comparable price from your Lesson 6.1 research log — not an average, and not the cheapest or most expensive thing you found.</div>
      <input type="text" inputmode="decimal" placeholder="e.g. 4000" value="${escAttr(s.answers.m6.anchorPrice ?? '')}" data-f="anchorPrice" maxlength="12">
    </div>
    <div class="field">
      <label>Your price</label>
      <div class="field-hint">Your reasoned starting price from Lesson 6.2 — a hypothesis to test in Module 8, not a final decision.</div>
      <input type="text" inputmode="decimal" placeholder="e.g. 249" value="${escAttr(s.answers.m6.price ?? '')}" data-f="price" maxlength="12">
    </div>
    <div class="score-row" data-discount>${discountText(s.answers.m6)}</div>
    <div class="field-hint" style="margin-top:8px">This percentage is a sanity check against your own anchor, not a recommendation — a number far outside what feels reasonable is worth a second look, but there's no universal "correct" discount.</div>
  `;
  ['anchorPrice', 'price'].forEach((f) => {
    wrap.querySelector(`[data-f="${f}"]`).addEventListener('input', (e) => {
      // Digits and one decimal point only, so a stray "." or "1.2.3" can never become NaN.
      const [whole, ...rest] = e.target.value.replace(/[^0-9.]/g, '').split('.');
      const cleaned = rest.length ? `${whole}.${rest.join('')}` : whole;
      if (cleaned !== e.target.value) e.target.value = cleaned;
      state.setM6Field(f, cleaned);
      wrap.querySelector('[data-discount]').innerHTML = discountText(state.getState().answers.m6);
    });
  });
  return wrap;
}
function discountText(m6) {
  const cmp = state.anchorComparison(m6);
  if (!cmp) return '<span class="score-empty">Comparison to anchor appears once both prices are set</span>';
  const label = cmp.direction === 'same' ? 'About the same as the anchor' : `<span class="score-value">${cmp.pct}%<small> ${cmp.direction} anchor</small></span>`;
  return `${label}<span class="badge badge-neutral">Sanity check, not a recommendation</span>`;
}

// ---------------------------------------------------------------- M7
function buildNaming(ctx) {
  const { state: s } = ctx;
  const wrap = document.createElement('div');

  const candidatesHint = document.createElement('div');
  candidatesHint.className = 'field-hint';
  candidatesHint.style.marginBottom = '10px';
  candidatesHint.textContent = "Try at least one outcome-focused, one audience- or format-focused, and (optionally) one creative name with a subtitle — then compare all three against the five-word test from Lesson 7.1.";
  wrap.appendChild(candidatesHint);

  const NAME_PLACEHOLDERS = ['e.g. The 7-Day Content Planner', 'e.g. Small Business Content Toolkit', 'e.g. ContentFlow: The Weekly Planning System'];
  const candidates = document.createElement('div');
  candidates.className = 'name-candidates';
  s.answers.m7.candidates.forEach((c, i) => {
    const field = document.createElement('div');
    field.className = 'field';
    field.innerHTML = `<label>Name candidate ${i + 1}</label><input type="text" placeholder="${NAME_PLACEHOLDERS[i] || ''}" value="${escAttr(c)}">`;
    field.querySelector('input').addEventListener('input', (e) => state.setNameCandidate(i, e.target.value));
    candidates.appendChild(field);
  });
  wrap.appendChild(candidates);

  const tmplLabel = document.createElement('div');
  tmplLabel.className = 'label';
  tmplLabel.style.margin = '20px 0 4px';
  tmplLabel.textContent = 'Positioning statement';
  wrap.appendChild(tmplLabel);

  const tmplHint = document.createElement('div');
  tmplHint.className = 'field-hint';
  tmplHint.style.marginBottom = '10px';
  tmplHint.textContent = "who = your target customer · format = product type + what makes it work · outcome = the desired result · obstacle = the main problem, framed as what's removed. See Lesson 7.2 for a full worked example.";
  wrap.appendChild(tmplHint);

  const tmpl = document.createElement('div');
  tmpl.className = 'positioning-template';
  const p = s.answers.m7.positioning;
  tmpl.innerHTML = `For <input type="text" data-f="who" aria-label="Positioning statement: who" placeholder="small business owners who struggle to plan consistent social media content" value="${escAttr(p.who)}" size="14">, this offer is the <input type="text" data-f="format" aria-label="Positioning statement: format" placeholder="practical content planning system" value="${escAttr(p.format)}" size="10"> that <input type="text" data-f="outcome" aria-label="Positioning statement: outcome" placeholder="helps them organise a week's worth of posts" value="${escAttr(p.outcome)}" size="18"> without <input type="text" data-f="obstacle" aria-label="Positioning statement: obstacle" placeholder="starting from a blank page every time" value="${escAttr(p.obstacle)}" size="14">.`;
  ['who', 'format', 'outcome', 'obstacle'].forEach((f) => tmpl.querySelector(`[data-f="${f}"]`).addEventListener('input', (e) => state.setPositioningField(f, e.target.value)));
  wrap.appendChild(tmpl);
  return wrap;
}

// ---------------------------------------------------------------- M8
function buildValidation(ctx) {
  const { state: s } = ctx;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="field">
      <label>Who you'll test this on</label>
      <div class="field-hint">Name the specific 3–5 people — matching your Module 1 target customer, not just friends who'll say yes to be supportive. Note the offer, price and commitment you're asking for, and how you'll reach them.</div>
      <textarea placeholder="e.g. Three people in my existing network who fit the profile">${escHtml(s.answers.m8.who)}</textarea>
    </div>
    <div class="field">
      <label>What counts as a real “yes”</label>
      <div class="field-hint">Set this before you contact anyone. A real yes is money or a firm, specific commitment — not "sounds great" or a follow.</div>
      <textarea placeholder="e.g. They pay the real price, or commit to a specific date to start">${escHtml(s.answers.m8.countsAsYes)}</textarea>
    </div>
    <div class="field">
      <label>Deadline</label>
      <div class="field-hint">By when you'll finish outreach and decide whether to proceed, refine, reconsider or retest — a short window (5–7 days) works well as a starting point.</div>
      <input type="date" value="${escAttr(s.answers.m8.deadline)}">
    </div>
  `;
  wrap.querySelectorAll('textarea')[0].addEventListener('input', (e) => state.setM8Field('who', e.target.value));
  wrap.querySelectorAll('textarea')[1].addEventListener('input', (e) => state.setM8Field('countsAsYes', e.target.value));
  wrap.querySelector('input[type="date"]').addEventListener('input', (e) => state.setM8Field('deadline', e.target.value));
  return wrap;
}

// ---------------------------------------------------------------- helpers
const escHtml = esc;
const escAttr = esc;
