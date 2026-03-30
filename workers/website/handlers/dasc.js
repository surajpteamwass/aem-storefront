/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * `/dasc/*.json` → Document Authoring structured content JSON (delivery endpoint).
 * Default host matches DA docs; override with `DA_SC_BASE` in wrangler if Adobe changes it.
 * @see https://docs.da.live/developers/guides/structured-content (Delivery Endpoint)
 */
const DA_JSON_DELIVERY_DEFAULT = 'https://mhast-html-to-json.adobeaem.workers.dev';

export default async function fetchDaSc({ url, env, request }) {
  const { AEM_ORG, AEM_SITE } = env;
  if (!AEM_ORG || !AEM_SITE) {
    return new Response(
      JSON.stringify({ error: 'Worker env must define AEM_ORG and AEM_SITE (see wrangler.toml).' }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    );
  }

  const base = (env.DA_SC_BASE || DA_JSON_DELIVERY_DEFAULT).replace(/\/$/, '');
  const href = `${base}/live/${AEM_ORG}/${AEM_SITE}${url.pathname}`;

  const listReq = new Request(href, request);
  const resp = await fetch(listReq);

  // Handle 304 Not Modified responses
  if (resp.status === 304) {
    return new Response(null, { status: 304, headers: resp.headers });
  }

  const text = await resp.text();

  const headers = new Headers(resp.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(text, { status: resp.status, headers });
}
