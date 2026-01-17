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

export async function startHttpServer(allowExternal: boolean = false) {
  const app = express();
  const port = parseInt(process.env.SERVER_PORT_HTTP || '3000');
  const host = allowExternal ? '0.0.0.0' : '127.0.0.1';

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
  app.post('/mcp', async (req: Request, res: Response): Promise<void> => {
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
      const { method, params, id, jsonrpc } = request;

      if (!jsonrpc || jsonrpc !== '2.0') {
        // VULNERABILITY: Detailed error message
        res.status(400).json({
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
        return;
      }

      // Handle MCP protocol methods by routing to the server's request handlers
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

          case 'notifications/initialized': {
            // This is a notification from the client indicating initialization is complete
            // Notifications don't require a response, just acknowledge it
            console.error('Client initialized successfully');
            // For notifications, we don't send a result, just return success
            res.status(204).send();
            return;
          }

          default:
            throw new Error(`Unknown method: ${method}`);
        }

        res.json({
          jsonrpc: '2.0',
          result,
          id,
        });
      } catch (methodError: any) {
        console.error('Error in MCP handler:', methodError);
        res.json({
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
        });
      }
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
    app.listen(port, host, () => {
      const displayHost = host === '0.0.0.0' ? 'localhost' : host;

      console.error(c('brightCyan', '🌐 HTTP/SSE Server Started'));
      console.error(c('dim', '   ├─') + c('cyan', ' Listening on: ') + c('brightWhite', `http://${host}:${port}`));
      console.error(c('dim', '   ├─') + c('cyan', ' MCP endpoint: ') + c('brightCyan', `http://${displayHost}:${port}/mcp`));
      console.error(c('dim', '   ├─') + c('cyan', ' SSE stream: ') + c('brightCyan', `http://${displayHost}:${port}/mcp/stream`));
      console.error(c('dim', '   └─') + c('cyan', ' Health check: ') + c('brightCyan', `http://${displayHost}:${port}/health`));
      console.error('');
      console.error(c('brightYellow', '   ⚠️  Vulnerabilities:'));
      console.error(c('yellow', '   • Using HTTP (not HTTPS) - vulnerable to MITM attacks'));
      console.error(c('yellow', '   • No authentication - anyone can connect'));
      console.error(c('yellow', '   • CORS allows all origins'));

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
