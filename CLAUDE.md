# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install
npm install                        # also runs postinstall (copies drop-ins, builds GraphQL overrides)
npm run install:dropins            # re-run drop-in install manually

# Lint (run before every commit/push)
npm run lint                       # JS + CSS
npm run lint:fix                   # auto-fix
npm run lint:js                    # JS only
npm run lint:css                   # CSS only

# Local dev
aem up                             # start AEM local dev server
aem up --html-folder="./drafts/agents"

# E2E tests (from cypress/)
cd cypress && npm run cypress:open        # PAAS, interactive
cd cypress && npm run cypress:run         # PAAS, headless
cd cypress && npm run cypress:saas:run    # SAAS, headless

# Edge worker (from workers/website/)
npm run dev
npm run deploy:stage
npm run deploy:prod

# API Mesh
aio api-mesh update mesh.json --secrets secrets-stage.yaml
aio api-mesh:get && aio api-mesh:status

# PDP metadata tool (from tools/pdp-metadata/)
npm start
```

**Mandatory before every push:** `npm run lint && npm run lint:fix`

## Architecture

### Runtime Flow

Browser → EDS domain (`.aem.page` / `.aem.live`) or Cloudflare worker domain → AEM origin.

- **Content** is authored in Google Drive / SharePoint, served via EDS routing.
- **Code** lives in this GitHub repo and is delivered by EDS branch environments.
  - Preview: `https://<branch>--<repo>--<owner>.aem.page/`
  - Live: `https://<branch>--<repo>--<owner>.aem.live/`
- **Commerce data** comes from Adobe Commerce Catalog Service / GraphQL, optionally federated through API Mesh.

### Key Directories

| Path | Purpose |
|------|---------|
| `blocks/` | Page blocks — each has `{name}.js`, `{name}.css`, `README.md` |
| `scripts/` | Bootstrap and commerce wiring |
| `scripts/__dropins__/` | Auto-generated; compiled drop-in packages (do not edit) |
| `scripts/initializers/` | Per-feature init (auth, cart, pdp, search, etc.) called from `index.js` |
| `styles/` | Global CSS and design tokens |
| `api-mesh/` | GraphQL mesh definition, resolvers, secrets templates |
| `workers/website/` | Cloudflare edge worker — routes `/schedules/*.json`, `/dasc/*.json`, proxies rest |
| `tools/pdp-metadata/` | Generates `metadata.xlsx` / `metadata.json` from catalog data for bulk ingestion |
| `cypress/` | E2E tests (PAAS + SAAS configs) |

### Block Pattern

Every block exports a single `decorate(block)` function:

```js
export default async function decorate(block) {
  // 1. Read config from block table structure
  // 2. Transform DOM
  // 3. Attach event listeners / async init
}
```

Commerce blocks (e.g., `commerce-cart`, `commerce-pdp`) mount drop-in components via initializers rather than implementing commerce logic directly.

### Drop-in Components

Drop-ins (`@dropins/storefront-*`) are pre-built commerce UI components. They are:
- Downloaded to `scripts/__dropins__/` by `postinstall.js` — never edit files there.
- Initialized in `scripts/initializers/{feature}.js`, registered in `scripts/initializers/index.js`.
- GraphQL operations can be customized in `build.mjs` using `overrideGQLOperations` (e.g., skipping `DOWNLOADABLE_CART_ITEMS_FRAGMENT` for ACCS).

### Commerce Wiring (`scripts/commerce.js`)

Exports two `FetchGraphQL` instances used site-wide:
- `CORE_FETCH_GRAPHQL` — Adobe Commerce core GraphQL
- `CS_FETCH_GRAPHQL` — Catalog Service GraphQL

Also exports shared path constants (`CUSTOMER_PATH`, `ORDER_DETAILS_PATH`, etc.) used across blocks and initializers.

### API Mesh (`api-mesh/`)

Federates Commerce Catalog GraphQL with custom endpoints (e.g., warehouse data). Key files:
- `mesh.json` — sources, CORS, schema extensions
- `resolvers.js` — custom resolver logic (auth token exchange, caching)
- `secrets-stage.yaml` — secrets template (do not commit real values)

### Edge Worker (`workers/website/`)

Handles routing before requests reach AEM origin. Required env vars: `AEM_ORG`, `AEM_SITE`. Optional: `AEM_EDGE_DOMAIN`, `DA_SC_BASE`, `ORIGIN_AUTHENTICATION`, `PUSH_INVALIDATION`.

### Site Config

Managed via `admin.hlx.page` APIs (requires `x-auth-token`). Pull existing config before modifying — only push changed keys. Folder mappings (e.g., `/products/` → `/products/default`) are set here and mirrored in `fstab.yaml`.

## Conventions

- **Branch names:** `feature/<name>`, `bugfix/<name>`, `hotfix/<name>` — lowercase, no special chars.
- **Block folders:** kebab-case.
- **JS:** ES modules, `.js` extensions required on imports (enforced by ESLint airbnb-base).
- **New initializers:** add to `scripts/initializers/{feature}.js`, import in `scripts/initializers/index.js`.
- **GraphQL overrides:** add entries to `build.mjs` `overrideGQLOperations` array; re-run `npm run install:dropins` after changes.
