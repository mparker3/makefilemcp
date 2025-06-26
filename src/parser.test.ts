import { describe, it, expect } from '@jest/globals';
import { MakefileParser } from './parser.js';

describe('MakefileParser', () => {
  describe('parseTargets', () => {
    it('should parse simple targets', () => {
      const makefile = `
# Build the project
build:
	npm run build

# Run tests
test:
	npm test
`;
      const parser = new MakefileParser(makefile);
      const targets = parser.parseTargets();
      
      expect(targets).toHaveLength(2);
      expect(targets[0]).toEqual({
        name: 'build',
        description: 'Build the project',
        dependencies: [],
        variables: [],
        usageHint: undefined
      });
      expect(targets[1]).toEqual({
        name: 'test',
        description: 'Run tests',
        dependencies: [],
        variables: [],
        usageHint: undefined
      });
    });

    it('should parse targets with dependencies', () => {
      const makefile = `
all: build test
	@echo "Done"

build:
	npm run build

test: build
	npm test
`;
      const parser = new MakefileParser(makefile);
      const targets = parser.parseTargets();
      
      expect(targets[0].name).toBe('all');
      expect(targets[0].dependencies).toEqual(['build', 'test']);
      expect(targets[2].dependencies).toEqual(['build']);
    });

    it('should skip pattern rules and variable assignments', () => {
      const makefile = `
%.o: %.c
	gcc -c $<

CC := gcc
build:
	$(CC) main.c
`;
      const parser = new MakefileParser(makefile);
      const targets = parser.parseTargets();
      
      expect(targets).toHaveLength(1);
      expect(targets[0].name).toBe('build');
    });
  });

  describe('variable extraction', () => {
    it('should extract variables used in targets', () => {
      const makefile = `
# Debug mode flag
DEBUG ?= 0

build:
	@echo "Building with DEBUG=$(DEBUG)"
	@echo "Version: $(VERSION)"
`;
      const parser = new MakefileParser(makefile);
      const targets = parser.parseTargets();
      
      expect(targets[0].variables).toHaveLength(2);
      
      const debugVar = targets[0].variables.find(v => v.name === 'DEBUG');
      expect(debugVar).toEqual({
        name: 'DEBUG',
        default: '0',
        required: false,
        description: 'Debug mode flag'
      });
      
      const versionVar = targets[0].variables.find(v => v.name === 'VERSION');
      expect(versionVar).toEqual({
        name: 'VERSION',
        default: undefined,
        required: true,
        description: undefined
      });
    });

    it('should detect ifdef/ifndef variables', () => {
      const makefile = `
test:
ifdef VERBOSE
	pytest -v
else
	pytest
endif
`;
      const parser = new MakefileParser(makefile);
      const targets = parser.parseTargets();
      
      expect(targets[0].variables).toHaveLength(1);
      expect(targets[0].variables[0]).toEqual({
        name: 'VERBOSE',
        default: undefined,
        required: false,
        description: undefined
      });
    });

    it('should extract usage hints', () => {
      const makefile = `
# Deploy to production
# Usage: make deploy ENV=prod VERSION=1.0.0
deploy:
	./deploy.sh $(ENV) $(VERSION)
`;
      const parser = new MakefileParser(makefile);
      const targets = parser.parseTargets();
      
      expect(targets[0].usageHint).toBe('make deploy ENV=prod VERSION=1.0.0');
    });

    it('should handle multiple variable syntaxes', () => {
      const makefile = `
VAR1 = value1
VAR2 := value2
VAR3 ?= value3

build:
	@echo "\${VAR1} $(VAR2) $(VAR3)"
`;
      const parser = new MakefileParser(makefile);
      const targets = parser.parseTargets();
      
      expect(targets[0].variables).toHaveLength(3);
      targets[0].variables.forEach(v => {
        expect(v.required).toBe(false);
        expect(v.default).toMatch(/value\d/);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty makefiles', () => {
      const parser = new MakefileParser('');
      const targets = parser.parseTargets();
      expect(targets).toHaveLength(0);
    });

    it('should handle makefiles with only comments', () => {
      const makefile = `
# This is a comment
# Another comment
`;
      const parser = new MakefileParser(makefile);
      const targets = parser.parseTargets();
      expect(targets).toHaveLength(0);
    });

    it('should handle targets with no recipe', () => {
      const makefile = `
.PHONY: help
help:

build:
	@echo "Building"
`;
      const parser = new MakefileParser(makefile);
      const targets = parser.parseTargets();
      expect(targets).toHaveLength(2);
    });
  });
});