// lesson-block.js — Screen 02's reading area. Renders every lesson in the module in
// sequence, each with its own Key Insight callout, plus a small read-only illustration
// of that module's framework where one exists (the interactive version lives on the
// Exercise stage).

import { marketPulseTable, problemTimelineDiagram, pullDragZoneLegend, promiseTypesGrid } from './framework-diagrams.js';

export function renderLessonBlock({ mod }) {
  const wrap = document.createElement('div');
  wrap.className = 'lesson-body';

  mod.lessons.forEach((lesson, i) => {
    const section = document.createElement('div');
    section.style.marginBottom = '32px';
    const heading = mod.lessons.length > 1 ? `<h2 class="h3" style="margin-bottom:4px">${lesson.id} ${lesson.title}</h2>` : `<h2 class="h3" style="margin-bottom:4px">${lesson.title}</h2>`;
    section.innerHTML = `
      ${heading}
      <div class="lesson-meta">⏱ ${lesson.readTime}${lesson.status === 'draft' ? '<span class="draft-flag">Draft — full copy pending Phase 1</span>' : ''}</div>
      ${lesson.body.map((p) => `<p class="body">${p}</p>`).join('')}
    `;
    wrap.appendChild(section);

    if (i === 0) {
      const diagram = buildFrameworkIllustration(mod);
      if (diagram) wrap.appendChild(diagram);
    }

    if (lesson.insight) {
      const callout = document.createElement('div');
      callout.className = 'callout';
      callout.innerHTML = `<span class="callout-icon">✦</span><div><div class="label callout-title">Key Insight</div><div class="callout-text">${lesson.insight}</div></div>`;
      wrap.appendChild(callout);
    }
  });

  return wrap;
}

function buildFrameworkIllustration(mod) {
  const box = document.createElement('div');
  box.className = 'card';
  box.style.marginBottom = '24px';

  if (mod.id === 'm1' && mod.signals) { box.innerHTML = marketPulseTable(mod.signals); return box; }
  if (mod.id === 'm2' && mod.stages) { box.innerHTML = problemTimelineDiagram(mod.stages); return box; }
  if (mod.id === 'm3' && mod.zones) { box.innerHTML = pullDragZoneLegend(mod.zones); return box; }
  if (mod.id === 'm4' && mod.promiseTypes) { box.innerHTML = promiseTypesGrid(mod.promiseTypes); return box; }
  return null;
}
