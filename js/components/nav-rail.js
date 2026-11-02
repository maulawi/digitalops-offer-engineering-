// nav-rail.js — persistent module tree. Rebuilt on every state change (see app.js),
// so it never holds a focused input; expand/collapse state lives outside the render
// function so it survives those rebuilds.

import { MODULE_IDS } from '../state.js';
import { MODULE_TITLES, STAGES } from '../navigation.js';
import * as state from '../state.js';
import { moduleHash } from '../router.js';

let expanded = new Set(['m0']);
let lastActive = null;

export function renderNavRail({ content, state: s, activeModuleId, route, onNavigate, onShellRefresh }) {
  if (activeModuleId && activeModuleId !== lastActive) {
    expanded = new Set([activeModuleId]);
    lastActive = activeModuleId;
  }

  const nav = document.createElement('nav');
  nav.className = 'sidebar';
  nav.id = 'sidebar';
  nav.setAttribute('aria-label', 'Module navigation');

  const pct = state.progressPercent(s);

  const header = document.createElement('div');
  header.innerHTML = `
    <div class="rail-head">
      <div class="rail-lockup"><div class="cover-mark" style="width:28px;height:28px;font-size:12px">DO</div><span class="rail-wordmark">DigitalOps</span></div>
      <button class="rail-close" id="rail-close" aria-label="Close navigation">✕</button>
    </div>
    <div class="rail-product-label">Offer Engineering</div>
    <div>
      <div class="rail-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Overall progress">
        <span class="rail-progress-fill" style="width:${pct}%"></span>
      </div>
      <div class="rail-progress-label">${pct}% complete</div>
    </div>
  `;
  nav.appendChild(header);

  const tree = document.createElement('div');
  tree.className = 'tree';
  MODULE_IDS.forEach((id) => tree.appendChild(buildModuleRow(id, content[id], s, activeModuleId, route, onNavigate, onShellRefresh)));
  nav.appendChild(tree);

  const extra = document.createElement('div');
  extra.className = 'tree';
  extra.style.marginTop = '4px';
  extra.style.paddingTop = '8px';
  extra.style.borderTop = '1px solid var(--border)';
  const bpDone = state.allDeliverables(s).every((d) => d.done);
  extra.innerHTML = `
    <a class="mod-row ${route.name === 'blueprint' ? 'is-active' : ''}" href="#/blueprint">
      <span class="num">${bpDone ? '✓' : '◆'}</span><span class="title" style="${route.name === 'blueprint' ? 'color:var(--gold)' : ''}">Offer Blueprint</span>
    </a>
    <a class="mod-row ${route.name === 'resources' ? 'is-active' : ''}" href="#/resources">
      <span class="num">ℹ</span><span class="title" style="${route.name === 'resources' ? 'color:var(--gold)' : ''}">Resources / Glossary</span>
    </a>
  `;
  nav.appendChild(extra);

  const foot = document.createElement('div');
  foot.className = 'rail-foot';
  foot.innerHTML = `<a href="#/">← Back to Cover</a>`;
  nav.appendChild(foot);

  nav.querySelector('#rail-close').addEventListener('click', () => window.__closeDrawer && window.__closeDrawer());
  nav.querySelectorAll('a[href]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate(a.getAttribute('href'));
    });
  });

  return nav;
}

function buildModuleRow(id, mod, s, activeModuleId, route, onNavigate, onShellRefresh) {
  const wrap = document.createElement('div');
  wrap.className = 'mod';
  const status = state.moduleStatus(id, s);
  const isActive = id === activeModuleId;
  const isExpanded = expanded.has(id);

  const row = document.createElement('button');
  row.type = 'button';
  row.className = `mod-row ${status === 'done' ? 'is-done' : ''} ${isActive ? 'is-active' : ''}`;
  row.setAttribute('aria-expanded', String(isExpanded));
  row.innerHTML = `
    <span class="num">${mod.code}</span>
    <span class="title">${MODULE_TITLES[id]}</span>
    ${status === 'done' ? '<span class="check">✓</span>' : `<span class="chev">›</span>`}
  `;
  row.addEventListener('click', () => {
    if (id !== activeModuleId) { onNavigate(moduleHash(id)); return; }
    if (isExpanded) expanded.delete(id); else expanded.add(id);
    onShellRefresh();
  });
  wrap.appendChild(row);

  if (isExpanded && id !== 'm0' && mod.lessons && mod.lessons.length) {
    const lessons = document.createElement('div');
    lessons.className = 'lessons';
    mod.lessons.forEach((lesson) => {
      const isCurrent = isActive && route.stage === 'lesson' && route.name === 'module';
      const a = document.createElement('button');
      a.type = 'button';
      a.className = `lesson-row ${isCurrent ? 'is-current' : ''}`;
      a.textContent = `${lesson.id} ${lesson.title}`;
      a.addEventListener('click', () => onNavigate(moduleHash(id, 'lesson')));
      lessons.appendChild(a);
    });
    wrap.appendChild(lessons);
  }
  return wrap;
}
