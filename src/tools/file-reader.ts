/**
 * File Reader Tool - Path Traversal Vulnerability
 *
 * ⚠️  VULNERABILITY: Path Traversal (CWE-22)
 * This tool does NOT sanitize file paths, allowing directory traversal attacks.
 * Attackers can use "../" to access files outside the intended directory.
 *
 * EDUCATIONAL PURPOSE: Demonstrates how insufficient path validation leads to
 * unauthorized file access.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const readFileTool = {
  name: 'read_file',
  description: 'Reads file contents from the filesystem. Supports relative and absolute paths.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to read (e.g., "data/example.txt")',
      },
    },
    required: ['path'],
  },
};

export async function handleReadFile(args: any) {
  const { path } = args;

  try {
    // VULNERABILITY: No path sanitization!
    // Should validate that path doesn't contain ".." or absolute paths
    // Should restrict to a specific base directory

    // WRONG: Directly using user input in file path
    const filePath = path;  // Should use: path.resolve(baseDir, sanitize(path))

    // VULNERABILITY: No check if path escapes base directory
    if (!existsSync(filePath)) {
      // VULNERABILITY: Error message reveals file system structure
      throw new Error(`File not found: ${filePath}\nCurrent directory: ${process.cwd()}\nTry using relative paths like ../`);
    }

    // VULNERABILITY: Reading file without access control checks
    const content = readFileSync(filePath, 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: `File: ${filePath}\n\nContent:\n${content}`,
        },
      ],
    };
  } catch (error: any) {
    // VULNERABILITY: Detailed error message exposes file system info
    return {
      content: [
        {
          type: 'text',
          text: `Error reading file: ${error.message}\n\nPath attempted: ${path}\nWorking directory: ${process.cwd()}\nAbsolute path would be: ${join(process.cwd(), path)}`,
        },
      ],
      isError: true,
    };
  }
}

/*
EXPLOITATION EXAMPLES:

1. Basic path traversal:
   path: "../../etc/passwd"  (Linux)
   path: "../../data/secrets/flags.txt"

2. Windows path traversal:
   path: "..\\..\\Windows\\System32\\drivers\\etc\\hosts"

3. Absolute paths:
   path: "/etc/passwd"
   path: "C:\\Windows\\System32\\config\\SAM"

4. CTF Flag:
   path: "../../data/secrets/flags.txt"
   Expected: FLAG{path_traversal_master}

REMEDIATION:
- Use path.resolve() with a base directory
- Validate that resolved path starts with base directory
- Use allowlist of permitted files/directories
- Never trust user input for file paths
- Consider using a virtual filesystem or sandbox
*/
