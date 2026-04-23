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
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { chdir } from 'process';
import * as readline from 'readline/promises';
import { VulnerableMCPServer } from './server.js';
import { startHttpServer } from './transports/http-sse.js';
import { startWebSocketServer } from './transports/websocket.js';

// ANSI Color codes for beautiful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',

  // Bright foreground
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

// Helper function for colored text
const c = (color: keyof typeof colors, text: string) => `${colors[color]}${text}${colors.reset}`;

// Set working directory to project root (where package.json is located)
// This ensures relative paths work correctly when launched from Claude Desktop
try {
  const __filename = fileURLToPath(import.meta.url);
  const distDir = dirname(__filename);
  const projectRoot = join(distDir, '..');
  chdir(projectRoot);
} catch (error) {
  // If changing directory fails, continue anyway - might work from current directory
  console.error('Warning: Could not change to project root:', error);
}

// Load environment variables (contains FLAGS!)
config();

const INTEGSEC_LOGO = `
${c('brightCyan', '  ___       _             ____            ')}
${c('brightCyan', ' |_ _|_ __ | |_ ___  __ _/ ___|  ___  ___ ')}
${c('brightCyan', '  | || \'_ \\| __/ _ \\/ _` \\___ \\ / _ \\/ __|')}
${c('brightCyan', '  | || | | | ||  __/ (_| |___) |  __/ (__ ')}
${c('brightCyan', ' |___|_| |_|\\__\\___|\\__, |____/ \\___|\\___|')}
${c('brightCyan', '                    |___/                 ')}
`;

const BANNER = `
${c('brightRed', '╔══════════════════════════════════════════════════════════════════╗')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '║')}          ${c('bright', '🚨  VULNERABLE MCP SERVER  🚨')}                       ${c('brightRed', '║')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '╠══════════════════════════════════════════════════════════════════╣')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '║')}  ${c('brightYellow', '⚠️   WARNING: INTENTIONALLY INSECURE APPLICATION   ⚠️')}       ${c('brightRed', '║')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '║')}  This server contains multiple security vulnerabilities       ${c('brightRed', '║')}
${c('brightRed', '║')}  designed for ${c('brightGreen', 'educational')} and ${c('brightGreen', 'security testing')} purposes.     ${c('brightRed', '║')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '║')}  ${c('brightRed', 'DO NOT')} use in production or with sensitive data!          ${c('brightRed', '║')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '╠══════════════════════════════════════════════════════════════════╣')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '║')}  ${c('cyan', 'Version:')} 1.0.0                                                ${c('brightRed', '║')}
${c('brightRed', '║')}  ${c('cyan', 'Transport:')} stdio │ http │ websocket │ all                    ${c('brightRed', '║')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '║')}  ${c('green', '🔒 Network:')} localhost (127.0.0.1) by default                 ${c('brightRed', '║')}
${c('brightRed', '║')}  ${c('yellow', '⚡ Override:')} --allow-external-connections                     ${c('brightRed', '║')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '╠══════════════════════════════════════════════════════════════════╣')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '║')}  ${c('dim', 'Created by')} ${c('brightCyan', 'IntegSec')} ${c('dim', '│ https://integsec.com')}                    ${c('brightRed', '║')}
${c('brightRed', '║')}  ${c('dim', 'License: MIT')}                                           ${c('brightRed', '║')}
${c('brightRed', '║                                                                  ║')}
${c('brightRed', '╚══════════════════════════════════════════════════════════════════╝')}
`;

function printBanner() {
  console.error(INTEGSEC_LOGO);
  console.error(BANNER);
  console.error('');
}

async function confirmExternalConnections(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  console.error('');
  console.error(c('brightYellow', '⚠️  WARNING: You are about to start the server on ALL network interfaces (0.0.0.0)'));
  console.error(c('brightYellow', '⚠️  This means the vulnerable server will be accessible from other machines on your network!'));
  console.error(c('brightRed', '⚠️  This is DANGEROUS and should only be done in isolated/controlled environments.'));
  console.error('');
  console.error(c('cyan', '📌 By default, the server runs on localhost (127.0.0.1) only.'));
  console.error('');

  try {
    const answer = await rl.question(c('brightWhite', 'Do you want to proceed with external connections? (yes/no): '));
    rl.close();

    const normalized = answer.trim().toLowerCase();
    return normalized === 'yes' || normalized === 'y';
  } catch (error) {
    rl.close();
    return false;
  }
}

async function startServer() {
  printBanner();

  const args = process.argv.slice(2);
  const transportArg = args.find(arg => arg.startsWith('--transport='))?.split('=')[1] ||
                       args[args.indexOf('--transport') + 1] ||
                       'stdio';

  // Check for external connections flag
  let allowExternal = args.includes('--allow-external-connections');

  console.error(c('brightMagenta', '🚀 Starting Vulnerable MCP Server'));
  console.error(c('cyan', `📡 Transport: ${c('brightWhite', transportArg)}`));
  console.error('');

  try {
    switch (transportArg.toLowerCase()) {
      case 'stdio':
        await startStdioServer();
        break;
      case 'http':
      case 'sse':
        await startHttpServer(allowExternal);
        break;
      case 'websocket':
      case 'ws':
        await startWebSocketServer(allowExternal);
        break;
      case 'all':
        await startAllServers(allowExternal);
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
  console.error(c('brightCyan', '🔌 Starting stdio transport...'));
  console.error(c('green', '📖 For use with Claude Desktop'));
  console.error('');

  const server = new VulnerableMCPServer();
  await server.run();
}

async function startAllServers(allowExternal: boolean) {
  console.error(c('brightMagenta', '🔌 Starting ALL transport protocols...'));
  console.error('');

  // Start HTTP/SSE server
  const httpPromise = startHttpServer(allowExternal);

  // Start WebSocket server
  const wsPromise = startWebSocketServer(allowExternal);

  // Wait for both to be ready
  await Promise.all([httpPromise, wsPromise]);

  console.error('');
  console.error(c('brightGreen', '✅ All servers started successfully!'));
  console.error('');
  console.error(c('cyan', '📖 Available endpoints:'));
  console.error(c('dim', '   stdio:') + c('white', ' Use with Claude Desktop'));
  console.error(c('dim', '   HTTP/SSE:') + c('brightCyan', ` http://localhost:${process.env.SERVER_PORT_HTTP || 3000}/mcp`));
  if (process.env.ENABLE_HTTPS !== 'false') {
    console.error(c('dim', '   HTTPS/SSE:') + c('brightCyan', ` https://localhost:${process.env.SERVER_PORT_HTTPS || 3443}/mcp`));
  }
  console.error(c('dim', '   WebSocket:') + c('brightCyan', ` ws://localhost:${process.env.SERVER_PORT_WS || 3001}`));
  if (process.env.ENABLE_WSS !== 'false') {
    console.error(c('dim', '   Secure WebSocket:') + c('brightCyan', ` wss://localhost:${process.env.SERVER_PORT_WSS || 3444}`));
  }
  console.error('');
  console.error(c('brightYellow', '⚠️  Remember: This server is intentionally vulnerable!'));
  console.error(c('yellow', '⚠️  Use only for educational and security testing purposes!'));
  console.error('');
  console.error(c('dim', '──────────────────────────────────────────────────────────────'));
  console.error(c('cyan', '🛡️  Powered by') + c('brightCyan', ' IntegSec') + c('dim', ' │ https://integsec.com'));
  console.error(c('dim', '──────────────────────────────────────────────────────────────'));
  console.error('');

  // Keep process alive
  await new Promise(() => {});
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('');
  console.error(c('brightYellow', '🛑 Shutting down Vulnerable MCP Server...'));
  console.error(c('green', '👋 Goodbye!'));
  console.error('');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('');
  console.error(c('brightYellow', '🛑 Shutting down Vulnerable MCP Server...'));
  process.exit(0);
});

