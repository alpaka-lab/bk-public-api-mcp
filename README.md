# bitkub-api-mcp

MCP (Model Context Protocol) server for Bitkub cryptocurrency exchange API:
- **[Bitkub](https://www.bitkub.com/)** - Thailand's leading cryptocurrency exchange

This server enables AI assistants like Claude to access real-time cryptocurrency market data, trading operations, and wallet management.

## Features

### Bitkub Cryptocurrency Exchange

**Public Endpoints (10 tools)** - No authentication required:
- Real-time cryptocurrency market data
- Market tickers with 24h statistics
- Order book information (bids/asks/depth)
- Historical OHLCV candlestick data
- Recent trade history
- Server status and time synchronization
- Available trading pairs and symbols

**Secure Endpoints (16 tools)** - Requires API key and secret:
- **User Account**: Trading credits, deposit/withdraw limits, coin conversion history
- **Trading & Wallet**: View balances, place/cancel orders, order history, order details, WebSocket token
- **Fiat Operations**: Bank account management, THB withdrawals, deposit/withdrawal history

## Requirements

- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Development

Watch mode for automatic rebuilds:

```bash
npm run dev
```

## Configuration

### Bitkub API Keys (Optional - for secure endpoints only)

To use Bitkub secure endpoints (trading, wallet, fiat operations):

1. Log in to your [Bitkub account](https://www.bitkub.com/)
2. Go to Settings → API Management
3. Create a new API key and secret
4. **Important**: Keep your API secret secure and never share it

Note: Public endpoints (market data, tickers, order books) work without any API keys.

### Claude Desktop Setup

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**For public endpoints only (no authentication):**
```json
{
  "mcpServers": {
    "bitkub-api-mcp": {
      "command": "node",
      "args": ["/path/to/bitkub-api-mcp/dist/index.js"]
    }
  }
}
```

**For secure endpoints (with authentication):**
```json
{
  "mcpServers": {
    "bitkub-api-mcp": {
      "command": "node",
      "args": ["/path/to/bitkub-api-mcp/dist/index.js"],
      "env": {
        "BITKUB_API_KEY": "your-bitkub-api-key-here",
        "BITKUB_API_SECRET": "your-bitkub-api-secret-here"
      }
    }
  }
}
```

Replace:
- `/path/to/bitkub-api-mcp` with the actual path to this project
- `your-bitkub-api-key-here` and `your-bitkub-api-secret-here` with your Bitkub API credentials

## Available Tools

Total: **26 tools** (10 public + 16 secure)

### Bitkub Public Endpoints (10 tools)

These endpoints don't require authentication and provide read-only access to market data.

| Tool | Description |
|------|-------------|
| `bitkub_public_status` | Get the operational status of Bitkub API endpoint groups |
| `bitkub_public_servertime` | Get the current Bitkub server timestamp in milliseconds |
| `bitkub_public_servertime_v3` | Get the current Bitkub server timestamp (v3 API) |
| `bitkub_public_symbols` | Get all available trading symbols/pairs with configuration |
| `bitkub_public_tradingview_history` | Get historical OHLCV candlestick data |
| `bitkub_public_ticker` | Get current market price and 24h statistics |
| `bitkub_public_bids` | Get open buy orders from the order book |
| `bitkub_public_asks` | Get open sell orders from the order book |
| `bitkub_public_depth` | Get aggregated order book depth |
| `bitkub_public_trades` | Get recent completed trades |

### Bitkub Secure Endpoints (16 tools)

These endpoints require `BITKUB_API_KEY` and `BITKUB_API_SECRET` for authentication.

#### User Account Tools (3 tools)

| Tool | Description |
|------|-------------|
| `bitkub_secure_trading_credits` | Check available trading credits balance |
| `bitkub_secure_user_limits` | Check deposit and withdrawal limitations |
| `bitkub_secure_coin_convert_history` | List coin conversion history with pagination |

#### Trading & Wallet Tools (9 tools)

| Tool | Description |
|------|-------------|
| `bitkub_secure_wallet` | Get available balances for all assets |
| `bitkub_secure_balances` | Get available and reserved balances for all assets |
| `bitkub_secure_place_bid` | Create a buy order (limit or market) |
| `bitkub_secure_place_ask` | Create a sell order (limit or market) |
| `bitkub_secure_cancel_order` | Cancel an open order by order ID |
| `bitkub_secure_my_open_orders` | List all open orders for a trading pair |
| `bitkub_secure_my_order_history` | List completed order history with pagination |
| `bitkub_secure_order_info` | Get detailed information about a specific order |
| `bitkub_secure_wstoken` | Get WebSocket authentication token |

#### Fiat Operations Tools (4 tools)

| Tool | Description |
|------|-------------|
| `bitkub_secure_fiat_accounts` | List all approved bank accounts for withdrawal |
| `bitkub_secure_fiat_withdraw` | Withdraw THB to an approved bank account |
| `bitkub_secure_fiat_deposit_history` | List fiat deposit history with pagination |
| `bitkub_secure_fiat_withdraw_history` | List fiat withdrawal history with pagination |

### Tool Details

#### bitkub_public_status
Get the operational status of Bitkub API endpoint groups.

```
No parameters required
```

#### bitkub_public_servertime
Get the current Bitkub server timestamp in milliseconds.

```
No parameters required
```

#### bitkub_public_servertime_v3
Get the current Bitkub server timestamp (v3 API) for synchronization.

```
No parameters required
```

#### bitkub_public_symbols
Get all available trading symbols/pairs on Bitkub with their configuration (base asset, quote asset, status, price scale, quantity scale).

```
No parameters required
```

#### bitkub_public_tradingview_history
Get historical OHLCV (candlestick) data for TradingView charts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol (e.g., `BTC_THB`) |
| `resolution` | string | Yes | Chart interval: `1`, `5`, `15`, `60`, `240`, or `1D` |
| `from` | number | Yes | Start timestamp (Unix seconds) |
| `to` | number | Yes | End timestamp (Unix seconds) |

#### bitkub_public_ticker
Get current market price and 24h statistics for trading pairs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sym` | string | No | Trading pair symbol (e.g., `btc_thb`). If omitted, returns all tickers. |

#### bitkub_public_bids
Get open buy orders (bids) for a trading pair from the order book.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sym` | string | Yes | Trading pair symbol (e.g., `btc_thb`) |
| `lmt` | number | No | Maximum number of orders to return (default: 10) |

#### bitkub_public_asks
Get open sell orders (asks) for a trading pair from the order book.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sym` | string | Yes | Trading pair symbol (e.g., `btc_thb`) |
| `lmt` | number | No | Maximum number of orders to return (default: 10) |

#### bitkub_public_depth
Get aggregated order book depth data showing bids and asks at various price levels.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sym` | string | Yes | Trading pair symbol (e.g., `btc_thb`) |
| `lmt` | number | No | Depth size - number of price levels to return (default: 10) |

#### bitkub_public_trades
Get recent completed trades for a trading pair.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sym` | string | Yes | Trading pair symbol (e.g., `btc_thb`) |
| `lmt` | number | No | Maximum number of trades to return (default: 10) |

## Available Resources

### mcp://api/info

Returns information about this MCP server and all available Bitkub API endpoints.

## Common Trading Pairs

| Symbol | Description |
|--------|-------------|
| `btc_thb` | Bitcoin / Thai Baht |
| `eth_thb` | Ethereum / Thai Baht |
| `usdt_thb` | Tether / Thai Baht |
| `xrp_thb` | Ripple / Thai Baht |
| `doge_thb` | Dogecoin / Thai Baht |

Use `bitkub_public_symbols` to get the complete list of available trading pairs.

## API Documentation

For full Bitkub API details, see the [Bitkub Official API Docs](https://github.com/bitkub/bitkub-official-api-docs).

## License

MIT
