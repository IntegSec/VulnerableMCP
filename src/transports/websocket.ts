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

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

const c = (color: keyof typeof colors, text: string) => `${colors[color]}${text}${colors.reset}`;

export async function startWebSocketServer(allowExternal: boolean = false) {
  const port = parseInt(process.env.SERVER_PORT_WS || '3001');
  const host = allowExternal ? '0.0.0.0' : '127.0.0.1';

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

        // Handle MCP protocol methods
        let result: any;

        try {
          switch (method) {
            case 'initialize': {
              // Return server capabilities
              result = {
                protocolVersion: '2024-11-05',
                capabilities: {
                  tools: {},
                  resources: {},
                  prompts: {},
                },
                serverInfo: {
                  name: 'vulnerable-mcp-server',
                  version: '1.0.0',
                },
              };
              break;
            }

            case 'tools/list': {
              // Import tool definitions
              const { readFileTool } = await import('../tools/file-reader.js');
              const { executeCommandTool } = await import('../tools/command-executor.js');
              const { searchUsersTool } = await import('../tools/database-query.js');
              const { renderTemplateTool } = await import('../tools/template-renderer.js');
              const { getUserInfoTool } = await import('../tools/user-info.js');
              const { getEnvironmentTool } = await import('../tools/environment.js');
              const { helpfulCalculatorTool } = await import('../tools/poisoned-tool.js');
              const { calculateTool } = await import('../tools/calculator-shadow.js');
              const { dataProcessorTool } = await import('../tools/rug-pull.js');
              const { formatOutputTool } = await import('../tools/ansi-tool.js');
              const { getConversationContextTool } = await import('../tools/context-stealer.js');
              const { safeCalculatorTool } = await import('../tools/safe-calculator.js');

              result = {
                tools: [
                  readFileTool,
                  executeCommandTool,
                  searchUsersTool,
                  renderTemplateTool,
                  getUserInfoTool,
                  getEnvironmentTool,
                  helpfulCalculatorTool,
                  calculateTool,
                  dataProcessorTool,
                  formatOutputTool,
                  getConversationContextTool,
                  safeCalculatorTool,
                ],
              };
              break;
            }

            case 'resources/list': {
              // Import resource definitions
              const { configResource } = await import('../resources/config-resource.js');
              const { secretsResource } = await import('../resources/secrets-resource.js');
              const { fileResource } = await import('../resources/overpermissioned.js');

              result = {
                resources: [
                  configResource,
                  secretsResource,
                  fileResource,
                ],
              };
              break;
            }

            case 'prompts/list': {
              // Import prompt definitions
              const { securityPolicyPrompt } = await import('../prompts/system-prompt.js');
              const { dataAnalysisPrompt } = await import('../prompts/indirect-prompt.js');

              result = {
                prompts: [
                  securityPolicyPrompt,
                  dataAnalysisPrompt,
                ],
              };
              break;
            }

            case 'tools/call': {
              // Import tool handlers
              const { handleReadFile } = await import('../tools/file-reader.js');
              const { handleExecuteCommand } = await import('../tools/command-executor.js');
              const { handleSearchUsers } = await import('../tools/database-query.js');
              const { handleRenderTemplate } = await import('../tools/template-renderer.js');
              const { handleGetUserInfo } = await import('../tools/user-info.js');
              const { handleGetEnvironment } = await import('../tools/environment.js');
              const { handleHelpfulCalculator } = await import('../tools/poisoned-tool.js');
              const { handleCalculate } = await import('../tools/calculator-shadow.js');
              const { handleDataProcessor } = await import('../tools/rug-pull.js');
              const { handleFormatOutput } = await import('../tools/ansi-tool.js');
              const { handleGetConversationContext } = await import('../tools/context-stealer.js');
              const { handleSafeCalculator } = await import('../tools/safe-calculator.js');

              const toolName = params.name;
              const toolArgs = params.arguments || {};

              switch (toolName) {
                case 'read_file':
                  result = await handleReadFile(toolArgs);
                  break;
                case 'execute_system_command':
                  result = await handleExecuteCommand(toolArgs);
                  break;
                case 'search_users':
                  result = await handleSearchUsers(toolArgs);
                  break;
                case 'render_template':
                  result = await handleRenderTemplate(toolArgs);
                  break;
                case 'get_user_info':
                  result = await handleGetUserInfo(toolArgs);
                  break;
                case 'get_environment':
                  result = await handleGetEnvironment(toolArgs);
                  break;
                case 'helpful_calculator':
                  result = await handleHelpfulCalculator(toolArgs);
                  break;
                case 'calculate':
                  result = await handleCalculate(toolArgs);
                  break;
                case 'data_processor':
                  result = await handleDataProcessor(toolArgs);
                  break;
                case 'format_output':
                  result = await handleFormatOutput(toolArgs);
                  break;
                case 'get_conversation_context':
                  result = await handleGetConversationContext(toolArgs, []);
                  break;
                case 'safe_calculator':
                  result = await handleSafeCalculator(toolArgs);
                  break;
                default:
                  throw new Error(`Unknown tool: ${toolName}`);
              }
              break;
            }

            case 'resources/read': {
              // Import resource handlers
              const { handleConfigResource } = await import('../resources/config-resource.js');
              const { handleSecretsResource } = await import('../resources/secrets-resource.js');
              const { handleFileResource } = await import('../resources/overpermissioned.js');

              const uri = params.uri;

              if (uri.startsWith('config://')) {
                result = await handleConfigResource(uri);
              } else if (uri.startsWith('secret://')) {
                result = await handleSecretsResource(uri);
              } else if (uri.startsWith('file://')) {
                result = await handleFileResource(uri);
              } else {
                throw new Error(`Unknown resource scheme: ${uri}`);
              }
              break;
            }

            case 'prompts/get': {
              // Import prompt handlers
              const { handleSecurityPolicyPrompt } = await import('../prompts/system-prompt.js');
              const { handleDataAnalysisPrompt } = await import('../prompts/indirect-prompt.js');

              const promptName = params.name;
              const promptArgs = params.arguments || {};

              switch (promptName) {
                case 'security_policy':
                  result = await handleSecurityPolicyPrompt(promptArgs);
                  break;
                case 'data_analysis':
                  result = await handleDataAnalysisPrompt(promptArgs);
                  break;
                default:
                  throw new Error(`Unknown prompt: ${promptName}`);
              }
              break;
            }

            default:
              throw new Error(`Unknown method: ${method}`);
          }

          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            result,
            id,
          }));
        } catch (methodError: any) {
          console.error('Error in MCP handler:', methodError);
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: methodError.message,
              data: {
                stack: methodError.stack,
                method,
                params,
              },
            },
            id,
          }));
        }
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
    httpServer.listen(port, host, () => {
      console.error(c('brightCyan', '🔌 WebSocket Server Started'));
      console.error(c('dim', '   └─') + c('cyan', ' Listening on: ') + c('brightWhite', `ws://${host}:${port}`));
      console.error('');
      console.error(c('brightYellow', '   ⚠️  Vulnerabilities:'));
      console.error(c('yellow', '   • Using WS (not WSS) - vulnerable to MITM attacks'));
      console.error(c('yellow', '   • No origin validation - any website can connect'));
      console.error(c('yellow', '   • No authentication - anyone can send messages'));
      console.error(c('yellow', '   • No rate limiting'));

      if (allowExternal) {
        console.error(c('brightRed', '   • Listening on ALL network interfaces - accessible from other machines!'));
      } else {
        console.error(c('brightGreen', '   ✅ Listening on localhost only - safe from external network access'));
      }
      console.error('');
      resolve();
    });
  });
}
