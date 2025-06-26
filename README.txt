## makefilemcpserver

An MCP (Model Context Protocol) server that exposes Makefile targets as callable tools for AI assistants like Claude.

⚠️ **ALPHA SOFTWARE - LOCAL USE ONLY** ⚠️  
This server executes Make commands with user-provided arguments. Only use in trusted environments.

### Features

- **Dynamic Discovery**: Automatically parses your Makefile and exposes each target as a tool
- **Target Descriptions**: Extracts descriptions from comments preceding Make targets  
- **Flexible Arguments**: Pass additional arguments to any Make command
- **Cross-Platform**: Works on macOS, Linux, and Windows (with make installed)

### Installation

#### Prerequisites
- Node.js 16 or higher
- `make` command available in PATH
- A Makefile in your project directory

#### Quick Start

1. Clone this repository:
```bash
git clone https://github.com/yourusername/makefilemcpserver.git
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

### Usage

#### With Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

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

#### Example Makefile

```makefile
## Build the project
build:
	npm run build

## Run tests
test:
	npm test

## Deploy to production
deploy: build test
	./deploy.sh
```

This will expose tools: `make_build`, `make_test`, and `make_deploy` to Claude.

### How It Works

1. The server reads your Makefile at startup
2. Each Make target becomes a tool with the name `make_<target>`
3. Comments directly above targets become tool descriptions
4. Pattern rules (%) and variable assignments are ignored
5. Claude can then run any target with optional arguments

### Security Considerations

⚠️ **WARNING**: This server executes shell commands via Make. It currently has minimal input validation.

- Only use in local, trusted environments
- Do not expose to untrusted users or networks
- Be cautious with Makefiles that accept user input
- Consider the security implications of your Make targets

### Development

```bash
## Install dependencies
npm install

## Build once
npm run build

## Build and watch for changes
npm run watch

## Run the MCP Inspector for debugging
npm run inspector
```

### Debugging

Since MCP servers communicate over stdio, use the MCP Inspector:

```bash
npm run inspector
```

Then open the provided URL to access debugging tools.

### Contributing

This is alpha software. Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### License

MIT - See LICENSE file for details

### Roadmap

- [ ] Add input sanitization for shell arguments
- [ ] Support for multiple Makefiles
- [ ] Configuration for timeout values
- [ ] Filtering/whitelisting of Make targets
- [ ] Better error messages and logging
- [ ] Tests and CI/CD pipeline