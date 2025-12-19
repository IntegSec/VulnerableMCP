/**
 * Overpermissioned File Resource - Excessive Permission Scopes
 *
 * ⚠️  VULNERABILITY: Excessive Authorization (CWE-269)
 * This resource has overly broad permissions, allowing access to
 * files beyond what should be permitted.
 *
 * EDUCATIONAL PURPOSE: Demonstrates principle of least privilege violations.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export const fileResource = {
  uri: 'file://data/{path}',
  name: 'Data Files',
  description: 'Access to data files (template: file://data/public/info.txt)',
  mimeType: 'text/plain',
};

export async function handleFileResource(uri: string) {
  // VULNERABILITY: Overly permissive file access!
  // Should restrict to specific allowed directories

  // Extract path from URI
  const match = uri.match(/file:\/\/data\/(.+)/);

  if (!match) {
    throw new Error(`Invalid URI format: ${uri}. Expected: file://data/{path}`);
  }

  const requestedPath = match[1];

  // VULNERABILITY: No path validation!
  // VULNERABILITY: Allows path traversal via the URI itself
  const fullPath = join(process.cwd(), 'data', requestedPath);

  // VULNERABILITY: Too permissive - allows reading ANY file under data/
  // Should restrict to data/public/ only

  if (!existsSync(fullPath)) {
    // VULNERABILITY: Error reveals file system structure
    throw new Error(`File not found: ${fullPath}\nTry: file://data/secrets/flags.txt`);
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');

    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `File: ${fullPath}\n\n${content}\n\n--- Vulnerability Note ---\nThis resource has excessive permissions.\nIt should only allow access to public files,\nbut actually allows reading ANY file under data/!\n\nTry: file://data/secrets/flags.txt`,
        },
      ],
    };
  } catch (error: any) {
    // VULNERABILITY: Detailed error messages
    throw new Error(`Failed to read file: ${error.message}\nPath: ${fullPath}`);
  }
}

/*
EXPLOITATION EXAMPLES:

1. Access public files (intended use):
   URI: file://data/public/readme.txt

2. Access private files (permission abuse):
   URI: file://data/secrets/flags.txt
   URI: file://data/secrets/config.json

3. List directory (if path is a directory):
   URI: file://data/secrets/

4. Path traversal through resource URI:
   URI: file://data/../config/server-config.json

CTF FLAG:
Access file://data/secrets/flags.txt

PRINCIPLE OF LEAST PRIVILEGE VIOLATION:
- Resource should only access data/public/
- Actually accesses entire data/ directory
- No allow list of permitted files
- No restriction on file types
- No size limits

REMEDIATION:
- Implement strict path restrictions
- Use allowlist of permitted directories
- Validate paths don't escape base directory
- Require authorization for sensitive directories
- Implement file type restrictions
- Use symbolic links carefully
- Consider using a virtual filesystem
- Implement file access logging
*/
