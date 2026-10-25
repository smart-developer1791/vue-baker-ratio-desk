<div align="center">

# 🥣 Baker Ratio Desk

**A familiar recipe, exactly the right batch.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue flour-based recipe desk with getter-backed reactive scaling, exact whole-gram allocation, deterministic portion splitting, and CSV/TXT/JSON exports._

</div>

---

## ✨ Highlights

- **One fixed reference:** Base flour is 100%; up to ten other ratios use tenths of a percent.
- **Target the whole dough:** Scale a recipe to 100–5000 grams while preserving an exact whole-gram total.
- **Explicit rounding:** Largest fractional remainders receive spare grams, with source-order ties.
- **Divide every gram:** Split into 1–24 portions whose weights differ by at most one gram.
- **Reactive input contracts:** A composable accepts refs/getters through MaybeRefOrGetter and toValue.
- **Current after replacement:** The summary uses a getter of compiler-reactive destructured props, including full JSON imports.
- **Complete weighing sheets:** Export all ingredients as guarded CSV, full portions and recipe as TXT, or canonical BR JSON.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── font-licenses.txt                   # Font copyright and OFL licenses
└── sample-workspace.json               # Complete importable workspace
src/
├── components/
│   ├── RecipeSummary.vue
│   ├── DataTools.vue                   # Workspace actions and restoration
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── recipe.ts                      # Pure validation, calculations, and exports
│   ├── shared.ts                       # Text, identity, number, and provenance helpers
│   └── validation.ts                   # Strict unknown-input guards
├── composables/
│   └── useRecipeScale.ts
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. All application layout and visible-state classes use Tailwind utilities. Domain-driven contribution/timeline widths use numeric inline styles; standalone exported graphics carry their own presentation. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The original **A small table of morning rolls** uses base Bread flour at 100%, Water at 67.5%, Salt at 2.0%, and Olive oil at 3.5%. A 1234 g target allocates 713/482/14/25 g respectively. Six portions are 206/206/206/206/205/205 g; both sheets balance exactly.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is served as a public static file. The application imports this same JSON sample for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

useRecipeScale accepts MaybeRefOrGetter<Workspace> and reads toValue inside a computed effect. The parent passes its draft ref for current ratio information. RecipeSummary destructures its workspace prop and passes a getter, allowing Vue’s reactive-props transform to track complete parent replacements rather than retaining an earlier object. Browser tests verify the actual existing summary DOM updates after importing a new recipe.

Ratios are stored as whole tenths of a percentage: 1000 means 100.0%. Base flour always has ratio 1000 and identity flour; it cannot be removed or reused by an extra ingredient. Its display name is editable. Extra ratios range from zero to 2000, including zero-percent saved lines. Duplicate display names are allowed; identities are unique.

For each line, exact desired grams are target×ratio/sum(ratios). The allocator takes whole floors, then gives the remaining grams to the largest integer remainder. Ties follow source order, with base flour first. Every allocated weight is within one gram of its ideal and the total is exactly the target. No floating percentage rounding is needed to choose ties.

Portions divide the same target by their count. Each begins at the whole quotient, and earlier portions receive one of the remaining grams. The portion total is exact and largest/smallest weights differ by at most one. This is a division sheet for the finished dough, not a second ingredient allocation.

Percentage text accepts decimal digits with at most one decimal; candidate validation enforces 0–200%. Imported ratios are already integer tenths, without coercion. Batch and selected-ingredient forms synchronize independently, preserving unrelated pending fields. Additions generate safe unused identities, removal confirms, and zero extra lines give a valid flour-only model.

Prepared ingredients remain whole lines. Their internal flour/water is not decomposed, so the tool does not claim calculated hydration or fermentation behavior. It scales the ratios supplied by the user rather than recommending a recipe.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-baker-ratio-desk:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Name, base-flour name, target dough grams, portion count, and ordered extra ingredient identities/names/ratio tenths are persisted. Allocated weights, portion weights, selection, pending forms, validation messages, and dialogs are derived or transient.

| Field                   | Accepted values                                                       |
| ----------------------- | --------------------------------------------------------------------- |
| version, name           | 1; nonblank single-line title up to 80 characters                     |
| flour                   | Nonblank single-line base-flour name up to 32 characters              |
| target                  | Actual whole dough grams 100–5000                                     |
| portions                | Actual whole count 1–24                                               |
| ingredients             | 0–10 ordered records with unique safe IDs up to 40; flour is reserved |
| Ingredient name / ratio | Nonblank single-line name up to 32; actual whole ratio tenths 0–2000  |

IDs cannot use reserved prototype names. Wrong primitives, unsupported schemas, excessive rows, fractional ratios, invalid names/batches/portions, and duplicate/reserved IDs reject candidates. The permanent flour row and all weights are derived.

CSV includes base flour and every extra line with identity, quoted display name, one-decimal baker percentage, allocated grams, and BR marker. Spreadsheet-sensitive names receive an apostrophe before standard CSV quoting. TXT includes all percentages/weights, total recipe percentage, exact target, all numbered portion weights, rounding rules, and attribution. JSON preserves source names/ratios, target, portion count, and recomputed provenance; calculated grams never replace the supplied recipe ratios.

Download Blob URLs are revoked after download. Destructive collection removal and sample restoration use native confirmation dialogs.

## ◈ Project Markers

- `BR` appears in the wordmark, project metadata, and workspace identity; original favicon/social artwork use a matching emblem.
- `BR-XXXXXXXX` is a deterministic 32-bit content stamp calculated with FNV-1a over UTF-8 canonical workspace JSON, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- One base flour reference with direct ingredient ratios; no multi-flour blending, preferment decomposition, hydration analysis, time, or temperature model.
- Percentages compare with base flour, not total dough mass, so the recipe percentage normally exceeds 100%.
- Prepared ingredients are not split into their internal flour/water components.
- Whole-gram allocation preserves total mass but deliberately rounds very small quantities; zero-ratio lines stay at zero grams.
- Largest-remainder ties follow original ingredient order. A different JSON order can change tied gram recipients.
- Portion weights divide the finished target, with spare grams given to earlier portions.
- Names may repeat; safe identities distinguish lines. The flour identity is reserved.
- Ratios stay saved even when their allocated gram amount is zero.
- Selection, pending forms, derived weights, and dialogs are transient.
- Extend strict ratio parsing, conservation/rounding, getter reactivity, and exports together.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Six native tests cover exact sample allocation/portions, largest-remainder ties and zeros, 150 maximum-line varied recipes with conservation/error bounds, actual Vue ref/getter replacement updates, strict decimal/schema guards, complete formula-guarded CSV/TXT/JSON, and Unicode stamps. Four browser workflows verify live getter-backed summary replacement without remounting, pending/invalid percentage edits, zero-ratio lines, confirmed collection limits and flour-only recipes, persistence, stable panels, and full downloaded artifacts.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. A separate maximum-content case downloads and re-imports the complete escaped JSON workspace at 320 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
