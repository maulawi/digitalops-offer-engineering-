// app.js — entry point and render orchestration.
//
// Render model (kept deliberately simple for a vanilla, no-framework app):
//   - #sidebar / #topbar ("the shell") are rebuilt on every state change AND every route
//     change. They never contain a focused text input, so this is always safe.
//   - #content-col ("main content") is rebuilt on every ROUTE change, and otherwise only
//     when a component explicitly asks for it after a structural edit (add/remove a row,
//     pick a promise type). Per-keystroke edits update state WITHOUT rebuilding main
//     content, so a customer never loses focus or cursor position while typing.

import * as state from './state.js';
import { onRouteChange, parseHash, moduleHash, navigate as go } from './router.js';
import { loadAllModules, MODULE_TITLES } from './navigation.js';
import { renderCover } from './components/cover.js';
import { renderNavRail } from './components/nav-rail.js';
import { renderProgressIndicator } from './components/progress-indicator.js';
import { renderLessonBlock } from './components/lesson-block.js';
import { renderExerciseFields } from './components/exercise-fields.js';
import { renderAiPromptBlock } from './components/ai-prompt-block.js';
import { renderDeliverableTracker } from './components/deliverable-tracker.js';
import { renderBlueprintScreen } from './components/blueprint-screen.js';
import { renderResources } from './components/resources.js';

const root = document.getElementById('app-root');
let content = null; // all module content, loaded once
let currentRoute = { name: 'cover' };
let shellMounted = false;
let drawerOpen = false; // survives sidebar being replaced wholesale on every shell re-render

async function boot() {
  try {
    content = await loadAllModules();
  } catch (e) {
    root.innerHTML = `<div style="padding:48px;max-width:560px;margin:0 auto;font-family:var(--font-sans);color:var(--ink)">
      <h1 class="h2">Couldn't load Offer Engineering's content</h1>
      <p class="body" style="color:var(--ink-muted);margin-top:12px">${escapeHtml(String(e.message || e))}</p>
      <p class="body-sm" style="color:var(--ink-faint);margin-top:12px">If you're opening index.html directly from disk, most browsers block module fetches over file:// — run a static server instead (see README.md).</p>
    </div>`;
    return;
  }

  state.subscribe(() => { if (shellMounted) renderShell(currentRoute); });
  onRouteChange((route) => {
    currentRoute = route;
    renderRoute(route);
  });
}

function renderRoute(route) {
  if (route.name === 'cover') {
    shellMounted = false;
    root.innerHTML = '';
    root.appendChild(renderCover({ onStart: () => go('#/m0') }));
    return;
  }

  if (!shellMounted) {
    mountShell();
    shellMounted = true;
  }
  renderShell(route);
  renderMainContent(route);
}

