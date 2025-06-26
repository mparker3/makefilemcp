# makefilemcpserver

An MCP (Model Context Protocol) server that exposes Makefile targets as callable tools for AI assistants like Claude, Cursor, etc. 

⚠️ **ALPHA SOFTWARE - LOCAL USE ONLY** ⚠️  
This server executes Make commands with user-provided arguments. Only use in trusted environments. It intelligently parses out commands and args. 
This almost certainly won't work flawlessly for your Makefile. In fact, it might not even work at all. 

## Installation

### Prerequisites
- Node.js 16 or higher
- `make` command available in PATH
- A Makefile in your project directory

### Quick Start

1. Clone this repository:
```bash
git clone https://github.com/mparker3/makefilemcpserver.git
cd makefilemcpserver
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

## Usage

Add to your MCP server configuration:

```json
{
  "mcpServers": {
    "makefilemcpserver": {
      "command": "node",
      "args": [
        "/absolute/path/to/makefilemcpserver/build/index.js",
        "/path/to/your/project"
      ]
    }
  }
}
```

The second argument (optional) specifies the directory containing your Makefile. If omitted, uses the current directory.

### Example Makefile

```makefile
# Build the project
build:
	npm run build

# Run tests
test:
	npm test

# Deploy to production
deploy: build test
	./deploy.sh
```

This will expose tools: `make_build`, `make_test`, and `make_deploy` to Claude.

## How It Works

1. The server reads your Makefile at startup
2. Each Make target becomes a tool with the name `make_<target>`
3. Comments directly above targets become tool descriptions
4. MCP clients can then run any target with optional arguments. We do some best-effort parsing of args from docs + commands, a better approach would just be to offload it to yet another LLM call(s) at startup. 

## Security Considerations

⚠️ **WARNING**: This server executes shell commands via Make. It currently has minimal input validation.

- Anything you expose in your Makefile, any MCP client will have access to. Highly recommend running _locally only_. 
- The server does some de rigeur input sanitization, but no guarantees that an enterprising security researcher can't figure out a way around it. 

## Development

```bash
# Install dependencies
npm install

# Build once
npm run build

# Build and watch for changes
npm run watch

# Run the MCP Inspector for debugging
npm run inspector
```

## Debugging

Since MCP servers communicate over stdio, use the MCP Inspector:

```bash
npm run inspector
```

Then open the provided URL to access debugging tools.

## Contributing

This is alpha software. Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT - See LICENSE file for details

## Roadmap

- [ ] Support for multiple Makefiles
- [ ] Configuration for timeout values
- [ ] Better error messages and logging
- [ ] Tests and CI/CD pipeline
