// util.js — small, dependency-free helpers for putting customer-entered text into HTML safely.
// Anything a customer types must go through one of these before it reaches an innerHTML template.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text for use in element content or a quoted attribute. Always returns a string. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESC[c]);
}

/** Escaped text with line breaks preserved (\n -> <br>). For multi-line answers shown as HTML. */
export function escMultiline(value) {
  return esc(value).replace(/\r\n|\r|\n/g, '<br>');
}
