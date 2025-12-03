# Pattern 04: MCP Wrapper

## What is MCP?
Model Context Protocol (MCP) is a standard for exposing tools to AI models. It lets you:
- Connect any API or service as a "tool"
- Use these tools from Claude Desktop, VS Code, or any MCP client
- Share tool collections across projects

## When to Use This Pattern
✅ Use Pattern 04 when:
- You need to integrate 3+ external services
- Multiple projects need the same tools
- You want to expose tools to Claude Desktop
- You need standardized tool interfaces

## How to Set Up

### 1. Configure Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-factory": {
      "command": "node",
      "args": ["/path/to/agent-factory/04-mcp-wrapper/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "RESEND_API_KEY": "re_...",
        "REDIS_URL": "redis://..."
      }
    }
  }
}
```

### 2. Run the Server
```bash
# For development (with auto-reload)
npm run dev:pattern4

# For production
npm run pattern4

# Or compile and run
npx tsc 04-mcp-wrapper/server.ts
node 04-mcp-wrapper/server.js
```

### 3. Use in Claude Desktop
Once connected, you can use the tools directly:
- "Use the query_database tool to get all users"
- "Send an email to john@example.com with the report"
- "Scrape the pricing from competitor.com"

## Available Tools

### 1. Database Query
```typescript
query_database({
  query: "SELECT * FROM users WHERE active = true",
  database: "main" // optional
})
```

### 2. Send Email
```typescript
send_email({
  to: "user@example.com",
  subject: "Your Report",
  body: "<h1>Report Ready</h1>",
  isHtml: true
})
```

### 3. Web Scraper
```typescript
scrape_web({
  url: "https://example.com/pricing",
  selector: ".price-card" // CSS selector
})
```

### 4. API Request
```typescript
api_request({
  url: "https://api.example.com/data",
  method: "POST",
  headers: { "Authorization": "Bearer token" },
  body: { key: "value" }
})
```

### 5. File Operations
```typescript
file_operation({
  operation: "read", // read|write|append|delete|list
  path: "/path/to/file.txt",
  content: "data" // for write/append
})
```

### 6. Cache Operations
```typescript
cache_operation({
  operation: "set", // get|set|delete|exists
  key: "user:123",
  value: '{"name": "John"}',
  ttl: 3600 // seconds
})
```

## Adding Your Own Tools

1. **Define the tool schema:**
```typescript
const myTool: ToolSchema = {
  name: "my_tool",
  description: "What it does",
  inputSchema: {
    type: "object",
    properties: {
      param1: { type: "string", description: "..." }
    },
    required: ["param1"]
  }
};
```

2. **Implement the handler:**
```typescript
async function executeMyTool(param1: string) {
  // Your implementation
  return { result: "data" };
}
```

3. **Register in the switch statement:**
```typescript
case "my_tool":
  result = await executeMyTool(args.param1);
  break;
```

## Real Implementation Examples

### Stripe Integration
```typescript
const stripeCheckout: ToolSchema = {
  name: "create_checkout_session",
  description: "Create a Stripe checkout session",
  inputSchema: {
    type: "object",
    properties: {
      priceId: { type: "string" },
      customerId: { type: "string" },
      successUrl: { type: "string" },
      cancelUrl: { type: "string" }
    },
    required: ["priceId", "successUrl", "cancelUrl"]
  }
};

async function createCheckoutSession(params: any) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return await stripe.checkout.sessions.create({
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer: params.customerId
  });
}
```

### GitHub Integration
```typescript
const githubTool: ToolSchema = {
  name: "github_operation",
  description: "Interact with GitHub API",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["create_issue", "list_prs", "merge_pr"]
      },
      repo: { type: "string" },
      data: { type: "object" }
    },
    required: ["operation", "repo"]
  }
};
```

## Testing Your MCP Server

### Manual Testing
```bash
# Test with sample input
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npm run pattern4
```

### Using with a Test Client
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client({
  name: "test-client",
  version: "1.0.0",
});

// Connect and call tools
await client.callTool("send_email", {
  to: "test@example.com",
  subject: "Test",
  body: "Hello World"
});
```

## Environment Variables
Create a `.env` file with your actual credentials:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/db

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Cache (Upstash Redis)
REDIS_URL=redis://default:password@server.upstash.io

# APIs
STRIPE_SECRET_KEY=sk_test_xxxxx
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

## Troubleshooting

### Server won't start
- Check all dependencies are installed: `npm install`
- Verify TypeScript compiles: `npx tsc --noEmit`
- Check error logs in Claude Desktop

### Tools not appearing in Claude
- Restart Claude Desktop after config changes
- Check the config file path is correct
- Verify server is running: `ps aux | grep server.js`

### Tool execution fails
- Check environment variables are set
- Look at server logs (stderr output)
- Test the function directly before wrapping in MCP

## Next Steps
When your MCP server has too many tools (20+) or needs a UI:
→ Move to Pattern 05 (Full Application)