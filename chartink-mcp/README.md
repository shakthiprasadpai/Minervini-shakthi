# Chartink MCP integration

This folder adds the [Chartink MCP server](https://github.com/shahparthiv/chartink-mcp) to the Minervini screener repository. It runs as a separate stdio MCP process alongside the existing TypeScript/Express application; it does not change the app's HTTP API or frontend.

## Install

Requires Python 3.10 or newer. From the repository root:

```bash
python3 -m venv chartink-mcp/.venv
chartink-mcp/.venv/bin/python -m pip install -r chartink-mcp/requirements.txt
```

On Windows, use `chartink-mcp\\.venv\\Scripts\\python.exe` instead of `chartink-mcp/.venv/bin/python`.

## Register in an MCP client

Copy the `mcpServers.chartink` entry from [`mcp-config.example.json`](mcp-config.example.json) into your MCP client's configuration, replacing both placeholder paths with absolute paths on your machine. The example uses `.venv` created above. Restart the client after editing its configuration. The server communicates over stdio, so do not run it as an Express HTTP route.

Available tools: `set_cookies`, `run_screener`, `run_multiple_screeners`, `run_backtest`, and `run_saved_screener`.

## Authenticate

In the configured MCP client, call `set_cookies` with the full Cookie header copied from a logged-in Chartink browser request. Cookies stay in the MCP server process memory and must be set again when that process restarts or the Chartink session expires. Never commit or share cookie values; they are account credentials. Do not put them in `.env`, source files, or this repository.

The Chartink query syntax skill and reference remain maintained in the upstream [chartink-mcp repository](https://github.com/shahparthiv/chartink-mcp/tree/main/skills/chartink-query).

## Usage

Ask your MCP-compatible agent to create a Chartink scan and call `run_screener` with its scan clause, or use `run_backtest` / `run_saved_screener`. Chartink results and backtests are informational and are not investment advice.
