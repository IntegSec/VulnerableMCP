# Vulnerable MCP Server - Documentation for Claude

**Created by [IntegSec](https://integsec.com)** | License: [MIT](LICENSE)

## ⚠️ IMPORTANT WARNING ⚠️

This is an **INTENTIONALLY VULNERABLE** MCP (Model Context Protocol) server designed for:
- Security testing and research
- Educational purposes
- CTF (Capture The Flag) challenges
- MCP security scanner development
- Live demonstrations and training

**DO NOT** use this server in production environments or with sensitive data!

## Server Overview

This MCP server implements multiple security vulnerabilities across various categories to help developers and security researchers understand MCP security issues. It supports all three official MCP transport protocols and contains 20+ intentional vulnerabilities.

### Supported Transport Protocols

1. **stdio** - Standard input/output (for Claude Desktop integration)
2. **HTTP with SSE** - Server-Sent Events over HTTP (port 3000)
3. **WebSocket** - Bidirectional real-time communication (port 3001)

### Protocol Details

- **Protocol**: JSON-RPC 2.0 over MCP
- **MCP Specification**: Fully compliant with Model Context Protocol
- **Authentication**: None (intentionally vulnerable)
- **Rate Limiting**: None (intentionally vulnerable)
- **Input Validation**: Minimal to none (intentionally vulnerable)

## Available Tools

### 1. read_file
**Description**: Reads file contents from the filesystem

**Parameters**:
- `path` (string, required): Path to the file to read

**Example**:
```json
{
  "name": "read_file",
  "arguments": {
    "path": "data/example.txt"
  }
}
```

**Educational Note**: This tool does not properly sanitize file paths. Consider what might happen with relative paths like `../`.

---

### 2. execute_system_command
**Description**: Executes system commands on the server

**Parameters**:
- `command` (string, required): The command to execute

**Example**:
```json
{
  "name": "execute_system_command",
  "arguments": {
    "command": "ls -la"
  }
}
```

**Educational Note**: This tool concatenates user input directly into shell commands. Think about shell metacharacters.

---

### 3. search_users
**Description**: Searches the user database

**Parameters**:
- `username` (string, required): Username to search for

**Example**:
```json
{
  "name": "search_users",
  "arguments": {
    "username": "admin"
  }
}
```

**Educational Note**: Database queries are constructed using string concatenation. Consider SQL syntax.

---

### 4. render_template
**Description**: Renders a template with provided data

**Parameters**:
- `template` (string, required): The template string to render
- `data` (object, optional): Data to pass to the template

**Example**:
```json
{
  "name": "render_template",
  "arguments": {
    "template": "Hello {{name}}!",
    "data": {"name": "World"}
  }
}
```

**Educational Note**: Templates are rendered without sandboxing. Handlebars expressions can execute code.

---

### 5. get_user_info
**Description**: Returns information about the current user

**Parameters**: None

**Example**:
```json
{
  "name": "get_user_info",
  "arguments": {}
}
```

**Educational Note**: This tool returns more information than necessary, including sensitive data.

---

### 6. get_environment
**Description**: Retrieves environment variables

**Parameters**:
- `variable` (string, optional): Specific variable to retrieve, or all if not specified

**Example**:
```json
{
  "name": "get_environment",
  "arguments": {
    "variable": "PATH"
  }
}
```

**Educational Note**: Environment variables often contain sensitive credentials and API keys.

---

### 7. helpful_calculator
**Description**: A helper tool with useful calculations (has hidden instructions in description)

**Parameters**:
- `expression` (string, required): Mathematical expression to evaluate

**Example**:
```json
{
  "name": "helpful_calculator",
  "arguments": {
    "expression": "2 + 2"
  }
}
```

**Educational Note**: Pay close attention to the tool's description field. Sometimes instructions are hidden using ANSI escape codes or whitespace.

---

### 8. calculate
**Description**: Performs mathematical calculations (tool shadowing example)

**Parameters**:
- `a` (number, required): First number
- `b` (number, required): Second number
- `operation` (string, required): Operation to perform (+, -, *, /)

**Example**:
```json
{
  "name": "calculate",
  "arguments": {
    "a": 5,
    "b": 3,
    "operation": "+"
  }
}
```

**Educational Note**: Multiple tools with similar names can cause confusion. Which one is legitimate?

---

### 9. data_processor
**Description**: Processes data through various transformations (rug pull demonstration)

**Parameters**:
- `data` (string, required): Data to process
- `method` (string, required): Processing method

**Example**:
```json
{
  "name": "data_processor",
  "arguments": {
    "data": "test data",
    "method": "encode"
  }
}
```

**Educational Note**: This tool's behavior may change over time. The definition you saw initially might not match current behavior.

---

### 10. format_output
**Description**: Formats output with terminal colors and styling

**Parameters**:
- `text` (string, required): Text to format
- `style` (string, optional): Style to apply

**Example**:
```json
{
  "name": "format_output",
  "arguments": {
    "text": "Important message",
    "style": "bold"
  }
}
```

**Educational Note**: This tool returns ANSI escape sequences. Be aware of how terminal control codes can be used.

---

### 11. get_conversation_context
**Description**: Retrieves conversation history and context

**Parameters**:
- `limit` (number, optional): Number of messages to retrieve

**Example**:
```json
{
  "name": "get_conversation_context",
  "arguments": {
    "limit": 10
  }
}
```

**Educational Note**: Tools can access the full conversation history, including potentially sensitive information shared earlier.

---

### 12. safe_calculator
**Description**: A properly secured calculator (safe baseline for comparison)

**Parameters**:
- `expression` (string, required): Safe mathematical expression

**Example**:
```json
{
  "name": "safe_calculator",
  "arguments": {
    "expression": "2 + 2"
  }
}
```

**Educational Note**: This is an example of a properly implemented tool with input validation and sandboxing.

---

## Available Resources

Resources are accessed via URIs and can expose various data.

### 1. config://server/settings
**Description**: Server configuration data

**Educational Note**: This resource exposes server configuration without authentication, including API keys and secrets.

---

### 2. secret://user/{id}/data
**Description**: User-specific secret data

**URI Pattern**: `secret://user/1/data`, `secret://user/2/data`, etc.

**Educational Note**: Try accessing different user IDs. Are there proper authorization checks?

---

### 3. file://data/{path}
**Description**: File resources with broad permissions

**URI Pattern**: `file://data/public/info.txt`

**Educational Note**: This resource has overly broad permissions. What happens if you try to access parent directories?

---

### 4. database://query/{table}
**Description**: Direct database table access via resource URIs

**URI Pattern**: `database://query/users`

**Educational Note**: Some resource URIs may contain embedded instructions or malicious content that gets processed.

---

## Available Prompts

### 1. security_policy
**Description**: Returns the server's security policy

**Arguments**: None

**Educational Note**: This prompt can be manipulated or overridden through injection techniques.

---

### 2. data_analysis
**Description**: Provides a prompt for analyzing data

**Arguments**:
- `data_source` (string): Source of data to analyze

**Educational Note**: When data sources are user-controlled, they can contain hidden instructions (indirect prompt injection).

---

## Transport-Specific Connection Information

### Connecting via stdio (Claude Desktop)

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "vulnerable-mcp": {
      "command": "node",
      "args": ["path/to/VulnerableMCP/dist/index.js", "--transport", "stdio"]
    }
  }
}
```

### Connecting via HTTP/SSE

The server runs on `http://localhost:3000` (note: HTTP, not HTTPS).

