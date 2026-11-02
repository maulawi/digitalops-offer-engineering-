// cover-showcase.js — the eight-module holographic showcase that fills the cover's
// right-hand hero panel (previously an empty .cover-visual div). Purely a visual
// representation of the eight real Offer Engineering modules; no new product
// features or content are introduced here, and the module titles/descriptions below
// are the same ones used throughout the app.

const STAGES = [
  {
    n: '01',
    title: 'Find Your Primed Market',
    desc: 'Identify where your expertise meets real demand.',
    icon: `<circle cx="19" cy="19" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
           <line x1="26.5" y1="26.5" x2="37" y2="37" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <circle cx="19" cy="19" r="2.2" fill="currentColor"/>`,
  },
  {
    n: '02',
    title: 'Map the Problem',
    desc: 'Understand the real problems your audience wants to solve.',
    icon: `<path d="M8 10h32v20H21l-7 6v-6H8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
           <line x1="24" y1="16" x2="24" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           <circle cx="24" cy="27.2" r="1.4" fill="currentColor"/>`,
  },
  {
    n: '03',
    title: 'Engineer the Value',
    desc: 'Turn problems into clear, desirable outcomes.',
    icon: `<path d="M12 18L24 7l12 11-12 23z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
           <path d="M12 18h24M19 18l5 23 5-23" stroke="currentColor" stroke-width="1" opacity="0.55"/>`,
  },
  {
    n: '04',
    title: 'Build the Offer Stack',
    desc: 'Design your core product and strategic bonuses.',
    icon: `<rect x="15" y="7" width="18" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
           <rect x="10" y="19" width="28" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
           <rect x="15" y="31" width="18" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>`,
  },
  {
    n: '05',
    title: 'Define Your Unique Value Proposition',
    desc: 'Give the right customer a meaningful reason to choose you.',
    icon: `<circle cx="12" cy="31" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
           <circle cx="25" cy="31" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
           <circle cx="37" cy="15" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/>
           <path d="M37 10l1.7 3.5 3.8.5-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.5z" fill="currentColor"/>`,
  },
  {
    n: '06',
    title: 'Price It Like You Mean It',
    desc: 'Set a price that reflects the value you deliver.',
    icon: `<ellipse cx="22" cy="33" rx="11" ry="4" fill="none" stroke="currentColor" stroke-width="2"/>
           <ellipse cx="22" cy="28" rx="11" ry="4" fill="none" stroke="currentColor" stroke-width="2"/>
           <ellipse cx="22" cy="23" rx="11" ry="4" fill="none" stroke="currentColor" stroke-width="2"/>
           <path d="M26 14l6-6 4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M32 8v7h-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    n: '07',
    title: 'Name & Position It',
    desc: 'Create a clear product name and positioning statement.',
    icon: `<path d="M26 8h10a2 2 0 012 2v10L19 39 7 27 26 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
           <circle cx="32.3" cy="14.3" r="2.1" fill="currentColor"/>`,
  },
  {
    n: '08',
    title: 'Validate Before You Build',
    desc: 'Test your offer with real people before investing significant time.',
    icon: `<rect x="11" y="9" width="26" height="32" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
           <rect x="17" y="6" width="14" height="6" rx="1.6" fill="none" stroke="currentColor" stroke-width="2"/>
           <path d="M16.5 20.5l3 3 7-8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
           <path d="M16.5 31.5l3 3 7-8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
];

export function renderCoverShowcase() {
  const el = document.createElement('div');
  el.className = 'cover-showcase';
  el.setAttribute('aria-hidden', 'true'); // decorative echo of real nav links elsewhere on the page

  const rows = STAGES.map((stage, i) => {
    const row = `
      <div class="showcase-stage" style="transition-delay:${i * 90}ms">
        <div class="stage-platform">
          <span class="platform-ring"></span>
          <span class="platform-disc"></span>
          <svg class="stage-icon" viewBox="0 0 48 48" style="animation-delay:${i * 0.35}s">${stage.icon}</svg>
        </div>
        <div class="stage-text">
          <div class="stage-num">${stage.n}</div>
          <div class="stage-title">${stage.title}</div>
          <div class="stage-desc">${stage.desc}</div>
        </div>
      </div>`;
    const connector = i < STAGES.length - 1
      ? `<div class="showcase-connector" style="transition-delay:${i * 90 + 60}ms"><span class="connector-line"></span></div>`
      : '';
    return row + connector;
  }).join('');

  el.innerHTML = `
    <div class="showcase-frame">
      <div class="showcase-head">
        <span class="showcase-badge">8 MODULES</span>
      </div>
      ${rows}
    </div>
  `;

  // Trigger the progressive reveal on the next frame so the initial (hidden) state
  // actually paints first and the CSS transition runs. A no-op under
  // prefers-reduced-motion, since that media query removes the hidden state entirely.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('is-visible'));
  });

  return el;
}
