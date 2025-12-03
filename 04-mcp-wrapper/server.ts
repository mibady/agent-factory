import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
  TextContentSchema,
  ImageContentSchema,
  EmbeddedContentSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import 'dotenv/config';

/**
 * Pattern 04: MCP Wrapper Server
 *
 * This server exposes your tools to any MCP-compatible client
 * (Claude Desktop, VS Code, custom clients, etc.)
 *
 * Add your own tools by following the examples below
 */

// Server metadata
const SERVER_NAME = "agent-factory-mcp";
const SERVER_VERSION = "1.0.0";
const SERVER_DESCRIPTION = "MCP server with example integration tools";

// ============================================
// TOOL DEFINITIONS
// ============================================

/**
 * Tool 1: Database Query
 * Example of a database integration tool
 */
const databaseQueryTool: ToolSchema = {
  name: "query_database",
  description: "Execute a database query and return results",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "SQL query to execute",
      },
      database: {
        type: "string",
        description: "Database name",
        default: "main",
      },
    },
    required: ["query"],
  },
};

/**
 * Tool 2: Send Email
 * Example of an email service integration
 */
const sendEmailTool: ToolSchema = {
  name: "send_email",
  description: "Send an email via SMTP or API",
  inputSchema: {
    type: "object",
    properties: {
      to: {
        type: "string",
        description: "Recipient email address",
      },
      subject: {
        type: "string",
        description: "Email subject",
      },
      body: {
        type: "string",
        description: "Email body (HTML or plain text)",
      },
      isHtml: {
        type: "boolean",
        description: "Whether body is HTML",
        default: false,
      },
    },
    required: ["to", "subject", "body"],
  },
};

/**
 * Tool 3: Web Scraper
 * Example of a web scraping tool
 */
const webScraperTool: ToolSchema = {
  name: "scrape_web",
  description: "Scrape content from a web page",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "URL to scrape",
      },
      selector: {
        type: "string",
        description: "CSS selector for content extraction",
        default: "body",
      },
    },
    required: ["url"],
  },
};

/**
 * Tool 4: API Request
 * Generic HTTP API request tool
 */
const apiRequestTool: ToolSchema = {
  name: "api_request",
  description: "Make an HTTP request to any API",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "API endpoint URL",
      },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        description: "HTTP method",
        default: "GET",
      },
      headers: {
        type: "object",
        description: "Request headers",
        default: {},
      },
      body: {
        type: "object",
        description: "Request body (for POST/PUT/PATCH)",
      },
    },
    required: ["url"],
  },
};

/**
 * Tool 5: File Operations
 * File system operations tool
 */
const fileOperationsTool: ToolSchema = {
  name: "file_operation",
  description: "Perform file system operations",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["read", "write", "append", "delete", "list"],
        description: "Operation to perform",
      },
      path: {
        type: "string",
        description: "File or directory path",
      },
      content: {
        type: "string",
        description: "Content for write/append operations",
      },
    },
    required: ["operation", "path"],
  },
};

/**
 * Tool 6: Cache Operations
 * Redis/cache integration example
 */
const cacheOperationsTool: ToolSchema = {
  name: "cache_operation",
  description: "Interact with cache/Redis",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["get", "set", "delete", "exists"],
        description: "Cache operation",
      },
      key: {
        type: "string",
        description: "Cache key",
      },
      value: {
        type: "string",
        description: "Value for set operation",
      },
      ttl: {
        type: "number",
        description: "Time to live in seconds",
        default: 3600,
      },
    },
    required: ["operation", "key"],
  },
};

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

async function executeDatabaseQuery(query: string, database: string) {
  // TODO: Implement actual database connection
  // Example with PostgreSQL:
  // const client = new Client({ connectionString: process.env.DATABASE_URL });
  // await client.connect();
  // const result = await client.query(query);
  // await client.end();
  // return result.rows;

  // Mock implementation
  return {
    rows: [
      { id: 1, name: "Example", created_at: new Date().toISOString() },
    ],
    rowCount: 1,
  };
}

