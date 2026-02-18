/**
 * Cloudflare Worker: Vividigit Checkout
 * Creates Revolut Merchant API orders and returns checkout URLs.
 *
 * Environment variables (set in Cloudflare dashboard):
 *   REVOLUT_API_KEY  — Revolut Merchant API secret key
 *   REVOLUT_ENV      — "sandbox" or "production" (default: sandbox)
 *   ALLOWED_ORIGIN   — Your site origin, e.g. "https://vividigit.com"
 *
 * Deploy:
 *   1. Install Wrangler: npm install -g wrangler
 *   2. cd workers/checkout
 *   3. wrangler login
 *   4. wrangler deploy
 *
 * Test (sandbox):
 *   curl -X POST https://vividigit-checkout.workers.dev/create-order \
 *     -H "Content-Type: application/json" \
 *     -d '{"items":{"seo-audit":{"title":"SEO Audit","tierName":"M","price":800}},"total":800,"currency":"USD"}'
 */

const REVOLUT_URLS = {
    sandbox: 'https://sandbox-merchant.revolut.com/api/1.0/orders',
    production: 'https://merchant.revolut.com/api/1.0/orders'
};

export default {
    async fetch(request, env) {
        // CORS headers
        const origin = env.ALLOWED_ORIGIN || '*';
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const url = new URL(request.url);

        if (url.pathname === '/create-order' && request.method === 'POST') {
            return handleCreateOrder(request, env, corsHeaders);
        }

        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: corsHeaders
        });
    }
};

async function handleCreateOrder(request, env, corsHeaders) {
    try {
        const body = await request.json();
        const { items, modifiers, total, currency, pageUrl } = body;

        if (!items || !total || total <= 0) {
            return new Response(JSON.stringify({ error: 'Invalid order: no items or zero total' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Build description from cart items
        const itemNames = Object.values(items).map(i => i.title + ' (' + i.tierName + ')');
        let description = itemNames.join(', ');
        if (modifiers?.languages > 0) description += ' +' + modifiers.languages + ' lang';
        if (modifiers?.countries > 0) description += ' +' + modifiers.countries + ' countries';

        // Create Revolut order
        const revolutEnv = env.REVOLUT_ENV || 'sandbox';
        const revolutUrl = REVOLUT_URLS[revolutEnv] || REVOLUT_URLS.sandbox;

        const orderPayload = {
            amount: total * 100, // Revolut expects minor units (cents)
            currency: currency || 'USD',
            description: description.substring(0, 1024), // Revolut limit
            metadata: {
                source: 'vividigit-website',
                page_url: pageUrl || '',
                items: JSON.stringify(items).substring(0, 500)
            }
        };

        const response = await fetch(revolutUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + env.REVOLUT_API_KEY,
                'Content-Type': 'application/json',
                'Revolut-Api-Version': '2024-09-01'
            },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Revolut API error:', response.status, errorText);
            return new Response(JSON.stringify({
                error: 'Payment service error',
                status: response.status
            }), {
                status: 502,
                headers: corsHeaders
            });
        }

        const order = await response.json();

        return new Response(JSON.stringify({
            order_id: order.id,
            checkout_url: order.checkout_url,
            state: order.state
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        console.error('Worker error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
