// router.js — minimal hash router. No history-API routing (keeps this deployable
// from a plain static file:// or any static host with zero server config).

const MODULE_RE = /^m[0-8]$/;
const STAGE_RE = /^(lesson|exercise|prompt|deliverable)$/;

export function parseHash(hash) {
  const clean = (hash || '').replace(/^#\/?/, '').replace(/\/$/, '');
  if (!clean) return { name: 'cover' };
  const parts = clean.split('/');
  if (parts[0] === 'blueprint') return { name: 'blueprint' };
  if (parts[0] === 'resources') return { name: 'resources' };
  if (MODULE_RE.test(parts[0])) {
    const moduleId = parts[0];
    const stage = STAGE_RE.test(parts[1]) ? parts[1] : null; // null => caller resolves "last visited" / default
    return { name: 'module', moduleId, stage };
  }
  return { name: 'cover' };
}

export function navigate(hash) {
  if (window.location.hash === hash) {
    // Same hash won't fire hashchange — dispatch the render manually.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function moduleHash(moduleId, stage) {
  return stage ? `#/${moduleId}/${stage}` : `#/${moduleId}`;
}

export function onRouteChange(handler) {
  const run = () => handler(parseHash(window.location.hash));
  window.addEventListener('hashchange', run);
  run();
  return () => window.removeEventListener('hashchange', run);
}
