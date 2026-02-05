# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build    # Compile TypeScript to dist/
npm run dev      # Watch mode for development
npm start        # Run the compiled server
npm run inspect  # Test with MCP Inspector
```

## Architecture

This is an MCP (Model Context Protocol) server built with TypeScript using the `@modelcontextprotocol/sdk`.

**Entry point**: `src/index.ts` - Creates an `McpServer` instance, registers tools/resources, and connects via `StdioServerTransport`.

**Integrated APIs**:
1. **Bitkub API** (`https://api.bitkub.com`) - Cryptocurrency exchange with both public and secure endpoints

**Helper Functions**:
- `fetchBitkub()` - Makes requests to Bitkub public API endpoints
- `fetchBitkubSecure()` - Makes authenticated requests to Bitkub secure endpoints (uses HMAC-SHA256 signature with `BITKUB_API_KEY` and `BITKUB_API_SECRET`)
- `generateBitkubSignature()` - Generates HMAC-SHA256 signature for Bitkub authentication

## MCP Concepts

**Tools** - Functions that the AI can execute to perform actions. They accept input parameters (validated with Zod schemas) and return results. Use for operations like API calls, calculations, or data transformations.

**Resources** - Read-only data sources identified by URIs (e.g., `mcp://info/about`). They expose content (text, JSON, etc.) that the AI can read. Use for configuration, static data, or file-like content.

**Prompts** - Reusable prompt templates with optional arguments. They return pre-defined message structures that guide the AI's behavior. Use for standardized workflows or complex instructions.

## Key APIs

Use these methods (not the deprecated `tool()`/`resource()`/`prompt()`):
- `server.registerTool()` - Register tools with input schemas using Zod
- `server.registerResource()` - Register static or template-based resources
- `server.registerPrompt()` - Register prompts with argument schemas

**Output**: Compiled to `dist/` directory, runs as a stdio-based MCP server.

## API Structure

### Bitkub Cryptocurrency Exchange (26 tools)

**Tool Naming Convention**:
- Public endpoints: `bitkub_public_*` (e.g., `bitkub_public_ticker`, `bitkub_public_trades`)
- Secure endpoints: `bitkub_secure_*` (e.g., `bitkub_secure_wallet`, `bitkub_secure_balances`)

**Phase 1 (Implemented)**: 10 public endpoints - market data, tickers, order books, trades (no authentication required)

**Phase 2 (Implemented)**: 16 secure endpoints requiring HMAC-SHA256 authentication with `BITKUB_API_KEY` and `BITKUB_API_SECRET`:
- **User endpoints (3 tools)**: trading credits, limits, coin conversion history
- **Trading/Wallet endpoints (9 tools)**: wallet balances, place orders, cancel orders, order history, WebSocket token
- **Fiat endpoints (4 tools)**: bank accounts, withdrawals, deposit/withdrawal history

API documentation: https://github.com/bitkub/bitkub-official-api-docs

**Authentication**: Secure endpoints use HMAC-SHA256 signature with timestamp validation. Signature format: `{timestamp}{method}{path}{query_params}{json_payload}`. Get API keys from: https://www.bitkub.com/publicapi

**Total**: 26 tools + 1 resource (10 Bitkub public + 16 Bitkub secure)

## Claude Desktop Integration

Configure in `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "bitkub-api-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "BITKUB_API_KEY": "your-bitkub-api-key-here",
        "BITKUB_API_SECRET": "your-bitkub-api-secret-here"
      }
    }
  }
}
```

**Environment Variables**:
- `BITKUB_API_KEY` and `BITKUB_API_SECRET`: Required for Bitkub secure endpoints (get from https://www.bitkub.com/publicapi)
- Bitkub public endpoints work without any authentication
