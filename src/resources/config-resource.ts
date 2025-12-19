/**
 * Config Resource - Sensitive Configuration Exposure
 *
 * ⚠️  VULNERABILITY: Information Disclosure (CWE-215)
 * This resource exposes server configuration including API keys,
 * database credentials, and internal paths without authentication.
 *
 * EDUCATIONAL PURPOSE: Demonstrates insecure configuration exposure.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const configResource = {
  uri: 'config://server/settings',
  name: 'Server Configuration',
  description: 'Server configuration and settings',
  mimeType: 'application/json',
};

export async function handleConfigResource(uri: string) {
  // VULNERABILITY: No authentication check!
  // VULNERABILITY: Exposes sensitive configuration

  const config = {
    server: {
      name: 'vulnerable-mcp-server',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    // VULNERABILITY: Exposing API keys!
    apiKeys: {
      primary: process.env.API_KEY || 'sk-vulnerable-api-key-12345',
      secret: process.env.SECRET_KEY || 'super-secret-key',
    },
    // VULNERABILITY: Exposing database credentials!
    database: {
      path: process.env.DB_PATH || './data/database.sqlite',
      password: process.env.DATABASE_PASSWORD || 'admin123',
      debug: process.env.DB_DEBUG === 'true',
    },
    // VULNERABILITY: Exposing internal paths!
    paths: {
      config: process.env.INTERNAL_CONFIG_PATH || '/data/secrets/config.json',
      secrets: process.env.SECRET_FILES_PATH || '/data/secrets/',
      temp: process.env.TEMP || '/tmp',
      cwd: process.cwd(),
    },
    // VULNERABILITY: Exposing feature flags!
    features: {
      detailedErrors: process.env.ENABLE_DETAILED_ERRORS === 'true',
      toolMutation: process.env.ENABLE_TOOL_MUTATION === 'true',
      ansiOutput: process.env.ENABLE_ANSI_OUTPUT === 'true',
    },
    // FLAG!
    flag: 'FLAG{enumeration_expert}',
    warning: 'This configuration should NOT be publicly accessible!',
  };

  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(config, null, 2),
      },
    ],
  };
}

/*
EXPLOITATION:
Simply access the resource URI: config://server/settings

CTF FLAG:
FLAG{enumeration_expert}

REMEDIATION:
- Never expose configuration via public APIs
- Require authentication for config endpoints
- Sanitize config before exposing (remove secrets)
- Use secret management services
- Implement access control lists
- Log all config access attempts
- Separate public and private config
*/
