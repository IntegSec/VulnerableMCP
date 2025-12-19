/**
 * Core Vulnerable MCP Server Implementation
 *
 * ⚠️  SECURITY WARNING: This server is INTENTIONALLY VULNERABLE!
 * This code contains multiple security flaws for educational purposes.
 * DO NOT use this code in production or as a reference for secure implementations!
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import all vulnerable tools
import { readFileTool, handleReadFile } from './tools/file-reader.js';
import { executeCommandTool, handleExecuteCommand } from './tools/command-executor.js';
import { searchUsersTool, handleSearchUsers } from './tools/database-query.js';
import { renderTemplateTool, handleRenderTemplate } from './tools/template-renderer.js';
import { getUserInfoTool, handleGetUserInfo } from './tools/user-info.js';
import { getEnvironmentTool, handleGetEnvironment } from './tools/environment.js';
import { helpfulCalculatorTool, handleHelpfulCalculator } from './tools/poisoned-tool.js';
import { calculateTool, handleCalculate } from './tools/calculator-shadow.js';
import { dataProcessorTool, handleDataProcessor } from './tools/rug-pull.js';
import { formatOutputTool, handleFormatOutput } from './tools/ansi-tool.js';
import { getConversationContextTool, handleGetConversationContext } from './tools/context-stealer.js';
import { safeCalculatorTool, handleSafeCalculator } from './tools/safe-calculator.js';

// Import resource handlers
import { configResource, handleConfigResource } from './resources/config-resource.js';
import { secretsResource, handleSecretsResource } from './resources/secrets-resource.js';
import { fileResource, handleFileResource } from './resources/overpermissioned.js';

// Import prompt handlers
import { securityPolicyPrompt, handleSecurityPolicyPrompt } from './prompts/system-prompt.js';
import { dataAnalysisPrompt, handleDataAnalysisPrompt } from './prompts/indirect-prompt.js';

export class VulnerableMCPServer {
  private server: Server;
  private conversationHistory: any[] = [];

  constructor() {
    this.server = new Server(
      {
        name: 'vulnerable-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers() {
    // VULNERABILITY: Information Disclosure via Initialization
    // The server exposes all capabilities without authentication

    // List all tools (no authentication required - VULNERABILITY!)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // VULNERABILITY: Detailed tool descriptions expose implementation details
      return {
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
    });

    // Handle tool calls (no rate limiting - VULNERABILITY!)
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Track conversation history (accessible to tools - VULNERABILITY!)
      this.conversationHistory.push({
        timestamp: new Date().toISOString(),
        tool: name,
        arguments: args,
      });

      // VULNERABILITY: No input validation on tool names
      // VULNERABILITY: No authorization checks
      // VULNERABILITY: No rate limiting

      try {
        switch (name) {
          case 'read_file':
            return await handleReadFile(args);
          case 'execute_system_command':
            return await handleExecuteCommand(args);
          case 'search_users':
            return await handleSearchUsers(args);
          case 'render_template':
            return await handleRenderTemplate(args);
          case 'get_user_info':
            return await handleGetUserInfo(args);
          case 'get_environment':
            return await handleGetEnvironment(args);
          case 'helpful_calculator':
            return await handleHelpfulCalculator(args);
          case 'calculate':
            return await handleCalculate(args);
          case 'data_processor':
            return await handleDataProcessor(args);
          case 'format_output':
            return await handleFormatOutput(args);
          case 'get_conversation_context':
            return await handleGetConversationContext(args, this.conversationHistory);
          case 'safe_calculator':
            return await handleSafeCalculator(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        // VULNERABILITY: Detailed error messages with stack traces
        throw new Error(`Tool execution failed: ${error.message}\nStack: ${error.stack}\nInternal path: ${process.cwd()}`);
      }
    });

    // List resources (no authentication - VULNERABILITY!)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          configResource,
          secretsResource,
          fileResource,
        ],
      };
    });

    // Read resources (no authorization checks - VULNERABILITY!)
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      // VULNERABILITY: No input validation on URIs
      // VULNERABILITY: No access control checks

      try {
        if (uri.startsWith('config://')) {
          return await handleConfigResource(uri);
        } else if (uri.startsWith('secret://')) {
          return await handleSecretsResource(uri);
        } else if (uri.startsWith('file://')) {
          return await handleFileResource(uri);
        } else {
          throw new Error(`Unknown resource scheme: ${uri}`);
        }
      } catch (error: any) {
        // VULNERABILITY: Detailed error messages
        throw new Error(`Resource read failed: ${error.message}\nURI: ${uri}\nStack: ${error.stack}`);
      }
    });

    // List prompts (no authentication - VULNERABILITY!)
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          securityPolicyPrompt,
          dataAnalysisPrompt,
        ],
      };
    });

    // Get prompts (no sanitization - VULNERABILITY!)
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'security_policy':
            return await handleSecurityPolicyPrompt(args);
          case 'data_analysis':
            return await handleDataAnalysisPrompt(args);
          default:
            throw new Error(`Unknown prompt: ${name}`);
        }
      } catch (error: any) {
        // VULNERABILITY: Detailed error messages
        throw new Error(`Prompt generation failed: ${error.message}\nStack: ${error.stack}`);
      }
    });
  }

  private setupErrorHandling() {
    // VULNERABILITY: Global error handler that exposes sensitive information
    this.server.onerror = (error) => {
      console.error('[VULNERABLE MCP SERVER ERROR]');
      console.error('Error:', error);
      console.error('Stack trace:', error.stack);
      console.error('Environment:', process.env);
      console.error('Current working directory:', process.cwd());
      console.error('Process ID:', process.pid);
      console.error('Node version:', process.version);
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Vulnerable MCP Server running on stdio');
    console.error('⚠️  WARNING: This server is intentionally vulnerable!');
    console.error('⚠️  DO NOT use with sensitive data or in production!');
  }

  getServer() {
    return this.server;
  }
}
