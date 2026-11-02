// ai-prompt-block.js — Screen 05. Assembles the module's approved prompt template with
// the customer's own prior answers, across three platform tabs that never change the
// prompt text itself (see the Design System's AIPromptBlock guidelines).

import * as state from '../state.js';
import { setPromptPlatform } from '../state.js';

const PLATFORMS = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'gemini', label: 'Gemini' },
];

export function renderAiPromptBlock(ctx) {
  const { mod, state: s } = ctx;
  // Most modules define a single `prompt` object; a module may instead define `prompts`
  // (an array) when it needs more than one — M1 is the first case (a discovery prompt
  // alongside the market-evaluation prompt). Both shapes render through the same path
  // below, sharing one platform-tab selector since the prompt text never varies by platform.
  const prompts = mod.prompts || (mod.prompt ? [mod.prompt] : []);

  const wrap = document.createElement('div');
  if (!prompts.length) return wrap;

  const tabs = document.createElement('div');
  tabs.className = 'prompt-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.style.marginBottom = '20px';
  PLATFORMS.forEach((p) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `prompt-tab ${s.nav.promptPlatform === p.id ? 'is-active' : ''}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(s.nav.promptPlatform === p.id));
    tab.textContent = p.label;
    tab.addEventListener('click', () => {
      setPromptPlatform(p.id);
      tabs.querySelectorAll('.prompt-tab').forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
    });
    tabs.appendChild(tab);
  });
  wrap.appendChild(tabs);

  prompts.forEach((prompt, i) => {
    const card = buildPromptCard(prompt, s);
    if (i < prompts.length - 1) card.style.marginBottom = '20px';
    wrap.appendChild(card);
  });

  return wrap;
}

function buildPromptCard(prompt, s) {
  const el = document.createElement('div');
  el.className = 'card prompt-card';

  const head = document.createElement('div');
  head.innerHTML = `<div class="prompt-name">${prompt.title}</div><div class="prompt-purpose">${prompt.purpose}</div>`;
  el.appendChild(head);

  const howto = document.createElement('div');
  howto.className = 'prompt-howto';
  howto.innerHTML = '<span class="howto-icon" aria-hidden="true">ⓘ</span><span><strong>How to use:</strong> Copy this prompt and paste it into your preferred AI assistant — ChatGPT, Claude or Gemini — to get started.</span>';
  el.appendChild(howto);

  const { html, plain, missingCount } = assemblePrompt(prompt.template, s);

  const body = document.createElement('div');
  body.className = 'prompt-body';
  body.innerHTML = html;
  el.appendChild(body);

  if (missingCount > 0) {
    const warn = document.createElement('div');
    warn.className = 'field-error';
    warn.style.marginTop = '12px';
    warn.textContent = `${missingCount} field${missingCount > 1 ? 's' : ''} from an earlier module ${missingCount > 1 ? "aren't" : "isn't"} filled in yet — the prompt still works, but the AI will have less to go on.`;
    el.appendChild(warn);
  }

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'btn btn-primary btn-block copy-btn';
  copyBtn.setAttribute('aria-live', 'polite'); // set up front so the "Copied" change is announced
  copyBtn.innerHTML = '⧉ Copy Prompt';
  copyBtn.addEventListener('click', async () => {
    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(plain); copied = true; } catch (e) { /* fall through to execCommand */ }
    }
    if (!copied) copied = fallbackCopy(plain);
    if (copied) {
      copyBtn.textContent = '✓ Copied';
      copyBtn.classList.add('is-copied');
    } else {
      copyBtn.textContent = 'Select the text above to copy';
    }
    setTimeout(() => { copyBtn.textContent = '⧉ Copy Prompt'; copyBtn.classList.remove('is-copied'); }, 1600);
  });
  el.appendChild(copyBtn);

  return el;
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

function resolveContext(s) {
  const before = s.answers.m2.before.filter((p) => p.trim());
  const during = s.answers.m2.during.filter((p) => p.trim());
  const after = s.answers.m2.after.filter((p) => p.trim());
  const top = state.topMarket(s);
  const marketNames = s.answers.m1.markets.map((m) => m.name).filter(Boolean).join(', ');
  const bonuses = s.answers.m4.bonuses.filter((b) => b.name.trim()).map((b) => b.name).join(', ');
  const topName = s.answers.m7.candidates.find((c) => c.trim());

  return {
    'm0.path': s.answers.m0.path === 'new' ? 'a skill with no offer yet' : s.answers.m0.path === 'existing' ? 'an existing offer, being re-examined' : null,
    'm1.marketNames': marketNames || null,
    'm1.topMarket': top ? top.name : null,
    'm2.summary': (before.length || during.length || after.length)
      ? `Before: ${before[0] || '—'}. During: ${during[0] || '—'}. After: ${after[0] || '—'}.`
      : null,
    'm3.outcomeStatement': s.answers.m3.outcomeStatement.trim() || null,
    'm4.coreDeliverable': s.answers.m4.coreDeliverable.trim() || null,
    'm4.summary': s.answers.m4.coreDeliverable.trim() ? `${s.answers.m4.coreDeliverable}${bonuses ? ' + ' + bonuses : ''}` : null,
    'm5.mainAlternative': s.answers.m5.mainAlternative.trim() || null,
    'm5.alternativeLimitation': s.answers.m5.alternativeLimitation.trim() || null,
    'm5.yourDifference': s.answers.m5.yourDifference.trim() || null,
    'm5.whyCustomersCare': s.answers.m5.whyCustomersCare.trim() || null,
    'm5.uvpStatement': s.answers.m5.uvpStatement.trim() || null,
    'm6.anchorPrice': s.answers.m6.anchorPrice !== null ? String(s.answers.m6.anchorPrice) : null,
    'm6.price': s.answers.m6.price !== null ? String(s.answers.m6.price) : null,
    'm7.topName': topName || null,
  };
}

function assemblePrompt(template, s) {
  const ctx = resolveContext(s);
  let missingCount = 0;
  const html = template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const val = ctx[key.trim()];
    if (val) return `<span class="filled">${escHtml(val)}</span>`;
    missingCount += 1;
    return `<span class="missing">[not filled in yet]</span>`;
  });
  const plain = template.replace(/\{\{(.*?)\}\}/g, (_, key) => ctx[key.trim()] || '[not filled in yet]');
  return { html, plain, missingCount };
}

function escHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
