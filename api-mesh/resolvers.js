/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

module.exports = {
    resolvers: {
      // Query to get product with warehouse data
      Query: {
        /**
         * Get warehouse availability for a product SKU
         */
        productWithWarehouse: {
          resolve: async (root, args, context, info) => {
            try {
              if (!args.sku || args.sku.trim() === '' || !args.ipAddress || args.ipAddress.trim() === '' || !context.MyRuntimeAction || !context.MyRuntimeAction.rawSource || !context.MyRuntimeAction.rawSource.handler || !context.MyRuntimeAction.rawSource.handler.config || !context.MyRuntimeAction.rawSource.handler.config.baseUrl) {
                return null;
              }
              // Get warehouse data using context.http.fetch
              // This is the only solution that works for POST requests with body from resolvers
              let warehouseData = null;
              
              try {
                // Get handler config (includes env vars from mesh.json)
                const handlerConfig = context.MyRuntimeAction?.rawSource?.handler?.config;
                const url = handlerConfig?.baseUrl;
                
                if (context.logger) {
                  context.logger.log('Request body:', JSON.stringify({ sku: args.sku, ipAddress: args.ipAddress || "3.131.150.126" }));
                }
                
                // Get OAuth credentials from handler config (from mesh.json env vars)
                const CLIENT_ID = context.secrets?.SERVICE_CLIENT_ID;
                const CLIENT_SECRET = context.secrets?.SERVICE_CLIENT_SECRET;
                const SCOPES = context.secrets?.SCOPES || 'AdobeID,openid,read_organizations';
                const tokenCacheKey = context.secrets?.TOKEN_CACHE_KEY || 'adobe_ims_token';
                const tokenCacheTtl = context.secrets?.TOKEN_CACHE_TTL || 82800;
                const tokenExchangeUrl = context.secrets?.TOKEN_EXCHANGE_URL || 'https://ims-na1.adobelogin.com/ims/token/v3';
                
                if (!CLIENT_ID || !CLIENT_SECRET) {
                  if (context.logger) {
                    context.logger.error('OAuth credentials not found in handler config. Check SERVICE_CLIENT_ID and SERVICE_CLIENT_SECRET in mesh.json.');
                  }
                  return {
                    sku: args.sku,
                    warehouseAvailability: null
                  };
                }
                
                // Get or fetch access token (with caching)
                let accessToken = null;
                
                // Try to get cached token
                if (context.state) {
                  const cachedToken = await context.state.get(tokenCacheKey);
                  if (cachedToken) {
                    accessToken = JSON.parse(cachedToken);
                    if (context.logger) {
                      context.logger.log('Using cached access token');
                    }
                  }
                }
                
                // If no cached token, exchange credentials for access token
                if (!accessToken) {
                  if (context.logger) {
                    context.logger.log('Exchanging OAuth credentials for access token');
                  }
                  
                  const tokenResponse = await globalThis.fetch(tokenExchangeUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                      grant_type: 'client_credentials',
                      client_id: CLIENT_ID,
                      client_secret: CLIENT_SECRET,
                      scope: SCOPES
                    })
                  });
                  
                  if (!tokenResponse.ok) {
                    const errorText = await tokenResponse.text();
                    if (context.logger) {
                      context.logger.error('Token exchange failed:', tokenResponse.status, errorText);
                    }
                    return {
                      sku: args.sku,
                      warehouseAvailability: null
                    };
                  }
                  
                  const tokenData = await tokenResponse.json();
                  accessToken = tokenData.access_token;
                  
                  // Cache token using TTL from config
                  if (context.state && accessToken) {
                    await context.state.put(tokenCacheKey, JSON.stringify(accessToken), { ttl: tokenCacheTtl });
                  }
                }
                
                // Get Origin from request or use allowed origin
                const originHeader = context.secrets.ALLOWED_ORIGINS;
                
                // Get IMS Org ID from secrets (required for Runtime Action auth)
                const IMS_ORG_ID = context.secrets?.IMS_ORG_ID;
                
                if (!IMS_ORG_ID) {
                  if (context.logger) {
                    context.logger.error('IMS_ORG_ID not found in secrets. Add IMS_ORG_ID to secrets.yaml');
                  }
                  return {
                    sku: args.sku,
                    warehouseAvailability: null
                  };
                }
                
                // Build headers object with OAuth access token and required IMS headers
                const headers = {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                  'x-api-key': CLIENT_ID,
                  'x-gw-ims-org-id': IMS_ORG_ID,
                  'Origin': originHeader
                };
                
                // Use globalThis.fetch to send POST request with body and auth
                const response = await globalThis.fetch(
                  url,
                  {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                      sku: args.sku,
                      ipAddress: args.ipAddress || "3.131.150.126"
                    })
                  }
                );
                
                if (response.ok) {
                  warehouseData = await response.json();
                } else {
                  const errorText = await response.text();
                  if (context.logger) {
                    context.logger.error('Warehouse lookup failed:', response.status, errorText);
                  }
                }
              } catch (error) {
                if (context.logger) {
                  context.logger.error('Warehouse lookup error:', error.message);
                }
              }
              
              return {
                sku: args.sku,
                warehouseAvailability: warehouseData
              };
            } catch (error) {
              if (context.responseConfig?.includeHTTPDetails) {
                console.error('Product with warehouse error:', error.message);
              }
              return null;
            }
          },
        },
      },
    },
  };