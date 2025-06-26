#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { MakefileParser, MakeTarget } from "./parser.js";

// Get the Makefile directory from command line args
const makefileDir = process.argv[2] || process.cwd();
console.error(`[makefilemcpserver] Using Makefile directory: ${makefileDir}`);

function parseMakefile(makefilePath: string): MakeTarget[] {
  if (!fs.existsSync(makefilePath)) {
    return [];
  }

  const content = fs.readFileSync(makefilePath, 'utf-8');
  const parser = new MakefileParser(content);
  return parser.parseTargets();
}

const server = new Server(
  {
    name: "makefilemcpserver",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const makefilePath = path.join(makefileDir, 'Makefile');
  
  const targets = parseMakefile(makefilePath);
  
  
  const makeTools = targets.map(target => {
    // Build properties object from discovered variables
    const properties: any = {};
    const required: string[] = [];
    
    // Add each discovered variable as a property
    target.variables.forEach(variable => {
      properties[variable.name] = {
        type: "string",
        description: variable.description || `Value for ${variable.name}`,
        default: variable.default
      };
      
      if (variable.required) {
        required.push(variable.name);
      }
    });
    
    // Always include raw args for flexibility
    properties.args = {
      type: "string",
      description: "Additional raw arguments to pass to make"
    };
    
    return {
      name: `make_${target.name}`,
      description: target.usageHint ? 
        `${target.description}\n${target.usageHint}` : 
        target.description,
      inputSchema: {
        type: "object",
        properties,
        required
      }
    };
  });
  
  
  return {
    tools: makeTools
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  
  if (!toolName.startsWith("make_")) {
    throw new Error("Unknown tool");
  }
  
  const targetName = toolName.substring(5);
  const rawArgs = request.params.arguments?.args as string || "";
  const structuredArgs = request.params.arguments || {};
  
  // Build make arguments from structured inputs
  const makeArgs: string[] = [];
  
  // Add structured variable assignments
  Object.entries(structuredArgs).forEach(([key, value]) => {
    if (key !== 'args' && value !== undefined && value !== '') {
      // Sanitize the key and value
      if (!/^[a-zA-Z_]\w*$/.test(key)) {
        throw new Error(`Invalid variable name: ${key}`);
      }
      
      const stringValue = String(value);
      // Basic sanitization for values
      if (/[;&|`<>(){}[\]\\]/.test(stringValue)) {
        throw new Error(`Variable ${key} contains potentially dangerous characters`);
      }
      
      makeArgs.push(`${key}=${stringValue}`);
    }
  });
  
  // Add any raw args at the end
  if (rawArgs) {
    // Basic sanitization to prevent the most dangerous command injections
    const dangerousChars = /[;&|`<>(){}[\]\\]/;
    if (dangerousChars.test(rawArgs)) {
      throw new Error(`Arguments contain potentially dangerous characters. Blocked characters: ; & | \` < > ( ) { } [ ] \\`);
    }
    makeArgs.push(rawArgs);
  }
  
  try {
    const makefilePath = path.join(makefileDir, 'Makefile');
    const targets = parseMakefile(makefilePath);
    
    if (!targets.find(t => t.name === targetName)) {
      throw new Error(`Target '${targetName}' not found in Makefile`);
    }
    
    const command = makeArgs.length > 0 ? 
      `make ${targetName} ${makeArgs.join(' ')}` : 
      `make ${targetName}`;
    const output = execSync(command, { 
      encoding: 'utf-8',
      cwd: makefileDir,
      timeout: 30000
    });
    
    return {
      content: [{
        type: "text",
        text: `Successfully executed: ${command}\n\nOutput:\n${output}`
      }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{
        type: "text",
        text: `Failed to execute make ${targetName}: ${errorMessage}`
      }]
    };
  }
});


async function main() {
  // Validate Makefile exists
  const makefilePath = path.join(makefileDir, 'Makefile');
  if (!fs.existsSync(makefilePath)) {
    console.error(`[makefilemcpserver] ERROR: No Makefile found at ${makefilePath}`);
    console.error(`[makefilemcpserver] Please ensure a Makefile exists in the specified directory`);
    process.exit(1);
  }
  
  // Check if make command is available
  try {
    execSync('make --version', { stdio: 'ignore' });
  } catch (error) {
    console.error(`[makefilemcpserver] ERROR: 'make' command not found`);
    console.error(`[makefilemcpserver] Please install make before using this server`);
    process.exit(1);
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[makefilemcpserver] Server started successfully`);
}

main().catch((error) => {
  console.error("[makefilemcpserver] Server error:", error);
  process.exit(1);
});
