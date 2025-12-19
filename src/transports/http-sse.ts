/**
 * HTTP with Server-Sent Events (SSE) Transport
 *
 * ⚠️  VULNERABILITIES IN THIS FILE:
 * - No HTTPS (uses plain HTTP)
 * - No authentication
 * - Misconfigured CORS (allows all origins)
 * - No rate limiting
 * - Detailed error responses
 * - No request size limits
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

export async function startHttpServer() {
  const app = express();
  const port = parseInt(process.env.SERVER_PORT_HTTP || '3000');

  // VULNERABILITY: Overly permissive CORS - allows any origin
  app.use(cors({
    origin: '*',  // VULNERABILITY: Should restrict to specific origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'],
  }));

  // VULNERABILITY: No request size limit
  app.use(express.json({ limit: '50mb' }));  // Way too large!
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // VULNERABILITY: Information disclosure in headers
  app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'VulnerableMCP/1.0.0');
    res.setHeader('X-Server-Version', process.version);
    res.setHeader('X-Platform', process.platform);
    next();
  });

  // Health check endpoint (VULNERABILITY: Info disclosure)
  app.get('/health', (req, res) => {
    res.json({
      status: 'vulnerable',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      cwd: process.cwd(),
      env: process.env,  // HUGE VULNERABILITY: Exposes all environment variables!
    });
  });

  // MCP endpoint (VULNERABILITY: No authentication!)
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      // VULNERABILITY: No authentication check
      // VULNERABILITY: No rate limiting
      // VULNERABILITY: No input validation

      const request = req.body;

      // Log request (VULNERABILITY: May log sensitive data)
      console.error('MCP Request:', JSON.stringify(request, null, 2));

      // Import server dynamically to handle request
      const { VulnerableMCPServer } = await import('../server.js');
      const mcpServer = new VulnerableMCPServer();
      const server = mcpServer.getServer();

      // Process the JSON-RPC request
      // Note: This is a simplified handler - production would need proper JSON-RPC handling
      const { method, params, id, jsonrpc } = request;

      if (!jsonrpc || jsonrpc !== '2.0') {
        // VULNERABILITY: Detailed error message
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request - jsonrpc must be "2.0"',
            data: {
              received: jsonrpc,
              expected: '2.0',
              hint: 'Check the JSON-RPC 2.0 specification',
            },
          },
          id: id || null,
        });
      }

      // VULNERABILITY: Method name not validated
      // This is a simplified implementation - actual MCP SDK handles this better
      res.json({
        jsonrpc: '2.0',
        result: {
          message: 'Request received',
          method,
          params,
          server: 'vulnerable-mcp-server',
          warning: 'This server is intentionally vulnerable',
        },
        id,
      });
    } catch (error: any) {
      // VULNERABILITY: Detailed error responses with stack traces
      console.error('Error processing MCP request:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: `Internal error: ${error.message}`,
          data: {
            stack: error.stack,
            type: error.constructor.name,
            cwd: process.cwd(),
            env: process.env,  // VULNERABILITY: Exposes environment
          },
        },
        id: req.body.id || null,
      });
    }
  });

  // SSE endpoint for streaming responses
  app.get('/mcp/stream', (req: Request, res: Response) => {
    // VULNERABILITY: No authentication for SSE streams
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      server: 'vulnerable-mcp-server',
      warning: 'Intentionally vulnerable - for testing only',
      env: process.env,  // VULNERABILITY
    })}\n\n`);

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });
  });

  // Catch-all error handler (VULNERABILITY: Detailed errors)
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Express error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      stack: err.stack,
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
      },
      server: {
        cwd: process.cwd(),
        version: process.version,
        platform: process.platform,
        env: process.env,
      },
    });
  });

  // Start server on HTTP (VULNERABILITY: Should use HTTPS!)
  return new Promise<void>((resolve) => {
    app.listen(port, '0.0.0.0', () => {  // VULNERABILITY: Listening on all interfaces
      console.error(`🌐 HTTP/SSE server listening on http://0.0.0.0:${port}`);
      console.error(`📝 MCP endpoint: http://localhost:${port}/mcp`);
      console.error(`📡 SSE stream: http://localhost:${port}/mcp/stream`);
      console.error(`💓 Health check: http://localhost:${port}/health`);
      console.error(`⚠️  WARNING: Using HTTP (not HTTPS) - vulnerable to MITM attacks!`);
      console.error(`⚠️  WARNING: No authentication - anyone can connect!`);
      console.error(`⚠️  WARNING: CORS allows all origins!`);
      console.error('');
      resolve();
    });
  });
}
