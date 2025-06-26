# Advanced Makefile example showcasing variable detection

# Environment configuration
ENV ?= development
PORT ?= 3000

# Version info
VERSION := 1.0.0

# Deploy to a specific environment  
# Usage: make deploy ENV=production VERSION=2.0.0
deploy:
	@echo "Deploying version $(VERSION) to $(ENV)"
	@echo "Using port $(PORT)"
ifdef DRY_RUN
	@echo "DRY RUN - no actual deployment"
else
	./deploy.sh --env $(ENV) --version $(VERSION)
endif

# Build with optional debug mode
build:
	@echo "Building project..."
ifdef DEBUG
	@echo "Debug mode enabled"
	gcc -g -DDEBUG main.c
else
	gcc -O2 main.c
endif

# Database operations
# Usage: make db-migrate MIGRATION_NAME=add_users_table
db-migrate:
	@echo "Running migration: $(MIGRATION_NAME)"
ifndef MIGRATION_NAME
	@echo "ERROR: MIGRATION_NAME is required"
	@exit 1
endif
	./migrate.sh $(MIGRATION_NAME)

.PHONY: deploy build db-migrate