async function executeSendEmail(to: string, subject: string, body: string, isHtml: boolean) {
  // TODO: Implement actual email sending
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const result = await resend.emails.send({
  //   from: 'onboarding@resend.dev',
  //   to: to,
  //   subject: subject,
  //   html: isHtml ? body : undefined,
  //   text: !isHtml ? body : undefined,
  // });

  // Mock implementation
  return {
    success: true,
    messageId: `msg_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

async function executeWebScraper(url: string, selector: string) {
  // TODO: Implement actual web scraping
  // Example with Puppeteer:
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.goto(url);
  // const content = await page.$eval(selector, el => el.textContent);
  // await browser.close();
  // return content;

  // Mock implementation
  return {
    url: url,
    content: `Mock scraped content from ${url}`,
    selector: selector,
    timestamp: new Date().toISOString(),
  };
}

async function executeApiRequest(url: string, method: string, headers: any, body: any) {
  // TODO: Implement actual API request
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return {
      status: response.status,
      data: data,
    };
  } catch (error: any) {
    return {
      error: error.message,
      url: url,
    };
  }
}

async function executeFileOperation(operation: string, path: string, content?: string) {
  // TODO: Implement actual file operations
  // const fs = require('fs').promises;
  // switch(operation) {
  //   case 'read': return await fs.readFile(path, 'utf-8');
  //   case 'write': return await fs.writeFile(path, content);
  //   // etc.
  // }

  // Mock implementation
  return {
    operation: operation,
    path: path,
    result: `Mock ${operation} operation on ${path}`,
    timestamp: new Date().toISOString(),
  };
}

async function executeCacheOperation(operation: string, key: string, value?: string, ttl?: number) {
  // TODO: Implement actual cache operations
  // Example with Redis:
  // const redis = new Redis(process.env.REDIS_URL);
  // switch(operation) {
  //   case 'get': return await redis.get(key);
  //   case 'set': return await redis.set(key, value, 'EX', ttl);
  //   // etc.
  // }

  // Mock implementation
  const mockCache: { [key: string]: any } = {};
  switch (operation) {
    case 'get':
      return mockCache[key] || null;
    case 'set':
      mockCache[key] = value;
      return 'OK';
    case 'delete':
      delete mockCache[key];
      return 1;
    case 'exists':
      return mockCache.hasOwnProperty(key) ? 1 : 0;
    default:
      return null;
  }
}

// ============================================
// MCP SERVER SETUP
// ============================================

class AgentFactoryMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        databaseQueryTool,
        sendEmailTool,
        webScraperTool,
        apiRequestTool,
        fileOperationsTool,
        cacheOperationsTool,
      ],
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case "query_database":
            result = await executeDatabaseQuery(args.query, args.database || "main");
            break;

          case "send_email":
            result = await executeSendEmail(args.to, args.subject, args.body, args.isHtml || false);
            break;

          case "scrape_web":
            result = await executeWebScraper(args.url, args.selector || "body");
            break;

          case "api_request":
            result = await executeApiRequest(
              args.url,
              args.method || "GET",
              args.headers || {},
              args.body
            );
            break;

          case "file_operation":
            result = await executeFileOperation(args.operation, args.path, args.content);
            break;

          case "cache_operation":
            result = await executeCacheOperation(
              args.operation,
              args.key,
              args.value,
              args.ttl || 3600
            );
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            } as TextContentSchema,
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            } as TextContentSchema,
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${SERVER_NAME} v${SERVER_VERSION} - MCP server running on stdio`);
    console.error("Available tools:");
    console.error("  - query_database: Execute database queries");
    console.error("  - send_email: Send emails");
    console.error("  - scrape_web: Scrape web pages");
    console.error("  - api_request: Make HTTP API requests");
    console.error("  - file_operation: File system operations");
    console.error("  - cache_operation: Cache/Redis operations");
  }
}

// ============================================
// MAIN ENTRY POINT
// ============================================

async function main() {
  const server = new AgentFactoryMCPServer();
  await server.start();
}

// Handle errors gracefully
main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.error("\nShutting down MCP server...");
  process.exit(0);
});

export { AgentFactoryMCPServer };