function mountShell() {
  root.innerHTML = `
    <a class="skip-link" href="#main-heading">Skip to content</a>
    <div class="drawer-scrim" id="drawer-scrim"></div>
    <div class="app-shell">
      <nav class="sidebar" id="sidebar" aria-label="Module navigation"></nav>
      <div class="main-col">
        <header class="topbar">
          <button class="menu-toggle btn btn-secondary" id="menu-toggle" aria-label="Open module navigation" aria-expanded="false">☰</button>
          <div class="top-progress" id="top-progress"></div>
        </header>
        <main class="content-col" id="content-col" tabindex="-1"></main>
      </div>
    </div>
  `;
  const scrim = document.getElementById('drawer-scrim');
  const toggle = document.getElementById('menu-toggle');
  // Always re-query #sidebar: renderShell() replaces that node wholesale on every
  // state/route change, so a reference captured once here would go stale.
  function closeDrawer() {
    drawerOpen = false;
    document.getElementById('sidebar').classList.remove('open');
    scrim.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function openDrawer() {
    drawerOpen = true;
    document.getElementById('sidebar').classList.add('open');
    scrim.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  toggle.addEventListener('click', () => (drawerOpen ? closeDrawer() : openDrawer()));
  scrim.addEventListener('click', closeDrawer);
  window.__closeDrawer = closeDrawer; // used by nav-rail link clicks on mobile
}

function renderShell(route) {
  const s = state.getState();
  const activeModule = route.name === 'module' ? route.moduleId : null;
  const newSidebar = renderNavRail({
    content, state: s, activeModuleId: activeModule, route,
    onNavigate: (hash) => { go(hash); if (window.__closeDrawer) window.__closeDrawer(); },
    onShellRefresh: () => renderShell(currentRoute),
  });
  if (drawerOpen) newSidebar.classList.add('open'); // survive a shell rebuild while the mobile drawer is open
  document.getElementById('sidebar').replaceWith(newSidebar);
  document.getElementById('top-progress').replaceWith(renderProgressIndicator({ content, state: s, activeModule, variant: 'top' }));
}

function rerenderMain() { renderMainContent(currentRoute); }

function renderMainContent(route) {
  const el = document.getElementById('content-col');
  el.innerHTML = '';
  el.scrollTop = 0;

  if (route.name === 'resources') {
    el.appendChild(renderResources());
    return;
  }
  if (route.name === 'blueprint') {
    el.appendChild(renderBlueprintScreen({ content, state: state.getState(), onNavigate: go }));
    return;
  }
  if (route.name === 'module') {
    const mod = content[route.moduleId];
    if (!mod) { el.textContent = 'Unknown module.'; return; }

    if (route.moduleId === 'm0') {
      state.setLastVisited('m0', 'lesson');
      const ctx = { mod, content, state: state.getState(), onNavigate: go, rerenderMain };
      el.innerHTML = `<div class="breadcrumb">Module ${mod.code} / Orientation</div><h1 id="main-heading" class="h2" style="margin-bottom:16px">${mod.title}</h1>`;
      el.appendChild(renderLessonBlock(ctx, { hideInsightNav: true }));
      el.appendChild(renderExerciseFields(ctx));
      const foot = document.createElement('div');
      foot.className = 'navfoot';
      foot.innerHTML = `<span></span><a class="btn btn-primary" href="${moduleHash('m1', 'lesson')}">Continue →</a>`;
      el.appendChild(foot);
      return;
    }

    const s = state.getState();
    const stage = route.stage || (s.nav.lastModule === route.moduleId ? s.nav.lastStage : 'lesson');
    state.setLastVisited(route.moduleId, stage);
    el.appendChild(buildModuleHeader(mod, stage));
    el.appendChild(buildStageContent(mod, stage));
  }
}

function buildModuleHeader(mod, stage) {
  const wrap = document.createElement('div');
  const stageLabels = { lesson: 'Lesson', exercise: 'Exercise', prompt: 'AI Prompt', deliverable: 'Deliverable' };
  wrap.innerHTML = `
    <div class="breadcrumb">Module ${mod.code} / ${stageLabels[stage]}</div>
    <h1 id="main-heading" class="h2" style="margin-bottom:${mod.number === 0 ? '16px' : '8px'}">${mod.title}</h1>
    ${mod.framework ? `<div class="body-sm" style="color:var(--ink-faint);margin-bottom:16px">Framework: ${mod.framework}</div>` : ''}
    ${mod.number > 0 ? buildStepper(mod, stage) : ''}
  `;
  return wrap;
}

function buildStepper(mod, currentStage) {
  const stages = [
    ['lesson', 'Lesson'], ['exercise', 'Exercise'], ['prompt', 'AI Prompt'], ['deliverable', 'Deliverable'],
  ];
  const order = ['lesson', 'exercise', 'prompt', 'deliverable'];
  const currentIdx = order.indexOf(currentStage);
  return `<div class="lesson-stepper" role="tablist" aria-label="Module steps">${stages
    .map(([id, label], i) => {
      const cls = id === currentStage ? 'is-active' : i < currentIdx ? 'is-done' : '';
      return `<a class="step-pill ${cls}" role="tab" aria-selected="${id === currentStage}" href="${moduleHash(mod.id, id)}">${label}</a>`;
    })
    .join('')}</div>`;
}

function buildStageContent(mod, stage) {
  const ctx = { mod, content, state: state.getState(), onNavigate: go, rerenderMain };
  const wrap = document.createElement('div');
  if (stage === 'lesson') wrap.appendChild(renderLessonBlock(ctx));
  else if (stage === 'exercise') wrap.appendChild(renderExerciseFields(ctx));
  else if (stage === 'prompt') wrap.appendChild(renderAiPromptBlock(ctx));
  else if (stage === 'deliverable') wrap.appendChild(renderDeliverableTracker({ ...ctx, variant: 'module-snapshot' }));
  wrap.appendChild(buildNavFoot(mod, stage));
  return wrap;
}

function buildNavFoot(mod, stage) {
  const order = ['lesson', 'exercise', 'prompt', 'deliverable'];
  const i = order.indexOf(stage);
  const foot = document.createElement('div');
  foot.className = 'navfoot';

  const prevHref = i > 0 ? moduleHash(mod.id, order[i - 1]) : (mod.number > 0 ? moduleHash(`m${mod.number - 1}`, 'deliverable') : null);
  const isLastOfAll = mod.number === state.MODULE_IDS.length - 1 && stage === 'deliverable';
  const nextHref = i < order.length - 1 ? moduleHash(mod.id, order[i + 1]) : isLastOfAll ? '#/blueprint' : moduleHash(`m${mod.number + 1}`, 'lesson');

  foot.innerHTML = `
    ${prevHref ? `<a class="btn btn-secondary" href="${prevHref}">← Previous</a>` : '<span></span>'}
    <a class="btn btn-primary" href="${nextHref}">${isLastOfAll ? 'View Your Offer Blueprint →' : 'Continue →'}</a>
  `;
  return foot;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

boot();
