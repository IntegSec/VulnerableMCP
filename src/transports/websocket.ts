/**
 * WebSocket Transport
 *
 * ⚠️  VULNERABILITIES IN THIS FILE:
 * - No WSS (uses plain WS)
 * - No origin validation
 * - No authentication
 * - No rate limiting
 * - No message size limits
 * - Connection from any origin allowed
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

export async function startWebSocketServer() {
  const port = parseInt(process.env.SERVER_PORT_WS || '3001');

  // Create HTTP server for WebSocket upgrade
  const httpServer = createServer((req, res) => {
    // VULNERABILITY: Info disclosure on HTTP requests
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      server: 'vulnerable-mcp-websocket',
      message: 'WebSocket server - connect via ws://',
      port,
      warning: 'Intentionally vulnerable - no origin validation!',
      platform: process.platform,
      nodeVersion: process.version,
      cwd: process.cwd(),
      env: process.env,  // VULNERABILITY: Exposes environment
    }));
  });

  // VULNERABILITY: No origin verification
  const wss = new WebSocketServer({
    server: httpServer,
    verifyClient: (info: any) => {
      // VULNERABILITY: Accept ALL connections regardless of origin!
      console.error(`WebSocket connection from origin: ${info.origin || 'unknown'}`);
      console.error(`⚠️  No origin validation - accepting connection!`);
      return true;  // Should validate origin in production!
    },
    // VULNERABILITY: No max payload size limit
    maxPayload: 100 * 1024 * 1024,  // 100MB - way too large!
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const clientIp = req.socket.remoteAddress;
    const origin = req.headers.origin || 'unknown';

    console.error(`✅ New WebSocket connection from ${clientIp} (origin: ${origin})`);

    // VULNERABILITY: Send sensitive info on connection
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to Vulnerable MCP Server via WebSocket',
      server: 'vulnerable-mcp-server',
      version: '1.0.0',
      warning: 'This server is intentionally vulnerable!',
      yourIp: clientIp,
      yourOrigin: origin,
      serverInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        cwd: process.cwd(),
        pid: process.pid,
        uptime: process.uptime(),
      },
      // VULNERABILITY: Expose environment variables
      environment: process.env,
    }));

    // Handle incoming messages
    ws.on('message', async (data: Buffer) => {
      try {
        // VULNERABILITY: No rate limiting on messages
        // VULNERABILITY: No input validation

        const message = data.toString();
        console.error(`📨 Received message: ${message}`);

        let request: any;
        try {
          request = JSON.parse(message);
        } catch (e) {
          // VULNERABILITY: Detailed parse error
          ws.send(JSON.stringify({
            error: 'Invalid JSON',
            message: (e as Error).message,
            received: message,
            stack: (e as Error).stack,
          }));
          return;
        }

        // VULNERABILITY: No authentication check before processing requests

        // Handle JSON-RPC requests
        const { method, params, id, jsonrpc } = request;

        if (!jsonrpc || jsonrpc !== '2.0') {
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32600,
              message: 'Invalid Request',
              data: {
                received: request,
                help: 'Must use JSON-RPC 2.0 format',
              },
            },
            id: id || null,
          }));
          return;
        }

        // Import and use MCP server
        const { VulnerableMCPServer } = await import('../server.js');
        const mcpServer = new VulnerableMCPServer();

        // Process request (simplified - real implementation would be more complex)
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          result: {
            message: 'Request processed',
            method,
            params,
            server: 'vulnerable-mcp-websocket',
            timestamp: new Date().toISOString(),
          },
          id,
        }));
      } catch (error: any) {
        // VULNERABILITY: Detailed error messages with stack traces
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          error: 'Internal Error',
          message: error.message,
          stack: error.stack,
          type: error.constructor.name,
          serverInfo: {
            cwd: process.cwd(),
            platform: process.platform,
            version: process.version,
          },
          environment: process.env,  // VULNERABILITY
        }));
      }
    });

    // Handle errors (VULNERABILITY: Detailed error logging)
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      console.error('Stack:', error.stack);
      console.error('Environment:', process.env);
    });

    // Handle close
    ws.on('close', (code, reason) => {
      console.error(`WebSocket connection closed: ${code} - ${reason}`);
    });

    // VULNERABILITY: Send periodic pings with sensitive data
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString(),
          serverUptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        }));
      }
    }, 30000);

    ws.on('close', () => {
      clearInterval(pingInterval);
    });
  });

  // Start server
  return new Promise<void>((resolve) => {
    httpServer.listen(port, '0.0.0.0', () => {  // VULNERABILITY: Listening on all interfaces
      console.error(`🔌 WebSocket server listening on ws://0.0.0.0:${port}`);
      console.error(`⚠️  WARNING: Using WS (not WSS) - vulnerable to MITM attacks!`);
      console.error(`⚠️  WARNING: No origin validation - any website can connect!`);
      console.error(`⚠️  WARNING: No authentication - anyone can send messages!`);
      console.error(`⚠️  WARNING: No rate limiting!`);
      console.error('');
      resolve();
    });
  });
}
