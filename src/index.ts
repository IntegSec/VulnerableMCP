#!/usr/bin/env node

/**
 * Vulnerable MCP Server - Main Entry Point
 *
 * ⚠️  SECURITY WARNING: This server is INTENTIONALLY VULNERABLE!
 * For educational and security testing purposes only.
 *
 * Supports multiple transport protocols:
 * - stdio: Standard input/output (for Claude Desktop)
 * - http: HTTP with Server-Sent Events (port 3000)
 * - websocket: WebSocket (port 3001)
 * - all: Run all transports simultaneously
 */

import { config } from 'dotenv';
import { VulnerableMCPServer } from './server.js';
import { startHttpServer } from './transports/http-sse.js';
import { startWebSocketServer } from './transports/websocket.js';

// Load environment variables (contains FLAGS!)
config();

const BANNER = `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           🚨 VULNERABLE MCP SERVER 🚨                          ║
║                                                                ║
║  ⚠️  WARNING: INTENTIONALLY INSECURE APPLICATION  ⚠️           ║
║                                                                ║
║  This server contains multiple security vulnerabilities       ║
║  designed for educational and testing purposes only.          ║
║                                                                ║
║  DO NOT use in production or with sensitive data!             ║
║                                                                ║
║  Version: 1.0.0                                                ║
║  Transport: stdio | http | websocket | all                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;

function printBanner() {
  console.error(BANNER);
}

async function startServer() {
  printBanner();

  const args = process.argv.slice(2);
  const transportArg = args.find(arg => arg.startsWith('--transport='))?.split('=')[1] ||
                       args[args.indexOf('--transport') + 1] ||
                       'stdio';

  console.error(`Starting Vulnerable MCP Server with transport: ${transportArg}\n`);

  try {
    switch (transportArg.toLowerCase()) {
      case 'stdio':
        await startStdioServer();
        break;
      case 'http':
      case 'sse':
        await startHttpServer();
        break;
      case 'websocket':
      case 'ws':
        await startWebSocketServer();
        break;
      case 'all':
        await startAllServers();
        break;
      default:
        console.error(`Unknown transport: ${transportArg}`);
        console.error('Valid options: stdio, http, websocket, all');
        process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

async function startStdioServer() {
  console.error('🔌 Starting stdio transport...');
  console.error('📖 For use with Claude Desktop');
  console.error('');

  const server = new VulnerableMCPServer();
  await server.run();
}

async function startAllServers() {
  console.error('🔌 Starting ALL transport protocols...\n');

  // Start HTTP/SSE server
  const httpPromise = startHttpServer();

  // Start WebSocket server
  const wsPromise = startWebSocketServer();

  // Wait for both to be ready
  await Promise.all([httpPromise, wsPromise]);

  console.error('\n✅ All servers started successfully!');
  console.error('📖 stdio: Use with Claude Desktop');
  console.error(`📖 HTTP/SSE: http://localhost:${process.env.SERVER_PORT_HTTP || 3000}/mcp`);
  console.error(`📖 WebSocket: ws://localhost:${process.env.SERVER_PORT_WS || 3001}`);
  console.error('\n⚠️  Remember: This server is intentionally vulnerable!');
  console.error('⚠️  Use only for educational and security testing purposes!\n');

  // Keep process alive
  await new Promise(() => {});
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\n\n🛑 Shutting down Vulnerable MCP Server...');
  console.error('👋 Goodbye!\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n\n🛑 Shutting down Vulnerable MCP Server...');
  process.exit(0);
});

// Unhandled rejection handler (VULNERABILITY: exposes sensitive info)
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise);
  console.error('🚨 Reason:', reason);
  console.error('🚨 Environment variables:', process.env);
  console.error('🚨 Stack trace:', (reason as Error)?.stack);
});

// Uncaught exception handler (VULNERABILITY: exposes sensitive info)
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('🚨 Stack trace:', error.stack);
  console.error('🚨 Process info:', {
    pid: process.pid,
    version: process.version,
    platform: process.platform,
    cwd: process.cwd(),
  });
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
