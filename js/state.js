// state.js — single source of truth for every customer answer, plus the computed
// values (deliverable completion, progress %, Pull/Drag position) the UI reads.
// Nothing outside this file writes to localStorage directly — see storage.js.

import { loadState, saveState, clearState as clearPersisted, isStorageAvailable } from './storage.js';

const MODULE_IDS = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];

// m5 (Define Your Unique Value Proposition) has no deliverable of its own by design —
// its UVP fields fold into the existing "offer-name-positioning" deliverable (see Part 6
// of the M5 integration brief) rather than adding a tenth Blueprint entry. Its own
// completion is tracked separately in moduleStatus() below.
const DELIVERABLES = [
  { id: 'target-customer-profile', label: 'Target Customer Profile', module: 'm1' },
  { id: 'problem-inventory', label: 'Problem Inventory', module: 'm2' },
  { id: 'outcome-statement', label: 'Outcome Statement', module: 'm3' },
  { id: 'product-concept', label: 'Product Concept', module: 'm3' },
  { id: 'offer-stack', label: 'Offer Stack', module: 'm4' },
  { id: 'promise', label: 'Promise', module: 'm4' },
  { id: 'pricing-hypothesis', label: 'Pricing Hypothesis', module: 'm6' },
  { id: 'offer-name-positioning', label: 'Offer Name & Positioning Statement', module: 'm7' },
  { id: 'validation-test-plan', label: 'Validation Test Plan', module: 'm8' },
];

function defaultAnswers() {
  return {
    m0: { path: null },
    m1: { markets: [emptyMarket()] },
    m2: { before: [], during: [], after: [] },
    m3: { outcomeStatement: '', outcomePull: null, proofPull: null, speedDrag: null, effortDrag: null },
    m4: { coreDeliverable: '', bonuses: [], promiseType: null, promiseStatement: '' },
    m5: { mainAlternative: '', alternativeLimitation: '', yourDifference: '', whyCustomersCare: '', uvpStatement: '' },
    m6: { anchorPrice: null, price: null },
    m7: { candidates: ['', '', ''], positioning: { who: '', format: '', outcome: '', obstacle: '' } },
    m8: { who: '', countsAsYes: '', deadline: '' },
  };
}
function emptyMarket() { return { name: '', hunger: null, wallet: null, reach: null, momentum: null }; }
function emptyBonus() { return { problem: '', name: '', note: '' }; }

function defaultState() {
  return {
    answers: defaultAnswers(),
    nav: { lastModule: 'm0', lastStage: 'lesson', promptPlatform: 'chatgpt' },
    meta: { startedAt: new Date().toISOString() },
  };
}

// ---- internal store ----
let state; // assigned just below, once the validation helpers it relies on have been defined
const listeners = new Set();
let saveTimer = null;
let dirty = false;

function hydrate() {
  try {
    const saved = loadState();
    if (!saved || typeof saved !== 'object') return defaultState();
    return sanitizeState(saved);
  } catch (e) {
    // Anything unexpected in a saved file must never take the app down — start from a clean,
    // usable state instead. (storage.js has already kept a backup copy of unusable saves.)
    console.warn('[DigitalOps] Saved progress was unusable; starting with a fresh state.', e);
    return defaultState();
  }
}

// ---- validation of saved data ----
// A save is untrusted input: it may be from an older version, hand-edited, truncated, or
// written by another script on the same origin. Every field is coerced to its expected type
// and falls back to the default only where the saved value is unusable — valid answers next to
// a broken field are kept. Merging over defaults also means a field added in a later version
// can't crash an old save.
const PROMISE_TYPES = ['full', 'conditional', 'confidence'];
const STAGE_IDS = ['lesson', 'exercise', 'prompt', 'deliverable'];
const PLATFORM_IDS = ['chatgpt', 'claude', 'gemini'];
const MAX_TEXT = 20000;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, d = '') => (typeof v === 'string' ? v.slice(0, MAX_TEXT) : d);
const scale = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(10, Math.max(0, v)) : null);
const strList = (v, max = 50) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, max).map((x) => x.slice(0, MAX_TEXT)) : []);
const oneOf = (v, allowed, d) => (allowed.includes(v) ? v : d);

