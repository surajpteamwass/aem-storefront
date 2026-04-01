# API Mesh quick guide

## 1) Install plugin

```bash
aio plugins:install @adobe/aio-cli-plugin-api-mesh
aio plugins
```

## 2) Login and select Console context (Stage)

```bash
aio auth login
aio config set cli.env stage
aio console org select 1841301
aio console project select 4566206088345562114
aio console workspace select 4566206088345593176
aio config:get console
```

## 3) Update mesh

```bash
aio api-mesh update mesh.json --secrets secrets-stage.yaml --env .env
aio api-mesh:get
aio api-mesh:status
```

## 4) Local run

```bash
aio api-mesh run mesh.json --port 9000
```

## 5) Common failures and fixes

### A) `Unable to import secrets`

Checks:
- Confirm file extension is `.yaml` or `.yml`
- Confirm valid YAML (no tabs, no malformed quotes)
- Keep `secrets-stage.yaml` as simple key/value pairs
- Ensure `--env .env` is valid syntax (no broken quotes)

If still failing, re-auth and re-select org/project/workspace.

### B) `403 Forbidden` or `No mesh found`

This is usually Console access/context, not mesh JSON.

```bash
aio auth logout
aio auth login
aio config set cli.env stage
aio console org select 1841301
aio console project select 4566206088345562114
aio console workspace select 4566206088345593176
aio config:get console
```

### C) CORS issue on `.aem.page`/`.aem.live`

In `mesh.json`, `responseConfig.CORS.origin` should use explicit origins for each environment.

If `credentials: true`, do not use wildcard `*` origin.

Example:
- `https://www.wasserman-demo-aem.online`
- `https://main--aem-storefront--surajpteamwass.aem.page`
- `https://main--aem-storefront--surajpteamwass.aem.live`
- `http://localhost:3000`

## 6) Clean AIO local cache (macOS)

```bash
aio auth logout
rm -rf ~/.config/aio
rm -rf ~/.aio
rm -rf ~/Library/Caches/@adobe
npm cache clean --force
aio auth login
```