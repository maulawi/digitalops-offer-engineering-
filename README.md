# DigitalOps — Offer Engineering

CREATE / 001. A static, no-backend, no-account interactive guide that turns a customer's
expertise into a structured, nine-item Offer Blueprint across eight modules. Vanilla
HTML/CSS/JS, hash-routed, all content in JSON, all progress in the browser's
`localStorage`. No build step, no framework, no server-side code.

```
01 Find Your Primed Market        05 Define Your Unique Value Proposition
02 Map the Problem                 06 Price It Like You Mean It
03 Engineer the Value              07 Name & Position It
04 Build the Offer Stack           08 Validate Before You Build
```

---

## 1. Project overview

The app walks a customer through eight modules (plus an M0 orientation step). Each
module has up to four stages — **Lesson → Exercise → AI Prompt → Deliverable** — and
every exercise answer rolls up into a single **Offer Blueprint**: a fixed set of nine
deliverables the customer can review on-screen and export as a two-page PDF.

Nothing is server-rendered and nothing is sent to a server. All lesson/exercise/prompt
copy lives in `content/*.json`; all customer answers live in the browser's
`localStorage` under one versioned key, with an automatic one-time migration for anyone
who saved progress under an earlier module structure.

## 2. Folder structure

```
index.html                 Entry point — loads Google Fonts, the CSS, and js/app.js as a module
README.md                  This file
package.json                Optional convenience scripts only — no runtime dependencies
.gitignore

assets/
  fonts/                    Reserved for self-hosted fonts (currently empty — see §3)
  icons/                    favicon.svg (the browser-tab icon); all in-app icons are inline SVG

scripts/
  serve.mjs                   Dependency-free local dev server behind `npm start`

js/util.js                  esc()/escMultiline() — every customer-entered string must pass through
                            these before reaching innerHTML

css/
  tokens.css                 Design tokens (color, type, spacing, radii) — the single source of
                              brand identity; shared by every DigitalOps guide
  base.css                    Reset, buttons, cards, callouts, form controls — shared primitives
  layout.css                  Page-level layout: cover screen, app shell, Blueprint screen
  components.css              Component-level styling: nav rail, sliders, prompt card, tracker…
  responsive.css              Cross-cutting breakpoint rules (desktop sidebar vs. mobile drawer, etc.)
  print.css                   The Offer Blueprint's print/PDF-export-only stylesheet

js/
  app.js                      Entry point — render orchestration (see the render-model comment
                               at the top of this file before touching it)
  router.js                   Minimal hash router (#/m5/exercise, #/blueprint, …)
  state.js                    Single source of truth for every customer answer, plus every
                               computed value (deliverable completion, progress %, Pull/Drag
                               position). MODULE_IDS and DELIVERABLES live here.
  storage.js                   All localStorage reads/writes go through here — nowhere else.
                               Versioned schema (SCHEMA_VERSION) with a migration path and a
                               safe in-memory fallback if localStorage is unavailable.
  navigation.js                 Module order (MODULE_IDS-driven), content loading/caching,
                                 prev/next sequencing, MODULE_TITLES.
  components/
    cover.js                     Screen 01 — the landing/cover screen
    cover-showcase.js            The 8-stage animated hero visual on the cover screen
    nav-rail.js                  Persistent module tree (desktop sidebar / mobile drawer)
    progress-indicator.js        Persistent top progress bar ("Module 05 of 08 · …")
    lesson-block.js               Screen 02 — the reading area
    framework-diagrams.js         Shared Market Pulse / Problem Timeline / Pull-Drag / Promise visuals
    exercise-fields.js            Screen 04 — one builder function per exercise type
    ai-prompt-block.js            Screen 05 — the AI prompt engine (platform tabs, copy, context fill-in)
    deliverable-tracker.js        The 9-item Blueprint checklist (module snapshot + full list)
                                   and summarizeDeliverable() — the one place raw answers become
                                   human-readable Blueprint text
    blueprint-screen.js           Screen 06 — the full Offer Blueprint + "Export as PDF"
    resources.js                  Glossary + reset-progress

content/
  m0.json                      Orientation (the two-path diagnostic)
  m1.json … m8.json             One file per module — lesson copy, exercise config, AI prompt
                                 template(s). Nothing module-specific is hardcoded in the JS;
                                 these nine files are the entire guide's content.
```