/** A usable price is a finite, non-negative number; numeric strings (e.g. "1250.50") are accepted. */
export function parsePrice(value) {
  if (value === null || value === undefined || value === '') return null;
  let n = NaN;
  if (typeof value === 'number') n = value;
  else if (typeof value === 'string' && /^\d*\.?\d*$/.test(value.trim()) && /\d/.test(value)) n = Number(value.trim());
  return Number.isFinite(n) && n >= 0 && n <= 1e9 ? n : null;
}

function sanitizeAnswers(raw) {
  const r = isObj(raw) ? raw : {};
  const d = defaultAnswers();
  const m0 = isObj(r.m0) ? r.m0 : {};
  const m1 = isObj(r.m1) ? r.m1 : {};
  const m2 = isObj(r.m2) ? r.m2 : {};
  const m3 = isObj(r.m3) ? r.m3 : {};
  const m4 = isObj(r.m4) ? r.m4 : {};
  const m5 = isObj(r.m5) ? r.m5 : {};
  const m6 = isObj(r.m6) ? r.m6 : {};
  const m7 = isObj(r.m7) ? r.m7 : {};
  const m8 = isObj(r.m8) ? r.m8 : {};

  const markets = (Array.isArray(m1.markets) ? m1.markets : []).filter(isObj).slice(0, 3).map((m) => ({
    name: str(m.name), hunger: scale(m.hunger), wallet: scale(m.wallet), reach: scale(m.reach), momentum: scale(m.momentum),
  }));
  const bonuses = (Array.isArray(m4.bonuses) ? m4.bonuses : []).filter(isObj).slice(0, 5).map((b) => ({
    problem: str(b.problem), name: str(b.name), note: str(b.note),
  }));
  const candidates = Array.isArray(m7.candidates) ? m7.candidates : [];
  const pos = isObj(m7.positioning) ? m7.positioning : {};

  return {
    m0: { path: oneOf(m0.path, ['new', 'existing'], null) },
    m1: { markets: markets.length ? markets : d.m1.markets },
    m2: { before: strList(m2.before), during: strList(m2.during), after: strList(m2.after) },
    m3: {
      outcomeStatement: str(m3.outcomeStatement),
      outcomePull: scale(m3.outcomePull), proofPull: scale(m3.proofPull), speedDrag: scale(m3.speedDrag), effortDrag: scale(m3.effortDrag),
    },
    m4: {
      coreDeliverable: str(m4.coreDeliverable), bonuses,
      promiseType: oneOf(m4.promiseType, PROMISE_TYPES, null), promiseStatement: str(m4.promiseStatement),
    },
    m5: {
      mainAlternative: str(m5.mainAlternative), alternativeLimitation: str(m5.alternativeLimitation),
      yourDifference: str(m5.yourDifference), whyCustomersCare: str(m5.whyCustomersCare), uvpStatement: str(m5.uvpStatement),
    },
    m6: { anchorPrice: parsePrice(m6.anchorPrice), price: parsePrice(m6.price) },
    m7: {
      candidates: [0, 1, 2].map((i) => str(candidates[i])),
      positioning: { who: str(pos.who), format: str(pos.format), outcome: str(pos.outcome), obstacle: str(pos.obstacle) },
    },
    m8: { who: str(m8.who), countsAsYes: str(m8.countsAsYes), deadline: str(m8.deadline).slice(0, 10) },
  };
}

function sanitizeState(saved) {
  const base = defaultState();
  const nav = isObj(saved.nav) ? saved.nav : {};
  const meta = isObj(saved.meta) ? saved.meta : {};
  return {
    answers: sanitizeAnswers(saved.answers),
    nav: {
      lastModule: oneOf(nav.lastModule, MODULE_IDS, base.nav.lastModule),
      lastStage: oneOf(nav.lastStage, STAGE_IDS, base.nav.lastStage),
      promptPlatform: oneOf(nav.promptPlatform, PLATFORM_IDS, base.nav.promptPlatform),
    },
    meta: { startedAt: str(meta.startedAt, base.meta.startedAt) },
  };
}

state = hydrate();

function emit() {
  listeners.forEach((fn) => fn(state));
}

function persist() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    dirty = false;
    const result = saveState(state);
    if (!result.persisted) emit(); // re-render so a storage-unavailable banner can show if the UI wants one
  }, 200);
}

