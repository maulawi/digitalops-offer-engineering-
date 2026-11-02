// storage.js — all localStorage access goes through here, nowhere else.
// Versioned schema so a future format change can migrate old saves instead of discarding them.

const STORAGE_KEY = 'digitalops.offerEngineering.v1';
// Holds a copy of a save that was about to be migrated or replaced because it couldn't be used
// as-is, so customer data is never destroyed silently. Cleared by clearState() (Reset).
const BACKUP_KEY = 'digitalops.offerEngineering.v1.backup';
const SCHEMA_VERSION = 2;

let memoryFallback = null;
let storageAvailable = true;

function probeStorage() {
  try {
    const t = '__do_probe__';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
    return true;
  } catch (e) {
    return false;
  }
}
storageAvailable = typeof window !== 'undefined' && !!window.localStorage && probeStorage();

export function isStorageAvailable() {
  return storageAvailable;
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Best-effort: keep the raw text of a save we're about to migrate or abandon.
function backupRaw(raw, reason) {
  try {
    window.localStorage.setItem(BACKUP_KEY, raw);
    console.warn(`[DigitalOps] Saved a backup copy of the previous progress (${reason}).`);
  } catch (e) { /* backup is best-effort only */ }
}

// v1 was the seven-module structure: m1 Market .. m4 Offer Stack, m5 Pricing,
// m6 Naming & Positioning, m7 Validation. v2 inserts a new m5 (Unique Value
// Proposition) between Offer Stack and Pricing, shifting the old m5/m6/m7 down
// to m6/m7/m8 — so a returning customer's saved pricing, naming and validation
// answers have to move with them rather than silently disappear under the new
// module numbers. m0–m4 are untouched by the new module and pass straight through.
// Field-level validation is state.js's job (it sanitizes every save on hydrate); this only
// moves whole modules, and tolerates any malformed container it finds.
function migrateV1ToV2(parsed) {
  const a = isPlainObject(parsed.answers) ? parsed.answers : {};
  const migratedAnswers = {
    m0: a.m0,
    m1: a.m1,
    m2: a.m2,
    m3: a.m3,
    m4: a.m4,
    // m5 is new — no prior data exists to migrate, so it starts fresh and empty.
    // This fixed shape describes what a v2 save looks like, not state.js's current
    // defaults — a migration should never follow a later default change, so it's
    // intentionally duplicated here rather than imported (which would also be a
    // circular import, since state.js already imports from this file).
    m5: { mainAlternative: '', alternativeLimitation: '', yourDifference: '', whyCustomersCare: '', uvpStatement: '' },
    m6: a.m5, // old Pricing
    m7: a.m6, // old Naming & Positioning
    m8: a.m7, // old Validation
  };
  Object.keys(migratedAnswers).forEach((k) => {
    if (migratedAnswers[k] === undefined) delete migratedAnswers[k];
  });

  const nav = isPlainObject(parsed.nav) ? { ...parsed.nav } : {};
  const moduleRemap = { m5: 'm6', m6: 'm7', m7: 'm8' };
  if (typeof nav.lastModule === 'string' && moduleRemap[nav.lastModule]) nav.lastModule = moduleRemap[nav.lastModule];

  return {
    answers: migratedAnswers,
    nav,
    meta: isPlainObject(parsed.meta) ? parsed.meta : {},
  };
}

export function loadState() {
  if (!storageAvailable) return memoryFallback;
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      backupRaw(raw, 'saved progress was not a valid object');
      return null;
    }

    if (parsed.schemaVersion === SCHEMA_VERSION) return parsed;

    if (parsed.schemaVersion === 1) {
      console.info('[DigitalOps] Migrating saved progress from the seven-module format to the eight-module format (adding Define Your Unique Value Proposition).');
      // Keep the untouched v1 save until the customer resets, in case the migration needs revisiting.
      backupRaw(raw, 'before v1 to v2 migration');
      const migrated = migrateV1ToV2(parsed);
      // Persist the migrated shape right away so this runs once per saved browser,
      // not on every single load before the customer happens to make an edit.
      saveState(migrated);
      return { ...migrated, schemaVersion: SCHEMA_VERSION };
    }

    // Unknown/newer schema: don't guess at migration, start fresh rather than corrupt it silently —
    // but keep the original so it isn't lost when the next save replaces it.
    console.warn('[DigitalOps] Stored progress is from an unrecognized schema version; starting fresh.');
    backupRaw(raw, 'unrecognized schema version');
    return null;
  } catch (e) {
    console.warn('[DigitalOps] Could not read saved progress:', e);
    if (raw) backupRaw(raw, 'saved progress could not be parsed');
    return null;
  }
}

export function saveState(state) {
  const payload = { ...state, schemaVersion: SCHEMA_VERSION, savedAt: new Date().toISOString() };
  if (!storageAvailable) {
    memoryFallback = payload;
    return { ok: true, persisted: false };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true, persisted: true };
  } catch (e) {
    console.warn('[DigitalOps] Could not save progress (storage full or blocked):', e);
    memoryFallback = payload;
    return { ok: false, persisted: false, error: e };
  }
}

export function clearState() {
  memoryFallback = null;
  if (!storageAvailable) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(BACKUP_KEY); // Reset means reset — don't leave a private copy behind
  } catch (e) {
    console.warn('[DigitalOps] Could not clear saved progress:', e);
  }
}
