# Variables that get referenced
VERSION := v1.2.3
BUILD_DIR := build
DOCKER_TAG := myapp:$(VERSION)
PLATFORMS := linux/amd64,linux/arm64
TIMESTAMP := $(shell date +%Y%m%d-%H%M%S)

# Conditional variables based on environment
ifeq ($(ENV),prod)
    CONFIG_FILE := config/production.yaml
    REPLICAS := 3
else
    CONFIG_FILE := config/development.yaml
    REPLICAS := 1
endif

# Basic file operations - no external deps
clean:
	rm -rf $(BUILD_DIR)
	mkdir -p $(BUILD_DIR)

# Pattern rule with automatic variables
%.txt: %.md
	sed 's/^#/##/' $< > $@

# Target with variable substitution
version:
	echo "Version: $(VERSION)" > $(BUILD_DIR)/version.txt
	echo "Config: $(CONFIG_FILE)" >> $(BUILD_DIR)/version.txt
	echo "Built: $(TIMESTAMP)" >> $(BUILD_DIR)/version.txt

# Multiple targets, dependencies
docs: clean version README.txt CHANGELOG.txt
	echo "Documentation built in $(BUILD_DIR)"

# Conditional execution within target
deploy: docs
	@if [ "$(ENV)" = "prod" ]; then \
		echo "Deploying $(REPLICAS) replicas to production"; \
	else \
		echo "Deploying $(REPLICAS) replica to development"; \
	fi
	echo "Usin
