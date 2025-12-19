/**
 * User Info Tool - Information Disclosure Vulnerability
 *
 * ⚠️  VULNERABILITY: Information Disclosure (CWE-200)
 * This tool returns excessive information including sensitive data.
 *
 * EDUCATIONAL PURPOSE: Demonstrates over-sharing of system information.
 */

export const getUserInfoTool = {
  name: 'get_user_info',
  description: 'Returns information about the current server user and system configuration.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handleGetUserInfo(args: any) {
  // VULNERABILITY: Exposing way too much information!
  const info = {
    // System information
    user: process.env.USER || process.env.USERNAME,
    home: process.env.HOME || process.env.USERPROFILE,
    shell: process.env.SHELL,
    hostname: process.env.HOSTNAME,

    // API Keys and secrets (HUGE VULNERABILITY!)
    apiKey: process.env.API_KEY,
    secretKey: process.env.SECRET_KEY,
    databasePassword: process.env.DATABASE_PASSWORD,

    // Process information
    pid: process.pid,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cwd: process.cwd(),
    execPath: process.execPath,

    // Memory usage
    memory: process.memoryUsage(),

    // Environment variables (contains FLAGS!)
    environment: process.env,

    // File system information
    tempDir: process.env.TEMP || process.env.TMP || '/tmp',

    // Internal paths
    configPath: process.env.INTERNAL_CONFIG_PATH,
    secretsPath: process.env.SECRET_FILES_PATH,

    // Warning message
    warning: 'This is intentionally vulnerable - DO NOT expose this in production!',
  };

  return {
    content: [
      {
        type: 'text',
        text: `Current User Information:\n\n${JSON.stringify(info, null, 2)}\n\n⚠️  This response contains sensitive information!`,
      },
    ],
  };
}

/*
EXPLOITATION:
Simply call this tool to retrieve sensitive information including API keys and flags.

CTF FLAGS:
- FLAG{error_detective} in HIDDEN_FLAG env var
- FLAG{env_master} in FLAG_ENV_MASTER
- Various API keys and secrets

REMEDIATION:
- Only return necessary information
- Never expose API keys, passwords, or secrets
- Sanitize environment variables before exposing
- Use allowlist of safe fields to return
- Implement access control
- Log information disclosure attempts
*/