/** Writes any pending debounced save immediately. Safe to call at any time. */
export function flushPendingSave() {
  if (!dirty) return;
  clearTimeout(saveTimer);
  dirty = false;
  saveState(state);
}

// The 200ms debounce could otherwise drop the last keystrokes when a tab is closed, refreshed
// or backgrounded. pagehide covers close/refresh/navigation; visibilitychange covers mobile
// browsers that suspend a hidden tab without firing pagehide.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPendingSave);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushPendingSave(); });
}

function update(mutator) {
  mutator(state);
  persist();
  emit();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function storageIsAvailable() {
  return isStorageAvailable();
}

export function resetProgress() {
  clearTimeout(saveTimer);
  dirty = false; // a pending save of the old answers must not resurrect them after Reset
  clearPersisted();
  state = defaultState();
  emit();
}

// ---- navigation bookkeeping ----
export function setLastVisited(moduleId, stage) {
  update((s) => { s.nav.lastModule = moduleId; s.nav.lastStage = stage; });
}
export function setPromptPlatform(platform) {
  update((s) => { s.nav.promptPlatform = platform; });
}

// ---- M0 ----
export function setPath(path) {
  update((s) => { s.answers.m0.path = path; });
}

// ---- M1 — Market Pulse Check ----
export function addMarket() {
  update((s) => { if (s.answers.m1.markets.length < 3) s.answers.m1.markets.push(emptyMarket()); });
}
export function removeMarket(index) {
  update((s) => { s.answers.m1.markets.splice(index, 1); if (s.answers.m1.markets.length === 0) s.answers.m1.markets.push(emptyMarket()); });
}
export function setMarketField(index, field, value) {
  update((s) => { s.answers.m1.markets[index][field] = value; });
}

// ---- M2 — Problem Timeline ----
export function addProblem(stage) {
  update((s) => { s.answers.m2[stage].push(''); });
}
export function setProblem(stage, index, value) {
  update((s) => { s.answers.m2[stage][index] = value; });
}
export function removeProblem(stage, index) {
  update((s) => { s.answers.m2[stage].splice(index, 1); });
}

// ---- M3 — Pull/Drag Map ----
export function setM3Field(field, value) {
  update((s) => { s.answers.m3[field] = value; });
}

// ---- M4 — Offer Stack / Promise ----
export function setCoreDeliverable(value) {
  update((s) => { s.answers.m4.coreDeliverable = value; });
}
export function addBonus() {
  update((s) => { if (s.answers.m4.bonuses.length < 5) s.answers.m4.bonuses.push(emptyBonus()); });
}
export function setBonusField(index, field, value) {
  update((s) => { s.answers.m4.bonuses[index][field] = value; });
}
export function removeBonus(index) {
  update((s) => { s.answers.m4.bonuses.splice(index, 1); });
}
export function setPromiseType(type) {
  update((s) => { s.answers.m4.promiseType = type; });
}
export function setPromiseStatement(value) {
  update((s) => { s.answers.m4.promiseStatement = value; });
}

// ---- M5 — Unique Value Proposition ----
export function setM5Field(field, value) {
  update((s) => { s.answers.m5[field] = value; });
}

// ---- M6 — Pricing ----
export function setM6Field(field, value) {
  update((s) => { s.answers.m6[field] = parsePrice(value); });
}

// ---- M7 — Naming ----
export function setNameCandidate(index, value) {
  update((s) => { s.answers.m7.candidates[index] = value; });
}
export function setPositioningField(field, value) {
  update((s) => { s.answers.m7.positioning[field] = value; });
}

// ---- M8 — Validation ----
export function setM8Field(field, value) {
  update((s) => { s.answers.m8[field] = value; });
}

// ---- computed ----
export function marketScore(market) {
  const vals = [market.hunger, market.wallet, market.reach, market.momentum];
  if (vals.some((v) => v === null || v === undefined)) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
export function scoreLabel(score) {
  if (score === null) return null;
  if (score >= 7) return { text: 'Strong Opportunity', tone: 'success' };
  if (score >= 4) return { text: 'Worth Refining', tone: 'warning' };
  return { text: 'Needs Work', tone: 'neutral' };
}
export function topMarket(s = state) {
  const scored = s.answers.m1.markets
    .map((m) => ({ m, score: marketScore(m) }))
    .filter((x) => x.score !== null && x.m.name.trim());
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  return scored[0].m;
}

export function pullDragPosition(s = state) {
  const { outcomePull, proofPull, speedDrag, effortDrag } = s.answers.m3;
  const vals = [outcomePull, proofPull, speedDrag, effortDrag];
  if (vals.some((v) => v === null || v === undefined)) return null;
  const pull = (outcomePull + proofPull) / 2;
  const drag = (speedDrag + effortDrag) / 2;
  const zone = pull >= 5 && drag < 5 ? 'magnetic' : pull >= 5 && drag >= 5 ? 'slow-burn' : pull < 5 && drag < 5 ? 'mild-interest' : 'hard-sell';
  return { pull, drag, zone };
}

/** How the proposed price compares with the anchor — or null if it can't be computed.
 *  A higher price is reported as "above anchor", never as a negative discount. */
export function anchorComparison(m6) {
  if (m6.anchorPrice === null || m6.price === null || !(m6.anchorPrice > 0)) return null;
  const pct = Math.round((Math.abs(m6.anchorPrice - m6.price) / m6.anchorPrice) * 100);
  if (pct === 0) return { pct: 0, direction: 'same', text: 'about the same as the anchor' };
  return m6.price < m6.anchorPrice
    ? { pct, direction: 'below', text: `${pct}% below anchor` }
    : { pct, direction: 'above', text: `${pct}% above anchor` };
}

export function deliverableStatus(id, s = state) {
  const a = s.answers;
  switch (id) {
    case 'target-customer-profile':
      return a.m1.markets.some((m) => m.name.trim() && marketScore(m) !== null);
    case 'problem-inventory':
      return a.m2.before.filter((p) => p.trim()).length >= 2
        && a.m2.during.filter((p) => p.trim()).length >= 2
        && a.m2.after.filter((p) => p.trim()).length >= 2;
    case 'outcome-statement':
      return !!a.m3.outcomeStatement.trim();
    case 'product-concept':
      return !!a.m3.outcomeStatement.trim() && pullDragPosition(s) !== null;
    case 'offer-stack':
      return !!a.m4.coreDeliverable.trim();
    case 'promise':
      return !!a.m4.promiseType && !!a.m4.promiseStatement.trim();
    case 'pricing-hypothesis':
      return a.m6.anchorPrice !== null && a.m6.price !== null;
    case 'offer-name-positioning': {
      const p = a.m7.positioning;
      return a.m7.candidates.some((c) => c.trim()) && !!(p.who.trim() && p.format.trim() && p.outcome.trim() && p.obstacle.trim());
    }
    case 'validation-test-plan':
      return !!(a.m8.who.trim() && a.m8.countsAsYes.trim() && a.m8.deadline.trim());
    default:
      return false;
  }
}

export function allDeliverables(s = state) {
  return DELIVERABLES.map((d) => ({ ...d, done: deliverableStatus(d.id, s) }));
}

export function progressPercent(s = state) {
  const done = allDeliverables(s).filter((d) => d.done).length;
  return Math.round((done / DELIVERABLES.length) * 100);
}

// How complete a module's own UVP fields are — m5 owns no Blueprint deliverable (see
// the note above DELIVERABLES), so it needs its own completion check rather than the
// generic DELIVERABLES-derived one below. Without this special case,
// `[].every(Boolean)` on an empty deliverables list would always read as "done".
function uvpCompletion(s = state) {
  const u = s.answers.m5;
  const fields = [u.mainAlternative, u.alternativeLimitation, u.yourDifference, u.whyCustomersCare, u.uvpStatement];
  const filled = fields.filter((v) => v && v.trim()).length;
  return { filled, total: fields.length };
}

export function moduleStatus(moduleId, s = state) {
  if (moduleId === 'm0') return s.answers.m0.path ? 'done' : 'not-started';
  if (moduleId === 'm5') {
    const { filled, total } = uvpCompletion(s);
    if (filled === total) return 'done';
    if (filled > 0) return 'in-progress';
    return 'not-started';
  }
  const ids = DELIVERABLES.filter((d) => d.module === moduleId).map((d) => d.id);
  const statuses = ids.map((id) => deliverableStatus(id, s));
  if (statuses.every(Boolean)) return 'done';
  if (statuses.some(Boolean)) return 'in-progress';
  return 'not-started';
}

export { MODULE_IDS, DELIVERABLES };
