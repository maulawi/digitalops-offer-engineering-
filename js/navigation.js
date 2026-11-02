// navigation.js — module order, content loading/caching, and prev/next sequencing.

import { MODULE_IDS } from './state.js';

export const MODULE_TITLES = {
  m0: 'Orientation',
  m1: 'Find Your Primed Market',
  m2: 'Map the Problem',
  m3: 'Engineer the Value',
  m4: 'Build the Offer Stack',
  m5: 'Define Your Unique Value Proposition',
  m6: 'Price It Like You Mean It',
  m7: 'Name & Position It',
  m8: 'Validate Before You Build',
};

export const STAGES = ['lesson', 'exercise', 'prompt', 'deliverable'];

const cache = new Map();

export async function loadModuleContent(moduleId) {
  if (cache.has(moduleId)) return cache.get(moduleId);
  const res = await fetch(`content/${moduleId}.json`);
  if (!res.ok) throw new Error(`Could not load content for ${moduleId}`);
  const json = await res.json();
  cache.set(moduleId, json);
  return json;
}

export async function loadAllModules() {
  const all = await Promise.all(MODULE_IDS.map(loadModuleContent));
  return Object.fromEntries(MODULE_IDS.map((id, i) => [id, all[i]]));
}

export function nextModule(moduleId) {
  const i = MODULE_IDS.indexOf(moduleId);
  return i >= 0 && i < MODULE_IDS.length - 1 ? MODULE_IDS[i + 1] : null;
}
export function prevModule(moduleId) {
  const i = MODULE_IDS.indexOf(moduleId);
  return i > 0 ? MODULE_IDS[i - 1] : null;
}

/** Returns { moduleId, stage } for the next step, crossing module boundaries,
 *  or null if this is the very last step (the final module's deliverable). */
export function nextStep(moduleId, stage) {
  const si = STAGES.indexOf(stage);
  if (moduleId === 'm0') return { moduleId: 'm1', stage: 'lesson' };
  if (si < STAGES.length - 1) return { moduleId, stage: STAGES[si + 1] };
  const next = nextModule(moduleId);
  return next ? { moduleId: next, stage: 'lesson' } : null; // null => route to Blueprint
}

export function prevStep(moduleId, stage) {
  const si = STAGES.indexOf(stage);
  if (moduleId === 'm0') return null;
  if (si > 0) return { moduleId, stage: STAGES[si - 1] };
  const prev = prevModule(moduleId);
  if (!prev) return null;
  return prev === 'm0' ? { moduleId: 'm0', stage: 'lesson' } : { moduleId: prev, stage: 'deliverable' };
}
