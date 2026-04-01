# Edge Delivery Services + Adobe Commerce Boilerplate

This project boilerplate is for Edge Delivery Services projects that integrate with Adobe Commerce.

## Project Guide

### 1) EDS Structure (Content, Code, Architecture)

#### Content Side
- Content is authored in document sources (Google Drive / SharePoint depending on site config).
- EDS serves authored content through site routing and document-driven paths.
- Structured content can be exposed as JSON (for example `/dasc/*.json`) and consumed in storefront code.

#### Code Side
- Code lives in GitHub and is delivered through EDS branch environments.
- Main implementation folders:
  - `blocks/` - page blocks
  - `scripts/` - bootstrap, commerce wiring, initializers
  - `styles/` - global styles and tokens
  - `workers/website/` - edge worker request routing/custom handling
  - `tools/pdp-metadata/` - metadata generation utility
  - `api-mesh/` - GraphQL mesh config, resolvers, env/secrets templates

#### Runtime Architecture
- Browser requests go to EDS domain (`.aem.page`/`.aem.live`) or worker domain.
- Worker can route custom JSON endpoints and then proxy to AEM origin.
- Storefront frontend uses Adobe Commerce services (Catalog/GraphQL), optionally via API Mesh.
- Content and code are linked via site config on `admin.hlx.page`.

### 2) Branch Creation and Push

```bash
# sync local development branch
git checkout development
git pull origin development

# create feature branch
git checkout -b feature/<short-name>

# commit and push
git add .
git commit -m "feat: <change summary>"
git push -u origin feature/<short-name>
```

Recommended naming:
- `feature/<name>`
- `bugfix/<name>`
- `hotfix/<name>`

### 3) Local Installation

```bash
# from project root
npm install
npm run postinstall
```

Optional local server:

```bash
aem up --html-folder="./drafts/agents"
```

Worker local run:

```bash
cd workers/website
npm install
npm run dev
```

### 4) Feature Branch Environment URL Access

After branch push, EDS branch preview follows this pattern:
- Preview: `https://<branch>--<repo>--<owner>.aem.page/`
- Live (if promoted): `https://<branch>--<repo>--<owner>.aem.live/`

Example:
- `https://feature-x--aem-storefront--surajpteamwass.aem.page/`

Notes:
- Use lowercase branch names and avoid special characters.
- If branch contains `/`, EDS may normalize it; validate final generated URL in PR checks.

### 5) `tools/pdp-metadata` Steps

Path: `tools/pdp-metadata/`

```bash
cd tools/pdp-metadata
npm install
npm start
```

What it does:
- Fetches product data from catalog service.
- Generates:
  - `metadata.xlsx`
  - `metadata.json`

Usage:
- Upload `metadata.json` to DA/EDS metadata endpoint (manual/API) for bulk metadata ingestion.

### 6) Worker Steps and Uses

Path: `workers/website/`

Commands:

```bash
cd workers/website
npm install
npm run dev
npm run deploy:stage
npm run deploy:prod
```

Current worker responsibilities:
- Route `/schedules/*.json` to schedule handler.
- Route `/dasc/*.json` to structured-content handler.
- Block `/drafts` on production.
- Proxy other traffic to AEM origin host.
- Normalize request params for media/json handling.
- Add headers for BYO CDN and optional push invalidation.

Required env vars (minimum):
- `AEM_ORG`
- `AEM_SITE`
- optional: `AEM_EDGE_DOMAIN`, `DA_SC_BASE`, `ORIGIN_AUTHENTICATION`, `PUSH_INVALIDATION`

### 7) Config Get/Push with `admin.hlx.page` APIs

Use `x-auth-token` from authorized admin/config user. Do not commit real tokens.

Get config:

```bash
curl --location 'https://admin.hlx.page/config/<org>/sites/<site>.json' \
--header 'x-auth-token: <YOUR_TOKEN>' \
--header 'Content-Type: application/json'
```

Push/update config:

```bash
curl --location 'https://admin.hlx.page/config/<org>/sites/<site>.json' \
--header 'x-auth-token: <YOUR_TOKEN>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "content": {
    "source": {
      "type": "google",
      "url": "https://drive.google.com/drive/folders/<folder-id>",
      "id": "<folder-id>"
    },
    "contentBusId": "<contentBusId>"
  },
  "code": {
    "owner": "<github-owner>",
    "repo": "<github-repo>",
    "source": {
      "type": "github",
      "url": "https://github.com/<github-owner>/<github-repo>"
    }
  },
  "folders": {
    "/products/": "/products/default"
  },
  "access": {
    "admin": {
      "role": {
        "admin": ["user1@company.com"],
        "author": ["user1@company.com"],
        "publish": ["user1@company.com"],
        "develop": ["user1@company.com"],
        "basic_author": ["user1@company.com"],
        "basic_publish": ["user1@company.com"],
        "config": ["user1@company.com"],
        "config_admin": ["user1@company.com"]
      },
      "requireAuth": "auto"
    }
  }
}'
```

Best practice:
- Pull existing config first, modify only required keys, then push.
- Keep org/site/repo alignment exact to avoid broken environments.

### 8) API Mesh Structure, Role, Create/Update Process

Path: `api-mesh/`

Important files:
- `mesh.json` - main mesh definition (sources, CORS, custom schema extensions)
- `resolvers.js` - custom GraphQL resolver logic
- `secrets-*.yaml` - environment secrets references
- `download.json` - downloaded mesh snapshot/state

Role in this project:
- Federates Adobe Commerce Catalog GraphQL and custom warehouse runtime endpoint.
- Exposes unified query extensions like `productWithWarehouse`.
- Handles auth token exchange and token caching (state-enabled) inside resolver flow.

Create/update flow (CLI):

```bash
# one-time / context
aio console:org:select <org-id>
aio console:project:select <project-id>
aio console:workspace:select <workspace-id>

# validate current target
aio config:get console

# update mesh
aio api-mesh update mesh.json --secrets secrets-stage.yaml

# inspect
aio api-mesh:get
aio api-mesh:status
```

Project notes:
- Keep `mesh.json` free from hardcoded secrets where possible; move credentials to secrets file/env.
- Test updated query behavior from storefront GraphQL calls before promoting.
- Maintain CORS origin list for all active branch/stage/prod hosts.

## Documentation

Before using the boilerplate, we recommend you to go through the documentation on <https://experienceleague.adobe.com/developer/commerce/storefront/> and more specifically:

1. [Storefront Developer Tutorial](https://experienceleague.adobe.com/developer/commerce/storefront/get-started/)
1. [AEM Docs](https://www.aem.live/docs/)
1. [AEM Developer Tutorial](https://www.aem.live/developer/tutorial)
1. [The Anatomy of an AEM Project](https://www.aem.live/developer/anatomy-of-a-project)
1. [Web Performance](https://www.aem.live/developer/keeping-it-100)
1. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Changelog

Major changes are described and documented as part of pull requests and tracked via the `changelog` tag. To keep your project up to date, please follow this list:

<https://github.com/hlxsites/aem-boilerplate-commerce/issues?q=label%3Achangelog+is%3Aclosed>
