// cover.js — Screen 01. No shell, no nav — this is the product's front door.

import { renderCoverShowcase } from './cover-showcase.js';

export function renderCover({ onStart }) {
  const el = document.createElement('div');
  el.className = 'cover';
  el.innerHTML = `
    <div class="cover-topbar">
      <div class="cover-lockup">
        <div class="cover-mark">DO</div>
        <span class="h3">DigitalOps</span>
      </div>
      <div class="body-sm" style="color:var(--ink-faint)">Skill Library &nbsp; How It Works &nbsp; About</div>
    </div>
    <div class="cover-hero">
      <div class="cover-copy">
        <div class="eyebrow">CREATE / 001</div>
        <h1 class="h1">OFFER<span class="accent">ENGINEERING</span></h1>
        <p class="body cover-sub">A practical interactive system for turning expertise into a structured, marketable digital product offer.</p>
        <div class="cover-chips">
          <div class="cover-chip"><span class="icon">◆</span>Step-by-step framework</div>
          <div class="cover-chip"><span class="icon">◆</span>Interactive exercises</div>
          <div class="cover-chip"><span class="icon">◆</span>AI prompt engine</div>
          <div class="cover-chip"><span class="icon">◆</span>Your Offer Blueprint</div>
        </div>
        <div class="cover-ctas">
          <button class="btn btn-primary" id="start-btn">Start the Guide →</button>
          <button class="btn btn-secondary" id="peek-btn">See what's inside</button>
        </div>
        <div class="eyebrow cover-foot">Turn expertise into offers people want to buy.</div>
      </div>
      <div class="cover-showcase-slot"></div>
    </div>
    <section class="whats-inside" id="whats-inside">
      <div class="wi-item"><h3 class="h3" style="color:var(--gold)">01</h3><p class="body-sm">Eight short modules, each with a lesson, an exercise, and a ready-to-use AI prompt.</p></div>
      <div class="wi-item"><h3 class="h3" style="color:var(--gold)">02</h3><p class="body-sm">Four original DigitalOps frameworks — including the interactive Pull/Drag Map.</p></div>
      <div class="wi-item"><h3 class="h3" style="color:var(--gold)">03</h3><p class="body-sm">No account, no login — your progress saves automatically in this browser.</p></div>
      <div class="wi-item"><h3 class="h3" style="color:var(--gold)">04</h3><p class="body-sm">A finished, exportable Offer Blueprint — the actual product you walk away with.</p></div>
    </section>
  `;
  el.querySelector('.cover-showcase-slot').replaceWith(renderCoverShowcase());

  el.querySelector('#start-btn').addEventListener('click', onStart);
  el.querySelector('#peek-btn').addEventListener('click', () => {
    el.querySelector('#whats-inside').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  return el;
}
