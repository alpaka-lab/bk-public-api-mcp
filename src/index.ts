#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import crypto from "crypto";

const BITKUB_API_BASE = "https://api.bitkub.com";

// Create an MCP server
const server = new McpServer({
  name: "bitkub-api-mcp",
  version: "2.0.0",
});

// Helper function for Bitkub API calls (public endpoints)
async function fetchBitkub(endpoint: string, params?: Record<string, string | number>) {
  const url = new URL(endpoint, BITKUB_API_BASE);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Helper function to generate HMAC-SHA256 signature for Bitkub secure endpoints
function generateBitkubSignature(
  timestamp: number,
  method: string,
  path: string,
  queryString: string,
  body: string,
  secret: string
): string {
  // Signing string format: {timestamp}{method}{path}{query_params}{json_payload}
  const signingString = `${timestamp}${method}${path}${queryString}${body}`;
  const signature = crypto.createHmac("sha256", secret).update(signingString).digest("hex");
  return signature;
}

// Helper function for Bitkub secure API calls (authenticated endpoints)
async function fetchBitkubSecure(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  params?: Record<string, any>,
  body?: Record<string, any>
) {
  const apiKey = process.env.BITKUB_API_KEY;
  const apiSecret = process.env.BITKUB_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("BITKUB_API_KEY and BITKUB_API_SECRET environment variables are required for secure endpoints");
  }

  // Get fresh timestamp from server
  const servertimeResponse = await fetchBitkub("/api/v3/servertime");
  const timestamp = servertimeResponse;

  // Build URL and extract path
  const url = new URL(endpoint, BITKUB_API_BASE);
  const path = url.pathname;

  // Build query string for GET requests
  let queryString = "";
  if (method === "GET" && params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    const sortedParams = Array.from(url.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b));
    queryString = sortedParams.length > 0 ? `?${sortedParams.map(([k, v]) => `${k}=${v}`).join("&")}` : "";
  }

  // Build JSON body for POST requests
  const jsonBody = body ? JSON.stringify(body) : "";

  // Generate signature
  const signature = generateBitkubSignature(timestamp, method, path, queryString, jsonBody, apiSecret);

  // Make request with authentication headers
  const requestOptions: RequestInit = {
    method,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-BTK-APIKEY": apiKey,
      "X-BTK-TIMESTAMP": String(timestamp),
      "X-BTK-SIGN": signature,
    },
  };

  if (method === "POST" && jsonBody) {
    requestOptions.body = jsonBody;
  }

  const response = await fetch(url.toString(), requestOptions);
  if (!response.ok) {
    throw new Error(`Secure API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}


// =============================================================================
// SECURE ENDPOINTS (Authenticated API - Requires BITKUB_API_KEY and BITKUB_API_SECRET)
// =============================================================================

// USER ENDPOINTS

// 1. POST /api/v3/user/trading-credits - Check trading credit balance
server.registerTool(
  "bitkub_secure_trading_credits",
  {
    description: "Check available trading credits balance for the authenticated user",
    inputSchema: {},
  },
  async () => {
    const data = await fetchBitkubSecure("/api/v3/user/trading-credits", "POST");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 2. POST /api/v3/user/limits - Check deposit/withdraw limitations
server.registerTool(
  "bitkub_secure_user_limits",
  {
    description: "Check deposit and withdrawal limitations and current usage for the authenticated user",
    inputSchema: {},
  },
  async () => {
    const data = await fetchBitkubSecure("/api/v3/user/limits", "POST");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 3. GET /api/v3/user/coin-convert-history - List coin conversion history
server.registerTool(
  "bitkub_secure_coin_convert_history",
  {
    description: "List coin conversion history with pagination for the authenticated user",
    inputSchema: {
      p: z.number().optional().describe("Page number (default: 1)"),
      lmt: z.number().optional().describe("Limit per page (default: 100)"),
      sort: z.enum(["1", "-1"]).optional().describe("Sort order: 1 for ascending, -1 for descending"),
      status: z.enum(["success", "fail", "all"]).optional().describe("Filter by status"),
      sym: z.string().optional().describe("Filter by symbol (e.g., KUB)"),
      start: z.number().optional().describe("Start timestamp (Unix seconds)"),
      end: z.number().optional().describe("End timestamp (Unix seconds)"),
    },
  },
  async ({ p, lmt, sort, status, sym, start, end }) => {
    const params: Record<string, any> = {};
    if (p) params.p = p;
    if (lmt) params.lmt = lmt;
    if (sort) params.sort = sort;
    if (status) params.status = status;
    if (sym) params.sym = sym;
    if (start) params.start = start;
    if (end) params.end = end;

    const data = await fetchBitkubSecure("/api/v3/user/coin-convert-history", "GET", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// TRADING & WALLET ENDPOINTS

// 4. POST /api/v3/market/wallet - Get user available balances
server.registerTool(
  "bitkub_secure_wallet",
  {
    description: "Get available balances for all assets in the authenticated user's wallet",
    inputSchema: {},
  },
  async () => {
    const data = await fetchBitkubSecure("/api/v3/market/wallet", "POST");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 5. POST /api/v3/market/balances - Get available and reserved balances
server.registerTool(
  "bitkub_secure_balances",
  {
    description: "Get both available and reserved balances for all assets in the authenticated user's wallet",
    inputSchema: {},
  },
  async () => {
    const data = await fetchBitkubSecure("/api/v3/market/balances", "POST");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 6. POST /api/v3/market/place-bid - Create a buy order
server.registerTool(
  "bitkub_secure_place_bid",
  {
    description: "Create a buy order for a trading pair. Supports both limit and market orders.",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., btc_thb)"),
      amt: z.number().describe("Amount in quote currency (THB) to spend"),
      rat: z.number().describe("Rate/price per unit (use 0 for market orders)"),
      typ: z.enum(["limit", "market"]).describe("Order type: limit or market"),
      client_id: z.string().optional().describe("Your reference ID for this order"),
      post_only: z.boolean().optional().describe("Post-only flag (limit orders only)"),
    },
  },
  async ({ sym, amt, rat, typ, client_id, post_only }) => {
    const body: Record<string, any> = { sym, amt, rat, typ };
    if (client_id) body.client_id = client_id;
    if (post_only !== undefined) body.post_only = post_only;

    const data = await fetchBitkubSecure("/api/v3/market/place-bid", "POST", undefined, body);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 7. POST /api/v3/market/place-ask - Create a sell order
server.registerTool(
  "bitkub_secure_place_ask",
  {
    description: "Create a sell order for a trading pair. Supports both limit and market orders.",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., btc_thb)"),
      amt: z.number().describe("Amount of base currency (crypto) to sell"),
      rat: z.number().describe("Rate/price per unit (use 0 for market orders)"),
      typ: z.enum(["limit", "market"]).describe("Order type: limit or market"),
      client_id: z.string().optional().describe("Your reference ID for this order"),
      post_only: z.boolean().optional().describe("Post-only flag (limit orders only)"),
    },
  },
  async ({ sym, amt, rat, typ, client_id, post_only }) => {
    const body: Record<string, any> = { sym, amt, rat, typ };
    if (client_id) body.client_id = client_id;
    if (post_only !== undefined) body.post_only = post_only;

    const data = await fetchBitkubSecure("/api/v3/market/place-ask", "POST", undefined, body);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 8. POST /api/v3/market/cancel-order - Cancel an open order
server.registerTool(
  "bitkub_secure_cancel_order",
  {
    description: "Cancel an open order by order ID",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., thb_btc)"),
      id: z.string().describe("Order ID to cancel"),
      sd: z.enum(["buy", "sell"]).describe("Order side: buy or sell"),
    },
  },
  async ({ sym, id, sd }) => {
    const body = { sym, id, sd };
    const data = await fetchBitkubSecure("/api/v3/market/cancel-order", "POST", undefined, body);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 9. GET /api/v3/market/my-open-orders - List all open orders
server.registerTool(
  "bitkub_secure_my_open_orders",
  {
    description: "List all open orders for a specific trading pair for the authenticated user",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., btc_thb)"),
    },
  },
  async ({ sym }) => {
    const params = { sym };
    const data = await fetchBitkubSecure("/api/v3/market/my-open-orders", "GET", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 10. GET /api/v3/market/my-order-history - List order history with pagination
server.registerTool(
  "bitkub_secure_my_order_history",
  {
    description: "List completed/matched order history for a trading pair with pagination support (page-based or keyset cursor)",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., btc_thb)"),
      p: z.number().optional().describe("Page number (for page-based pagination, cannot use with cursor)"),
      lmt: z.number().optional().describe("Limit per page (default: 10, min: 1)"),
      cursor: z.string().optional().describe("Base64-encoded cursor for keyset pagination (cannot use with p)"),
      start: z.number().optional().describe("Start timestamp (Unix seconds)"),
      end: z.number().optional().describe("End timestamp (Unix seconds)"),
      pagination_type: z.enum(["page", "keyset"]).optional().describe("Pagination type: page or keyset (default: page)"),
    },
  },
  async ({ sym, p, lmt, cursor, start, end, pagination_type }) => {
    const params: Record<string, any> = { sym };
    if (p) params.p = p;
    if (lmt) params.lmt = lmt;
    if (cursor) params.cursor = cursor;
    if (start) params.start = start;
    if (end) params.end = end;
    if (pagination_type) params.pagination_type = pagination_type;

    const data = await fetchBitkubSecure("/api/v3/market/my-order-history", "GET", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 11. GET /api/v3/market/order-info - Get details of a specific order
server.registerTool(
  "bitkub_secure_order_info",
  {
    description: "Get detailed information about a specific order including status, filled amount, and history",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., btc_thb)"),
      id: z.string().describe("Order ID"),
      sd: z.enum(["buy", "sell"]).describe("Order side: buy or sell"),
    },
  },
  async ({ sym, id, sd }) => {
    const params = { sym, id, sd };
    const data = await fetchBitkubSecure("/api/v3/market/order-info", "GET", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 12. POST /api/v3/market/wstoken - Get WebSocket token
server.registerTool(
  "bitkub_secure_wstoken",
  {
    description: "Get WebSocket authentication token for real-time data streaming",
    inputSchema: {},
  },
  async () => {
    const data = await fetchBitkubSecure("/api/v3/market/wstoken", "POST");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// FIAT ENDPOINTS

// 13. POST /api/v3/fiat/accounts - List approved bank accounts
server.registerTool(
  "bitkub_secure_fiat_accounts",
  {
    description: "List all approved bank accounts for fiat withdrawal",
    inputSchema: {
      p: z.number().optional().describe("Page number for pagination"),
      lmt: z.number().optional().describe("Limit per page"),
    },
  },
  async ({ p, lmt }) => {
    const params: Record<string, any> = {};
    if (p) params.p = p;
    if (lmt) params.lmt = lmt;

    const data = await fetchBitkubSecure("/api/v3/fiat/accounts", "POST", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 14. POST /api/v3/fiat/withdraw - Withdraw fiat to bank account
server.registerTool(
  "bitkub_secure_fiat_withdraw",
  {
    description: "Withdraw THB to an approved bank account",
    inputSchema: {
      id: z.string().describe("Bank account ID (from fiat/accounts)"),
      amt: z.number().describe("Withdrawal amount in THB"),
    },
  },
  async ({ id, amt }) => {
    const params = { id, amt };
    const data = await fetchBitkubSecure("/api/v3/fiat/withdraw", "POST", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 15. POST /api/v3/fiat/deposit-history - List fiat deposit history
server.registerTool(
  "bitkub_secure_fiat_deposit_history",
  {
    description: "List fiat (THB) deposit history with pagination",
    inputSchema: {
      p: z.number().optional().describe("Page number for pagination"),
      lmt: z.number().optional().describe("Limit per page"),
    },
  },
  async ({ p, lmt }) => {
    const params: Record<string, any> = {};
    if (p) params.p = p;
    if (lmt) params.lmt = lmt;

    const data = await fetchBitkubSecure("/api/v3/fiat/deposit-history", "POST", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 16. POST /api/v3/fiat/withdraw-history - List fiat withdrawal history
server.registerTool(
  "bitkub_secure_fiat_withdraw_history",
  {
    description: "List fiat (THB) withdrawal history with pagination",
    inputSchema: {
      p: z.number().optional().describe("Page number for pagination"),
      lmt: z.number().optional().describe("Limit per page"),
    },
  },
  async ({ p, lmt }) => {
    const params: Record<string, any> = {};
    if (p) params.p = p;
    if (lmt) params.lmt = lmt;

    const data = await fetchBitkubSecure("/api/v3/fiat/withdraw-history", "POST", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// =============================================================================
// NON-SECURE ENDPOINTS (Public API - No authentication required)
// =============================================================================

// 1. GET /api/status - Get API status
server.registerTool(
  "bitkub_public_status",
  {
    description: "Get the operational status of Bitkub API endpoint groups",
    inputSchema: {},
  },
  async () => {
    const data = await fetchBitkub("/api/status");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 2. GET /api/servertime - Get server timestamp (legacy)
server.registerTool(
  "bitkub_public_servertime",
  {
    description: "Get the current Bitkub server timestamp in milliseconds",
    inputSchema: {},
  },
  async () => {
    const data = await fetchBitkub("/api/servertime");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ servertime: data }, null, 2),
        },
      ],
    };
  }
);

// 3. GET /api/v3/servertime - Get server timestamp (v3)
server.registerTool(
  "bitkub_public_servertime_v3",
  {
    description: "Get the current Bitkub server timestamp (v3 API) for synchronization",
    inputSchema: {},
  },
  async () => {
    const data = await fetchBitkub("/api/v3/servertime");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ servertime: data }, null, 2),
        },
      ],
    };
  }
);

// 4. GET /api/v3/market/symbols - Get all trading symbols
server.registerTool(
  "bitkub_public_symbols",
  {
    description: "Get all available trading symbols/pairs on Bitkub with their configuration (base asset, quote asset, status, price scale, quantity scale)",
    inputSchema: {},
  },
  async () => {
    const data = await fetchBitkub("/api/v3/market/symbols");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 5. GET /tradingview/history - Get TradingView historical data
server.registerTool(
  "bitkub_public_tradingview_history",
  {
    description: "Get historical OHLCV (candlestick) data for TradingView charts",
    inputSchema: {
      symbol: z.string().describe("Trading pair symbol (e.g., BTC_THB)"),
      resolution: z.string().describe("Chart interval: 1, 5, 15, 60, 240, or 1D"),
      from: z.number().describe("Start timestamp (Unix seconds)"),
      to: z.number().describe("End timestamp (Unix seconds)"),
    },
  },
  async ({ symbol, resolution, from, to }) => {
    const data = await fetchBitkub("/tradingview/history", {
      symbol,
      resolution,
      from,
      to,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 6. GET /api/v3/market/ticker - Get market ticker
server.registerTool(
  "bitkub_public_ticker",
  {
    description: "Get current market price and 24h statistics for trading pairs. Returns last price, highest bid, lowest ask, 24h high/low, volume, and percent change.",
    inputSchema: {
      sym: z.string().optional().describe("Trading pair symbol (e.g., btc_thb). If omitted, returns all tickers."),
    },
  },
  async ({ sym }) => {
    const params: Record<string, string> = {};
    if (sym) params.sym = sym;

    const data = await fetchBitkub("/api/v3/market/ticker", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 7. GET /api/v3/market/bids - Get open buy orders
server.registerTool(
  "bitkub_public_bids",
  {
    description: "Get open buy orders (bids) for a trading pair from the order book",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., btc_thb)"),
      lmt: z.number().optional().describe("Maximum number of orders to return (default: 10)"),
    },
  },
  async ({ sym, lmt }) => {
    const params: Record<string, string | number> = { sym };
    if (lmt) params.lmt = lmt;

    const data = await fetchBitkub("/api/v3/market/bids", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 8. GET /api/v3/market/asks - Get open sell orders
server.registerTool(
  "bitkub_public_asks",
  {
    description: "Get open sell orders (asks) for a trading pair from the order book",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., btc_thb)"),
      lmt: z.number().optional().describe("Maximum number of orders to return (default: 10)"),
    },
  },
  async ({ sym, lmt }) => {
    const params: Record<string, string | number> = { sym };
    if (lmt) params.lmt = lmt;

    const data = await fetchBitkub("/api/v3/market/asks", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 9. GET /api/v3/market/depth - Get order book depth
server.registerTool(
  "bitkub_public_depth",
  {
    description: "Get aggregated order book depth data showing bids and asks at various price levels",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., btc_thb)"),
      lmt: z.number().optional().describe("Depth size - number of price levels to return (default: 10)"),
    },
  },
  async ({ sym, lmt }) => {
    const params: Record<string, string | number> = { sym };
    if (lmt) params.lmt = lmt;

    const data = await fetchBitkub("/api/v3/market/depth", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// 10. GET /api/v3/market/trades - Get recent trades
server.registerTool(
  "bitkub_public_trades",
  {
    description: "Get recent completed trades for a trading pair. Returns timestamp, price, quantity, and side (buy/sell).",
    inputSchema: {
      sym: z.string().describe("Trading pair symbol (e.g., btc_thb)"),
      lmt: z.number().optional().describe("Maximum number of trades to return (default: 10)"),
    },
  },
  async ({ sym, lmt }) => {
    const params: Record<string, string | number> = { sym };
    if (lmt) params.lmt = lmt;

    const data = await fetchBitkub("/api/v3/market/trades", params);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// =============================================================================
// RESOURCES
// =============================================================================

// Resource: API information
server.registerResource(
  "api-info",
  "mcp://api/info",
  {
    description: "Information about the Bitkub API MCP server",
    mimeType: "application/json",
  },
  async () => {
    return {
      contents: [
        {
          uri: "mcp://api/info",
          mimeType: "application/json",
          text: JSON.stringify({
            name: "Bitkub API MCP Server",
            version: "2.0.0",
            description: "MCP server for Bitkub cryptocurrency exchange API",
            apis: {
              bitkub: {
                name: "Bitkub Cryptocurrency Exchange API",
                documentation: "https://github.com/bitkub/bitkub-official-api-docs",
                base_url: "https://api.bitkub.com",
                authentication: "Requires BITKUB_API_KEY and BITKUB_API_SECRET environment variables for secure endpoints",
                public_endpoints: [
                  "bitkub_public_status - Get API status",
                  "bitkub_public_servertime - Get server timestamp",
                  "bitkub_public_servertime_v3 - Get server timestamp (v3)",
                  "bitkub_public_symbols - Get all trading symbols",
                  "bitkub_public_tradingview_history - Get OHLCV chart data",
                  "bitkub_public_ticker - Get market ticker",
                  "bitkub_public_bids - Get open buy orders",
                  "bitkub_public_asks - Get open sell orders",
                  "bitkub_public_depth - Get order book depth",
                  "bitkub_public_trades - Get recent trades",
                ],
                secure_endpoints: {
                  user: [
                    "bitkub_secure_trading_credits - Check trading credits balance",
                    "bitkub_secure_user_limits - Check deposit/withdraw limitations",
                    "bitkub_secure_coin_convert_history - List coin conversion history",
                  ],
                  trading: [
                    "bitkub_secure_wallet - Get available balances",
                    "bitkub_secure_balances - Get available and reserved balances",
                    "bitkub_secure_place_bid - Create buy order",
                    "bitkub_secure_place_ask - Create sell order",
                    "bitkub_secure_cancel_order - Cancel order",
                    "bitkub_secure_my_open_orders - List open orders",
                    "bitkub_secure_my_order_history - List order history",
                    "bitkub_secure_order_info - Get order details",
                    "bitkub_secure_wstoken - Get WebSocket token",
                  ],
                  fiat: [
                    "bitkub_secure_fiat_accounts - List bank accounts",
                    "bitkub_secure_fiat_withdraw - Withdraw to bank",
                    "bitkub_secure_fiat_deposit_history - List deposit history",
                    "bitkub_secure_fiat_withdraw_history - List withdrawal history",
                  ],
                },
              },
            },
            total_tools: 26,
            tool_breakdown: {
              bitkub_public: 10,
              bitkub_secure: 16,
            },
          }, null, 2),
        },
      ],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bitkub API MCP server running on stdio");
}

main().catch(console.error);
