// progress-indicator.js — the persistent top bar shown in the topbar on every app screen.

import * as state from '../state.js';
import { MODULE_TITLES } from '../navigation.js';

export function renderProgressIndicator({ content, state: s, activeModule, variant }) {
  const el = document.createElement('div');
  el.className = 'top-progress';
  el.id = 'top-progress';
  const pct = state.progressPercent(s);
  const mod = activeModule ? content[activeModule] : null;
  const label = mod ? `Module ${mod.code} of 08 · ${MODULE_TITLES[activeModule]}` : 'Offer Engineering';
  el.innerHTML = `
    <div class="top-progress-row">
      <span class="body-sm label">${label}</span>
      <span class="label pct">${pct}% complete</span>
    </div>
    <div class="top-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Offer Blueprint completion">
      <span class="top-progress-fill" style="width:${pct}%"></span>
    </div>
  `;
  return el;
}