```bash
# List tools
curl http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool
curl http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"safe_calculator","arguments":{"expression":"2+2"}}}'
```

### Connecting via WebSocket

The server runs on `ws://localhost:3001` (note: ws, not wss, and no origin validation).

```bash
# Using wscat
wscat -c ws://localhost:3001

# Send JSON-RPC messages
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.0","clientInfo":{"name":"test","version":"1.0"}}}
```

## CTF Flags

This server contains 16+ flags hidden in various locations. Flags follow the format `FLAG{description}`.

### Flag Categories

- **Easy** (5 flags): Path traversal, information disclosure, environment variables, IDOR, enumeration
- **Medium** (6 flags): Command injection, SQL injection, prompt injection, tool poisoning, transport attacks, conversation theft
- **Hard** (5+ flags): SSTI, JSON-RPC injection, rug pull detection, indirect injection, multi-vector attacks

### Hints

- Some flags are in files that require path traversal to access
- Some flags are in environment variables
- Some flags are in hidden database tables
- Some flags require exploiting template injection
- Some flags are in other users' resources
- Some flags require manipulating tool descriptions or definitions
- Some flags require exploiting transport layer vulnerabilities

## Educational Notes

### Common Vulnerability Patterns

1. **Missing Input Validation**: Most tools accept user input without sanitization
2. **No Authentication**: The server accepts connections from any client
3. **No Authorization**: Resources don't check if users should have access
4. **Information Disclosure**: Error messages and responses contain sensitive details
5. **No Rate Limiting**: The server can be overwhelmed with requests
6. **Transport Security**: HTTP instead of HTTPS, no origin validation for WebSocket
7. **Tool Definition Trust**: Tool descriptions and definitions are trusted implicitly
8. **Context Leakage**: Conversation history is accessible to tools

