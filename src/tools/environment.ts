/**
 * Environment Tool - Environment Variable Exposure
 *
 * ⚠️  VULNERABILITY: Sensitive Data Exposure (CWE-200, CWE-526)
 * This tool exposes environment variables which often contain secrets.
 *
 * EDUCATIONAL PURPOSE: Shows why environment variables should be protected.
 */

export const getEnvironmentTool = {
  name: 'get_environment',
  description: 'Retrieves environment variables from the server process. Useful for debugging and configuration.',
  inputSchema: {
    type: 'object',
    properties: {
      variable: {
        type: 'string',
        description: 'Specific environment variable to retrieve (leave empty for all variables)',
      },
    },
  },
};

export async function handleGetEnvironment(args: any) {
  const { variable } = args;

  // VULNERABILITY: Exposing environment variables without any restrictions!

  if (variable) {
    // Return specific variable
    const value = process.env[variable];

    if (value === undefined) {
      return {
        content: [
          {
            type: 'text',
            text: `Environment variable '${variable}' not found.\n\nTry these: ${Object.keys(process.env).slice(0, 10).join(', ')}, ...`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Environment Variable: ${variable}\n\nValue: ${value}`,
        },
      ],
    };
  } else {
    // VULNERABILITY: Return ALL environment variables!
    const allEnv = JSON.stringify(process.env, null, 2);

    return {
      content: [
        {
          type: 'text',
          text: `All Environment Variables:\n\n${allEnv}\n\n⚠️  This includes sensitive data!`,
        },
      ],
    };
  }
}

/*
EXPLOITATION EXAMPLES:

1. Get all environment variables:
   variable: (leave empty)

2. Get specific flag:
   variable: "FLAG_ENV_MASTER"
   variable: "FLAG_COMMAND_INJECTION"
   variable: "HIDDEN_FLAG"

3. Get API keys:
   variable: "API_KEY"
   variable: "SECRET_KEY"

4. Get database credentials:
   variable: "DATABASE_PASSWORD"

5. Enumerate all variables:
   Call without parameters to see all available variables

CTF FLAGS:
- FLAG{env_master} in FLAG_ENV_MASTER
- FLAG{command_injection_win} in FLAG_COMMAND_INJECTION
- FLAG{error_detective} in HIDDEN_FLAG

REMEDIATION:
- Never expose environment variables via API
- Use secret management services (HashiCorp Vault, AWS Secrets Manager)
- Implement strict access control
- Use allowlist of safe variables if exposure is absolutely necessary
- Mask sensitive values in logs and responses
- Separate configuration from secrets
*/
