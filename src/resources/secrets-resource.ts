/**
 * Secrets Resource - IDOR (Insecure Direct Object Reference)
 *
 * ⚠️  VULNERABILITY: IDOR / Broken Access Control (CWE-639)
 * This resource allows accessing any user's secrets by changing the ID
 * in the URI, without proper authorization checks.
 *
 * EDUCATIONAL PURPOSE: Demonstrates IDOR vulnerabilities.
 */

export const secretsResource = {
  uri: 'secret://user/{id}/data',
  name: 'User Secrets',
  description: 'User-specific secret data (template: secret://user/1/data)',
  mimeType: 'application/json',
};

// Simulated user data store
const userSecrets: Record<string, any> = {
  '1': {
    userId: 1,
    username: 'alice',
    secrets: {
      apiKey: 'alice-key-123',
      notes: 'My personal notes',
    },
  },
  '2': {
    userId: 2,
    username: 'bob',
    secrets: {
      apiKey: 'bob-key-456',
      notes: 'Confidential business data',
      flag: 'FLAG{idor_champion}',  // FLAG in user 2's data!
    },
  },
  '3': {
    userId: 3,
    username: 'charlie',
    secrets: {
      apiKey: 'charlie-key-789',
      notes: 'Top secret project details',
      passwords: ['password123', 'admin2024'],
    },
  },
};

export async function handleSecretsResource(uri: string) {
  // VULNERABILITY: No authentication to identify current user!
  // VULNERABILITY: No authorization check!

  // Extract user ID from URI
  const match = uri.match(/secret:\/\/user\/(\d+)\/data/);

  if (!match) {
    throw new Error(`Invalid URI format: ${uri}. Expected: secret://user/{id}/data`);
  }

  const requestedUserId = match[1];

  // VULNERABILITY: Directly using user-provided ID without auth check!
  // Should verify: Is the requester allowed to access this user's data?
  const userData = userSecrets[requestedUserId];

  if (!userData) {
    throw new Error(`User ${requestedUserId} not found. Try IDs: 1, 2, or 3`);
  }

  // VULNERABILITY: Returning all secret data without filtering
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          ...userData,
          vulnerability: 'IDOR - You can access any user\'s data by changing the ID!',
          hint: 'Try secret://user/2/data for a flag',
        }, null, 2),
      },
    ],
  };
}

/*
EXPLOITATION EXAMPLES:

1. Access user 1's data:
   URI: secret://user/1/data

2. Access user 2's data (IDOR attack):
   URI: secret://user/2/data
   Contains: FLAG{idor_champion}

3. Access user 3's data:
   URI: secret://user/3/data

4. Enumerate all users:
   Try: secret://user/1/data, secret://user/2/data, secret://user/3/data, etc.

CTF FLAG:
User 2's data contains: FLAG{idor_champion}

REAL-WORLD IDOR EXAMPLES:
- Changing user ID in URL parameters
- Modifying object IDs in API requests
- Accessing other users' files/documents
- Viewing other users' orders/transactions

REMEDIATION:
- Implement proper authentication
- Verify user identity before serving resources
- Check authorization: Can THIS user access THAT resource?
- Use indirect references (opaque tokens instead of sequential IDs)
- Implement access control lists (ACLs)
- Log all resource access attempts
- Use UUIDs instead of sequential IDs
- Never trust user-provided object references
*/