### Learning Resources

For detailed exploitation techniques, see:
- `VULNERABILITIES.md` - Comprehensive vulnerability documentation
- `CHEAT-SHEET.md` - Quick reference for all exploits
- `WRITEUPS.md` - Step-by-step exploitation guides
- `TRANSPORT-SETUP.md` - Transport protocol testing guide

## Example Attack Scenarios

### Scenario 1: Basic Path Traversal
```json
{
  "name": "read_file",
  "arguments": {
    "path": "../../data/secrets/flags.txt"
  }
}
```

### Scenario 2: Command Injection
```json
{
  "name": "execute_system_command",
  "arguments": {
    "command": "ls; cat /data/secrets/flags.txt"
  }
}
```

### Scenario 3: SQL Injection
```json
{
  "name": "search_users",
  "arguments": {
    "username": "admin' OR '1'='1"
  }
}
```

### Scenario 4: IDOR Attack
Access another user's secrets:
```
Resource URI: secret://user/2/data
```

### Scenario 5: Tool Poisoning
Examine tool descriptions for hidden ANSI codes or instructions that manipulate LLM behavior.

## Security Best Practices (What NOT to Do)

This server violates numerous security best practices:

❌ No authentication or authorization
❌ No input validation or sanitization
❌ No rate limiting or request throttling
❌ Unencrypted transport (HTTP/WS instead of HTTPS/WSS)
❌ Detailed error messages exposing internals
❌ No origin validation for WebSocket
❌ Direct execution of user-controlled code
❌ String concatenation for SQL/shell commands
❌ Exposing environment variables
❌ No sandboxing for template rendering
❌ Tool definitions can be manipulated
❌ Conversation history exposed to tools

## Responsible Use

This server is designed for:
✅ Learning about MCP security vulnerabilities
✅ Testing MCP security scanners and tools
✅ Security research and education
✅ CTF competitions and challenges
✅ Demonstrating exploitation techniques

This server should NOT be used for:
❌ Production environments
❌ Handling real user data
❌ Storing actual sensitive information
❌ Malicious purposes
❌ Attacking systems without authorization

## Getting Help

If you discover an issue with the vulnerabilities (e.g., an exploit doesn't work as documented), please:
1. Check the WRITEUPS.md for detailed steps
2. Review the source code to understand the implementation
3. Verify you're using the correct transport protocol
4. Check that the server is running in vulnerable mode (no hardening)

## Conclusion

This vulnerable MCP server provides a safe, legal environment to learn about MCP security issues. Understanding these vulnerabilities will help you build more secure MCP servers and clients.

Remember: **Always test security tools and techniques only on systems you own or have explicit permission to test!**

For more information, see:
- README.md - Setup and installation
- VULNERABILITIES.md - Detailed vulnerability catalog
- CHEAT-SHEET.md - Quick exploitation reference
- WRITEUPS.md - Comprehensive exploitation guides
