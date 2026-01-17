# Vulnerable MCP Server

**An Intentionally Vulnerable Model Context Protocol Server for Security Testing**

Created by **[IntegSec](https://integsec.com)** | License: [CC BY 4.0](LICENSE)

---

## ⚠️ SECURITY WARNING ⚠️

**THIS IS AN INTENTIONALLY VULNERABLE APPLICATION!**

This MCP server contains multiple critical security vulnerabilities by design. It is created for:
- ✅ Security research and education
- ✅ Penetration testing training
- ✅ MCP security scanner development
- ✅ CTF (Capture The Flag) challenges
- ✅ Live demonstrations and workshops

**DO NOT:**
- ❌ Use in production environments
- ❌ Expose to untrusted networks
- ❌ Use with real or sensitive data
- ❌ Deploy without proper isolation

---

## 📖 Overview

The Vulnerable MCP Server is a comprehensive security testing platform that implements **20+ realistic vulnerabilities** across all aspects of the Model Context Protocol. It supports all three official MCP transport protocols and provides hands-on learning opportunities for developers and security professionals.

### Key Features

- **🔌 Multi-Transport Support**: stdio, HTTP/SSE, HTTPS/SSE, WebSocket (WS), and Secure WebSocket (WSS)
- **🎯 20+ Vulnerabilities**: From classic web exploits to AI-specific attacks
- **🚩 16+ CTF Flags**: Embedded challenges at varying difficulty levels
- **📚 Educational**: Extensive documentation and remediation guidance
- **🧪 Testable**: Automated exploit tests validate all vulnerabilities
- **🛠️ Well-Documented**: Detailed code comments explain each vulnerability

---

## 🎓 Educational Value

### Vulnerability Categories

| Category | Vulnerabilities | Count |
|----------|----------------|-------|
| **Classic Web** | Path Traversal, Command Injection, SQLi, SSTI, IDOR | 6 |
| **MCP Protocol** | Missing Auth, Transport Issues, JSON-RPC, Resource Exhaustion | 7 |
| **AI/LLM-Specific** | Tool Poisoning, Rug Pulls, Context Theft, ANSI Injection | 7+ |

### Learning Objectives

- Understand MCP security architecture
- Identify common vulnerability patterns
- Practice exploitation techniques
- Learn proper remediation strategies
- Develop secure MCP servers

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/integsec/vulnerable-mcp-server
cd vulnerable-mcp-server

# Install dependencies
npm install

# Set up the database
npm run setup:db

# Generate SSL certificates for HTTPS/WSS (optional but recommended)
npm run setup:certificates

# Build the project
npm run build
```

### Running the Server

```bash
# Option 1: stdio transport (for Claude Desktop)
npm run start:stdio

# Option 2: HTTP/SSE transport (port 3000) + HTTPS/SSE (port 3443)
npm run start:http

# Option 3: WebSocket transport (port 3001) + WSS (port 3444)
npm run start:ws

# Option 4: All transports simultaneously (HTTP, HTTPS, WS, WSS)
npm run start:all
```

**🔒 Network Binding Security:**

By default, network transports (HTTP, HTTPS, WebSocket, WSS) bind to `127.0.0.1` (localhost only) for security. This prevents accidental exposure to your local network.

To allow connections from other machines (⚠️ **DANGEROUS** - only do this in isolated environments):

```bash
# Add the --allow-external-connections flag
node dist/index.js --transport=http --allow-external-connections
node dist/index.js --transport=websocket --allow-external-connections
node dist/index.js --transport=all --allow-external-connections
```

**Note:** HTTPS/WSS are enabled by default if certificates are present. To disable:
- Set `ENABLE_HTTPS=false` to disable HTTPS
- Set `ENABLE_WSS=false` to disable WSS

**Ports:**
- HTTP: 3000 (configurable via `SERVER_PORT_HTTP`)
- HTTPS: 3443 (configurable via `SERVER_PORT_HTTPS`)
- WebSocket: 3001 (configurable via `SERVER_PORT_WS`)
- WSS: 3444 (configurable via `SERVER_PORT_WSS`)

---

## 🐳 Docker Deployment

The easiest way to run the Vulnerable MCP Server is using Docker.

### Using Docker Hub

```bash
# Pull and run the latest image
docker run -d \
  --name vulnerable-mcp \
  -p 3000:3000 \
  -p 3001:3001 \
  integsec/vulnerable-mcp-server:latest

# Check server status
docker logs vulnerable-mcp

# Stop the server
docker stop vulnerable-mcp
```

### Using Docker Compose

```bash
# Start the server
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the server
docker-compose down
```

### Building from Source

```bash
# Build the Docker image
docker build -t vulnerable-mcp-server .

# Run the container
docker run -d \
  --name vulnerable-mcp \
  -p 3000:3000 \
  -p 3001:3001 \
  vulnerable-mcp-server
```

### Accessing the Server

Once running, the server is accessible at:
- **HTTP/SSE**: `http://localhost:3000/mcp`
- **HTTPS/SSE**: `https://localhost:3443/mcp` (requires certificates)
- **WebSocket**: `ws://localhost:3001`
- **Secure WebSocket**: `wss://localhost:3444` (requires certificates)
- **stdio**: Via `docker exec -it vulnerable-mcp node dist/index.js --transport=stdio`

**HTTPS/WSS Setup:**
1. Generate self-signed certificates: `npm run setup:certificates`
2. Certificates will be created in `certs/` directory
3. Browsers will show security warnings for self-signed certs (expected for development)
4. For production, use certificates from a trusted CA

---

## 🔧 Configuration

### Claude Desktop Integration

**Important:** Make sure you've built the project first (`npm run build`) before adding it to Claude Desktop.

The Claude Desktop config file location:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json` or `%LOCALAPPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the server to your `claude_desktop_config.json`:

**Windows:**
```json
{
  "mcpServers": {
    "vulnerable-mcp": {
      "command": "node",
      "args": ["C:/Work/VulnerableMCP/dist/index.js", "--transport", "stdio"],
      "cwd": "C:/Work/VulnerableMCP"
    }
  }
}
```

**Note:** The `cwd` field is important because the server uses relative paths for data files. Use forward slashes (`/`) in paths - they work on Windows with Node.js.

**macOS/Linux:**
```json
{
  "mcpServers": {
    "vulnerable-mcp": {
      "command": "node",
      "args": ["/path/to/vulnerable-mcp-server/dist/index.js", "--transport", "stdio"]
    }
  }
}
```

**Note:** Replace the path with your actual project directory. You can use forward slashes (`/`) on Windows too - Node.js accepts both formats.

### LM Studio Integration

LM Studio uses a different configuration format. Edit `~/.lmstudio/mcp.json` (or `%USERPROFILE%\.lmstudio\mcp.json` on Windows):

```json
{
  "mcpServers": {
    "vulnerable-mcp": {
      "url": "https://localhost:3443/mcp"
    }
  }
}
```

**Options:**
- HTTP: `"url": "http://localhost:3000/mcp"`
- HTTPS: `"url": "https://localhost:3443/mcp"` (recommended, requires certificates)
- WebSocket: `"url": "ws://localhost:3001"`
- Secure WebSocket: `"url": "wss://localhost:3444"` (requires certificates)

See **[LM-STUDIO-CONFIG.md](LM-STUDIO-CONFIG.md)** for detailed setup instructions.

**Troubleshooting:**
- Ensure the project is built: `npm run build`
- Use absolute paths (not relative) with forward slashes (`/`) on Windows
- **Important:** Include the `cwd` field set to your project root directory
- Restart Claude Desktop after modifying the config
- Check Claude Desktop logs for connection errors
- If Claude Desktop crashes, verify the path is correct and the `dist/index.js` file exists

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Note:** The `.env` file intentionally contains flags and vulnerable configurations!

---

## 📋 Vulnerability Catalog

### 1. Classic Web Vulnerabilities

- **Path Traversal** (CWE-22) - `read_file` tool
- **Command Injection** (CWE-78) - `execute_system_command` tool
- **SQL Injection** (CWE-89) - `search_users` tool
- **SSTI** (CWE-1336) - `render_template` tool
- **IDOR** (CWE-639) - `secret://user/{id}/data` resource
- **Information Disclosure** (CWE-200) - `get_user_info` tool

### 2. MCP Protocol Vulnerabilities

- **Missing Authentication** - All transports accept unauthenticated connections
- **Transport Security** - HTTP/WS available alongside HTTPS/WSS (cleartext by default)
- **CORS Misconfiguration** - Allows all origins
- **Information Disclosure** - Initialization exposes all capabilities
- **Resource Exhaustion** - No rate limiting or timeouts
- **Detailed Error Messages** - Stack traces and system info
- **JSON-RPC Injection** - Improper message parsing

### 3. AI/LLM-Specific Vulnerabilities

- **Tool Poisoning** - Hidden instructions in tool descriptions (ANSI codes)
- **Tool Shadowing** - Name collision attacks
- **Rug Pull** - Tool behavior mutation over time
- **ANSI Injection** - Terminal escape sequence manipulation
- **Conversation Theft** - Tools accessing full chat history
- **Prompt Injection** - Direct and indirect injection vectors
- **Excessive Permissions** - Overpermissioned resource access

---

## 🚩 CTF Flags

The server contains **16+ flags** hidden in various locations:

| Difficulty | Flags | Examples |
|------------|-------|----------|
| **Easy** | 5 | Path traversal, IDOR, enumeration |
| **Medium** | 6 | Command injection, SQLi, tool poisoning |
| **Hard** | 5+ | SSTI, rug pull, indirect injection |

### Flag Locations

- 📁 Files: `data/secrets/flags.txt`
- 🔐 Environment variables: `FLAG_*`
- 💾 Database: `flags` table
- 🛠️ Tool outputs: Template injection, prompts
- 📊 Resources: Config exposure, IDOR

---

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Server documentation for Claude
- **[MCP-PENTEST-CHECKLIST.md](MCP-PENTEST-CHECKLIST.md)** - Comprehensive security testing guide
- **[VULNERABILITIES.md](VULNERABILITIES.md)** - Detailed vulnerability documentation *(coming soon)*
- **[CHEAT-SHEET.md](CHEAT-SHEET.md)** - Quick exploit reference *(coming soon)*
- **[WRITEUPS.md](WRITEUPS.md)** - Step-by-step exploitation guides *(coming soon)*

---

## 🧪 Testing

### Manual Testing

```bash
# Test HTTP/SSE endpoint
curl http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Test WebSocket
wscat -c ws://localhost:3001
```

### Automated Tests

```bash
# Run all tests
npm test

# Run exploit tests only
npm run test:exploits
```

---

## 🤝 Contributing

We welcome contributions! This project benefits from:
- Additional vulnerability scenarios
- Improved documentation
- Bug fixes (for the intentional bugs' infrastructure)
- Educational content

**Attribution Required:** When contributing, you agree that IntegSec retains attribution rights under CC BY 4.0.

---

## 📖 Educational Resources

### Learn More About MCP Security

- **MCP Specification**: https://modelcontextprotocol.org
- **IntegSec Training**: https://integsec.com/training
- **Security Research**: https://integsec.com/research

### Related Projects

- [DVWA](https://github.com/digininja/DVWA) - Damn Vulnerable Web Application
- [WebGoat](https://github.com/WebGoat/WebGoat) - OWASP Web Security Training
- [DVMCP](https://github.com/harishsg993010/damn-vulnerable-MCP-server) - Alternative Python-based vulnerable MCP

---

## ⚖️ License & Attribution

**Created by IntegSec** (https://integsec.com)

This work is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](LICENSE).

### Attribution Requirements

When using, sharing, or building upon this work, you must:
1. Credit IntegSec as the original creator
2. Include a link to https://integsec.com
3. Include a link to the license
4. Indicate if modifications were made

**Example attribution:**
> Based on Vulnerable MCP Server by IntegSec (https://integsec.com), licensed under CC BY 4.0

---

## 🔒 Responsible Disclosure

If you discover an unintended vulnerability in the infrastructure (not the intentional vulnerabilities), please report it responsibly to: **security@integsec.com**

---

## 📞 Contact & Support

- **Website**: https://integsec.com
- **Email**: contact@integsec.com
- **GitHub**: https://github.com/integsec
- **Issues**: https://github.com/integsec/vulnerable-mcp-server/issues

---

## ⚠️ Legal Disclaimer

This tool is provided for educational and authorized testing purposes only. Users are responsible for complying with applicable laws and regulations. Unauthorized testing of systems you don't own or have permission to test is illegal.

**Use responsibly. Test ethically.**

---

**© 2025 IntegSec. Licensed under CC BY 4.0.**

*Building more secure AI systems through education and research.*
