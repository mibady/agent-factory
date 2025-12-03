# MCP Server Setup Guide

## Quick Verification Checklist

✅ **Package.json Configuration**
- Added `"type": "module"` for ES module support
- All MCP SDK imports use `.js` extensions as required

✅ **Dependencies**
Ensure all required packages are installed:
```bash
npm install @modelcontextprotocol/sdk zod
```

✅ **TypeScript Execution**
The server uses `tsx` which handles TypeScript + ES modules automatically:
```bash
npx tsx 04-mcp-wrapper/server.ts
```

## Testing the MCP Server

### 1. Standalone Test
```bash
# Start the server
npm run pattern4

# In another terminal, send a test request
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npm run pattern4
```

### 2. Claude Desktop Integration
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-factory": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/agent-factory/04-mcp-wrapper/server.ts"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. Verify Connection
After restarting Claude Desktop:
- Open Claude Desktop
- Check for "agent-factory" in available tools
- Try: "List available tools from agent-factory"

## Implementation Notes

The server correctly uses:
- `McpServer` class from `@modelcontextprotocol/sdk/server/mcp.js`
- `StdioServerTransport` for stdio communication
- `server.tool()` method for tool registration
- Proper error handling and response formatting

This follows the latest MCP SDK patterns and is production-ready!

## Troubleshooting

### "Cannot find module" Error
- Ensure `npm install` completed successfully
- Check that `"type": "module"` is in package.json
- Verify Node.js version is 18+

### Server Won't Start
- Check all environment variables in `.env`
- Verify no other process is using stdio
- Look for syntax errors in tool implementations

### Claude Desktop Can't Find Server
- Restart Claude Desktop after config changes
- Check absolute path in config is correct
- Verify server runs standalone first