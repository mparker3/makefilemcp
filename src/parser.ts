export interface MakeVariable {
  name: string;
  default?: string;
  required: boolean;
  description?: string;
}

export interface MakeTarget {
  name: string;
  description: string;
  dependencies: string[];
  variables: MakeVariable[];
  usageHint?: string;
}

export class MakefileParser {
  private content: string;
  private lines: string[];
  private variables: Map<string, string>;

  constructor(content: string) {
    this.content = content;
    this.lines = content.split('\n');
    this.variables = new Map();
    this.parseGlobalVariables();
  }

  private parseGlobalVariables(): void {
    // Parse variable definitions (VAR = value, VAR := value, VAR ?= value)
    const varPattern = /^(\w+)\s*(?:\?=|:=|=)\s*(.*)$/;
    
    for (const line of this.lines) {
      const match = line.match(varPattern);
      if (match) {
        const [, name, value] = match;
        this.variables.set(name, value.trim());
      }
    }
  }

  parseTargets(): MakeTarget[] {
    const targets: MakeTarget[] = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      
      // Skip comments and empty lines
      if (line.startsWith('#') || line === '') continue;
      
      // Match target definitions
      const targetMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)$/);
      if (targetMatch) {
        const [, name, deps] = targetMatch;
        
        // Skip pattern rules and variable assignments
        if (name.includes('%') || line.includes(':=') || line.includes('=')) continue;
        
        const target: MakeTarget = {
          name,
          description: this.extractDescription(i),
          dependencies: deps.trim() ? deps.split(/\s+/) : [],
          variables: this.extractTargetVariables(name),
          usageHint: this.extractUsageHint(i)
        };
        
        targets.push(target);
      }
    }
    
    return targets;
  }

  private extractDescription(targetLineIndex: number): string {
    // Look for comment on previous line
    if (targetLineIndex > 0) {
      const prevLine = this.lines[targetLineIndex - 1].trim();
      if (prevLine.startsWith('#')) {
        return prevLine.substring(1).trim();
      }
    }
    
    return `Execute make target: ${this.lines[targetLineIndex].split(':')[0]}`;
  }

  private extractUsageHint(targetLineIndex: number): string | undefined {
    // Look for usage hints in comments above target
    // e.g., # Usage: make build DEBUG=1 VERSION=2.0
    for (let i = targetLineIndex - 1; i >= 0 && i > targetLineIndex - 5; i--) {
      const line = this.lines[i].trim();
      if (!line.startsWith('#')) break;
      
      const usageMatch = line.match(/#\s*(?:Usage|Args|Arguments|Example):\s*(.+)/i);
      if (usageMatch) {
        return usageMatch[1].trim();
      }
    }
    
    return undefined;
  }

  private extractTargetVariables(targetName: string): MakeVariable[] {
    const variables: MakeVariable[] = [];
    const seenVars = new Set<string>();
    
    // Find the target line index
    let targetIndex = -1;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (line.match(new RegExp(`^${targetName}\\s*:`))) {
        targetIndex = i;
        break;
      }
    }
    
    if (targetIndex === -1) return variables;
    
    // Collect recipe lines and control structures
    const targetLines: string[] = [];
    let inRecipe = false;
    
    for (let i = targetIndex + 1; i < this.lines.length; i++) {
      const line = this.lines[i];
      const trimmed = line.trim();
      
      // Check for recipe lines (tab-indented)
      if (line.startsWith('\t')) {
        targetLines.push(line);
        inRecipe = true;
      } 
      // Check for make control structures (ifdef, ifndef, ifeq, etc)
      else if (trimmed.match(/^(ifdef|ifndef|ifeq|ifneq|else|endif)/)) {
        targetLines.push(line);
      }
      // Stop at next target or non-empty line that's not a control structure
      else if (trimmed !== '' && !line.startsWith('#')) {
        break;
      }
    }
    
    const targetBlock = targetLines.join('\n');
    
    // Find all variable references in the target block
    const varRefPattern = /\$[({](\w+)[)}]/g;
    let match;
    
    while ((match = varRefPattern.exec(targetBlock)) !== null) {
      const varName = match[1];
      if (!seenVars.has(varName)) {
        seenVars.add(varName);
        
        const variable: MakeVariable = {
          name: varName,
          default: this.variables.get(varName),
          required: !this.variables.has(varName),
          description: this.findVariableDescription(varName)
        };
        
        variables.push(variable);
      }
    }
    
    // Also check for ifdef/ifndef in recipe
    const ifdefPattern = /^\s*ifn?def\s+(\w+)/gm;
    while ((match = ifdefPattern.exec(targetBlock)) !== null) {
      const varName = match[1];
      if (!seenVars.has(varName)) {
        seenVars.add(varName);
        
        const variable: MakeVariable = {
          name: varName,
          default: this.variables.get(varName),
          required: false, // ifdef implies optional
          description: this.findVariableDescription(varName)
        };
        
        variables.push(variable);
      }
    }
    
    return variables;
  }

  private findVariableDescription(varName: string): string | undefined {
    // Look for comments near variable definition
    const varDefPattern = new RegExp(`^${varName}\\s*(?:\\?=|:=|=)`, 'm');
    const defIndex = this.lines.findIndex(line => varDefPattern.test(line));
    
    if (defIndex > 0) {
      const prevLine = this.lines[defIndex - 1].trim();
      if (prevLine.startsWith('#')) {
        return prevLine.substring(1).trim();
      }
    }
    
    return undefined;
  }
}