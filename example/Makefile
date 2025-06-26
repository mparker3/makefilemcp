# Example Makefile for testing makefilemcpserver

# Display help information
help:
	@echo "Available targets:"
	@echo "  hello    - Print a greeting"
	@echo "  time     - Show current time"
	@echo "  clean    - Clean temporary files"
	@echo "  build    - Build the project"
	@echo "  test     - Run tests"
	@echo "  all      - Build and test"

# Print a greeting
hello:
	@echo "Hello from Make!"

# Show current time
time:
	@date

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	@rm -f *.tmp *.log

# Build the project
build:
	@echo "Building project..."
	@echo "Build complete!" > build.log

# Run tests
test: build
	@echo "Running tests..."
	@echo "All tests passed!"

# Build and test everything
all: clean build test
	@echo "All tasks completed!"

# Example with variables
greet:
	@echo "Hello, $(NAME)!"

.PHONY: help hello time clean build test all greet