## 3. Technologies used

- **Vanilla JavaScript (ES modules)** — no framework, no bundler, no transpilation.
- **Vanilla CSS** — no preprocessor, no CSS framework.
- **Two Google Fonts** (DM Sans, Manrope), loaded via a CDN `<link>` in `index.html`.
  There is no offline/self-hosted font fallback shipped in this repo — if you need the
  app to work with zero external network calls, download the two font files yourself
  into `assets/fonts/`, add `@font-face` rules pointing at them in `css/tokens.css`, and
  remove the two Google Fonts `<link>` tags from `index.html`. Until then, the
  `assets/fonts/` folder is a placeholder. In-app icons are inline SVG; `assets/icons/`
  holds only the favicon.
- **`localStorage`** — the only persistence layer. No database, no backend.
- **No external JS dependencies of any kind.** `package.json` exists only to offer a
  `npm start` convenience script; `npm install` has nothing to install.

## 4. Installing dependencies

There are none. `package.json` has no `dependencies` or `devDependencies` — it exists
only to give you a single documented command to start a local server. Running
`npm install` will succeed instantly and install nothing.

## 5. Running the application locally

Opening `index.html` directly from disk (`file://…`) will **not** work — the app loads
its content with `fetch()`, and browsers block that over `file://`. Serve the folder
over HTTP instead, with any one of these (use whichever you have installed):

```bash
# Option A — via npm (cross-platform: runs scripts/serve.mjs with Node 18+; works on Windows, macOS, Linux)
npm start
#   different port:  PORT=3000 npm start      (PowerShell: $env:PORT=3000; npm start)

# Option B — directly, no npm needed (use `python` instead of `python3` on Windows)
node scripts/serve.mjs
python3 -m http.server 8080
# or
npx serve .
# or
php -S localhost:8080
```

Then open the printed URL (e.g. `http://localhost:8080/`) in a browser.

## 6. Building the application

There is no build step. This is a static site — the files in this repository are the
files you deploy. "Building" is not applicable.

## 7. Testing the application

No automated test suite ships inside this repository. The build-and-content work was
verified during development with ad-hoc Playwright scripts run against a local static
server (full module navigation, every exercise type, the AI prompt engine's platform
tabs and copy button, `localStorage` persistence and the v1→v2 migration, the
nine-deliverable Blueprint, and PDF export) — those scripts live outside this folder
and are not part of the deliverable. If this becomes a team-maintained codebase, the
natural next step is a real `tests/` directory (Playwright or similar) wired to
`npm test`.

To test manually:
1. Run the app locally (§5).
2. Click through M0's diagnostic, then each of the eight modules' Lesson → Exercise →
   AI Prompt → Deliverable stages.
3. Confirm the AI Prompt screen's ChatGPT/Claude/Gemini tabs all show the same prompt
   text, and the copy button works.
4. Visit `#/blueprint` and confirm all nine deliverables reflect what you entered, then
   click "Export as PDF."
5. Reload the page and confirm your answers are still there (localStorage).

## 8. Deploying it

Any static file host works — this is plain HTML/CSS/JS with no server-side code:
GitHub Pages, Netlify, Vercel (as a static site), Cloudflare Pages, S3 + CloudFront, or
a plain Nginx/Apache document root. Upload the repository contents as-is; there is
nothing to build first. The only requirement is that it's served over HTTP(S), not
opened as a local file (see §5).

## 9. How the content JSON files are organised

Every module's lesson text, exercise configuration, and AI prompt template live in
`content/m0.json` through `content/m8.json` — nothing module-specific is hardcoded in
the JavaScript. `js/navigation.js`'s `MODULE_IDS` (defined in `js/state.js`) is the one
list that says which content files exist and in what order; everything else (router,
nav rail, progress indicator, prev/next logic) reads from that list dynamically.