// Unhandled rejection handler (VULNERABILITY: exposes sensitive info)
process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error(c('brightRed', '🚨 Unhandled Rejection'));
  console.error(c('red', '   Reason: ') + c('white', String(reason)));
  if ((reason as Error)?.stack) {
    console.error(c('dim', '   Stack trace:'));
    console.error(c('dim', '   ' + (reason as Error).stack?.split('\n').join('\n   ')));
  }
  // VULNERABILITY: Still expose environment in dim text for educational purposes
  console.error(c('dim', '   Environment variables: [hidden for brevity - check code]'));
  console.error('');
});

// Uncaught exception handler - handle specific error types with helpful messages
process.on('uncaughtException', (error) => {
  console.error('');

  // Special handling for EADDRINUSE (port already in use)
  if ('code' in error && error.code === 'EADDRINUSE') {
    const portMatch = error.message.match(/:(\d+)/);
    const port = portMatch ? portMatch[1] : 'unknown';
    const addressMatch = error.message.match(/address already in use (.+?):/);
    const address = addressMatch ? addressMatch[1] : 'unknown';

    console.error(c('brightRed', '🚨 Port Already In Use!'));
    console.error('');
    console.error(c('yellow', `   Port ${c('brightWhite', port)} on ${c('brightWhite', address)} is already in use.`));
    console.error('');
    console.error(c('cyan', '   💡 Solutions:'));
    console.error(c('white', `      1. Stop any existing server using port ${port}`));
    console.error(c('dim', `         Windows: `) + c('white', `taskkill /F /PID <pid>`));
    console.error(c('dim', `         Linux/Mac: `) + c('white', `kill -9 <pid>`));
    console.error(c('white', `      2. Change the port in environment variables:`));
    console.error(c('dim', '         ') + c('white', `SERVER_PORT_HTTP=${port === '3000' ? '3002' : port} (for HTTP)`));
    console.error(c('dim', '         ') + c('white', `SERVER_PORT_WS=${port === '3001' ? '3003' : port} (for WebSocket)`));
    console.error(c('white', `      3. Find the process using the port:`));
    console.error(c('dim', `         Windows: `) + c('white', `netstat -ano | findstr :${port}`));
    console.error(c('dim', `         Linux/Mac: `) + c('white', `lsof -i :${port}`));
    console.error('');
  } else {
    // Generic uncaught exception
    console.error(c('brightRed', '🚨 Uncaught Exception'));
    console.error(c('red', '   Error: ') + c('white', error.message));
    console.error(c('dim', '   Type: ') + c('white', error.constructor.name));

    if (error.stack) {
      console.error('');
      console.error(c('dim', '   Stack trace:'));
      const stackLines = error.stack.split('\n').slice(1, 4); // Show first 3 stack frames
      stackLines.forEach(line => {
        console.error(c('dim', '   ' + line.trim()));
      });
    }

    // VULNERABILITY: Still expose some info for educational purposes
    console.error('');
    console.error(c('dim', '   Process info: ') + c('dim', `pid=${process.pid}, node=${process.version}, platform=${process.platform}`));
  }

  console.error('');
  console.error(c('brightYellow', '⚠️  Server failed to start. See error details above.'));
  console.error('');
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