A lesson object looks like:

```json
{
  "id": "5.1",
  "title": "Understand what makes your offer different",
  "readTime": "7 min read",
  "status": "approved",
  "body": ["paragraph one (HTML allowed)", "paragraph two"],
  "insight": "the one key-insight sentence shown at the end of the lesson"
}
```

A module's exercise config names an exercise `type` (e.g. `"uvp"`, `"pricing"`,
`"naming"`) that maps to one builder function in `js/components/exercise-fields.js`'s
`builders` object — that function is what actually renders the input fields for that
module.

The AI prompt template(s) (`"prompt"` for a single prompt, `"prompts"` as an array for
a module with more than one) use `{{module.field}}` placeholder tokens — e.g.
`{{m1.topMarket}}` or `{{m5.uvpStatement}}` — resolved at render time from the
customer's own saved answers. See `resolveContext()` in
`js/components/ai-prompt-block.js` for the full list of available placeholders and how
to add a new one; every token used in a `content/*.json` prompt template must have a
matching key returned by `resolveContext()`, or it will render as
`[not filled in yet]`.

## 10. Where to make future changes

- **Fix a typo or rewrite a lesson** → edit the relevant `content/mN.json` and refresh
  the browser. No rebuild needed.
- **Add a field to an exercise, or a new exercise type** → `js/components/exercise-fields.js`
  (add a `build…()` function and register it in the `builders` map), plus the matching
  shape in `state.js`'s `defaultAnswers()` and a setter function.
- **Change what counts as "done" for a deliverable, or add/remove a deliverable** →
  `state.js`'s `DELIVERABLES` array and `deliverableStatus()`. The Blueprint is fixed at
  nine deliverables by design (see the M5 integration note in `state.js` for why a
  module can exist with no deliverable of its own).
- **Add or reorder a module** → update `MODULE_IDS` in `js/state.js`, add/rename the
  matching `content/mN.json` file, and update `MODULE_TITLES` in `js/navigation.js`.
  Everything else (router, nav rail, progress bar, prev/next, PDF pagination by
  deliverable `id`) is already generic over "however many modules exist" — see
  `js/storage.js`'s migration function for the pattern to follow if the change needs to
  preserve existing customers' saved progress.
- **Change the AI prompt engine's available context** → `resolveContext()` in
  `js/components/ai-prompt-block.js`.
- **Change the PDF layout or pagination** → `css/print.css` and the
  `printSectionBody()` / `exportPdf()` functions in `js/components/blueprint-screen.js`.
- **Rebrand or start a new DigitalOps guide (BUILD / LAUNCH / GROW)** — this codebase
  was built to be cloned, not rewritten, for the next guide:
  1. Copy the project folder; keep `css/tokens.css` as-is (shared brand identity across
     every guide).
  2. Replace `content/m0–m8.json` with the new guide's modules — add or remove files
     and update `MODULE_IDS` / `MODULE_TITLES` to match (the module count doesn't have
     to be eight).
  3. If the new guide needs an exercise type that doesn't exist yet, add a new
     `build…()` function in `exercise-fields.js`.
  4. Update `state.js`'s `DELIVERABLES` and `defaultAnswers()` for the new guide's
     outputs.
  5. Change the cover screen's copy (`js/components/cover.js`,
     `js/components/cover-showcase.js`) and the `<title>`/description in `index.html`.

## Known limitations

- **No cross-device sync, by design.** Progress lives only in the browser it was
  entered in. The Reset-progress control on the Resources page explains this to the
  customer explicitly.
- **No automated test suite ships in this repository** (see §7).
- **No offline font fallback shipped** — the two Google Fonts are loaded from a CDN;
  see §3 for how to self-host them if the app needs to run with no external network
  calls at all.
- **Sidebar lesson links are module-level, not lesson-level.** Clicking a specific
  lesson row takes you to that module's lesson stage (showing all of that module's
  lessons in sequence), not a scroll-to/highlight of that one lesson.
