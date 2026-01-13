# MediaCMS Makefile
# Convenient targets for Docker Compose operations

# Color codes for output
GREEN := \033[0;32m
RED := \033[0;31m
YELLOW := \033[0;33m
NC := \033[0m # No Color

# Compose file paths
COMPOSE_FILE = docker-compose.yaml
COMPOSE_FILE_DEV = docker-compose-dev.yaml

# Default target
.DEFAULT_GOAL := help

.PHONY: help up up-attach down down-volumes start stop restart ps logs build build-no-cache pull
.PHONY: dev-up dev-up-attach dev-down dev-down-volumes dev-start dev-stop dev-restart dev-ps dev-logs dev-build dev-build-no-cache
.PHONY: build-all build-api build-worker build-nginx build-base
.PHONY: health health-dev health-api health-db health-redis
.PHONY: clean clean-all shell dev-shell admin-shell db-shell redis-cli
.PHONY: build-frontend backup-db backup-db-dev test

#########################
# Production Environment
#########################

up:
	@echo "$(GREEN)Starting production services...$(NC)"
	docker compose -f $(COMPOSE_FILE) up -d

up-attach:
	@echo "$(GREEN)Starting production services (attached)...$(NC)"
	docker compose -f $(COMPOSE_FILE) up

down:
	@echo "$(YELLOW)Stopping production services...$(NC)"
	docker compose -f $(COMPOSE_FILE) down

down-volumes:
	@echo "$(RED)Stopping production services and removing volumes...$(NC)"
	docker compose -f $(COMPOSE_FILE) down -v

start:
	@echo "$(GREEN)Starting existing production containers...$(NC)"
	docker compose -f $(COMPOSE_FILE) start

stop:
	@echo "$(YELLOW)Stopping production containers...$(NC)"
	docker compose -f $(COMPOSE_FILE) stop

restart:
	@echo "$(YELLOW)Restarting production containers...$(NC)"
	docker compose -f $(COMPOSE_FILE) restart

ps:
	@docker compose -f $(COMPOSE_FILE) ps

logs:
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		docker compose -f $(COMPOSE_FILE) logs -f; \
	else \
		docker compose -f $(COMPOSE_FILE) logs -f $(filter-out $@,$(MAKECMDGOALS)); \
	fi

build:
	@echo "$(GREEN)Building production images...$(NC)"
	docker compose -f $(COMPOSE_FILE) build

build-no-cache:
	@echo "$(GREEN)Building production images (no cache)...$(NC)"
	docker compose -f $(COMPOSE_FILE) build --no-cache

pull:
	@echo "$(GREEN)Pulling latest production images...$(NC)"
	docker compose -f $(COMPOSE_FILE) pull

#########################
# Development Environment
#########################

dev-up:
	@echo "$(GREEN)Starting development services...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) up -d

dev-up-attach:
	@echo "$(GREEN)Starting development services (attached)...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) up

dev-down:
	@echo "$(YELLOW)Stopping development services...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) down

dev-down-volumes:
	@echo "$(RED)Stopping development services and removing volumes...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) down -v

dev-start:
	@echo "$(GREEN)Starting existing development containers...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) start

dev-stop:
	@echo "$(YELLOW)Stopping development containers...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) stop

dev-restart:
	@echo "$(YELLOW)Restarting development containers...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) restart

dev-ps:
	@docker compose -f $(COMPOSE_FILE_DEV) ps

dev-logs:
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		docker compose -f $(COMPOSE_FILE_DEV) logs -f; \
	else \
		docker compose -f $(COMPOSE_FILE_DEV) logs -f $(filter-out $@,$(MAKECMDGOALS)); \
	fi

dev-build:
	@echo "$(GREEN)Building development images...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) build

dev-build-no-cache:
	@echo "$(GREEN)Building development images (no cache)...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) build --no-cache

#########################
# Build Targets
#########################

build-all: build dev-build
	@echo "$(GREEN)All images built successfully!$(NC)"

build-api:
	@echo "$(GREEN)Building API image...$(NC)"
	docker compose -f $(COMPOSE_FILE) build api

build-worker:
	@echo "$(GREEN)Building worker image...$(NC)"
	docker compose -f $(COMPOSE_FILE) build celery_beat celery_short celery_long

build-nginx:
	@echo "$(GREEN)Building nginx image...$(NC)"
	docker compose -f $(COMPOSE_FILE) build nginx

build-base:
	@echo "$(GREEN)Building base image...$(NC)"
	docker compose -f $(COMPOSE_FILE) build migrations

#########################
# Health Checks
#########################

health:
	@echo "$(GREEN)=== Production Service Health Check ===$(NC)"
	@echo ""
	@docker compose -f $(COMPOSE_FILE) ps --format "table {{.Service}}\t{{.Status}}\t{{.Health}}"
	@echo ""
	@echo "$(GREEN)Checking individual services...$(NC)"
	@echo ""
	@$(MAKE) health-api || true
	@$(MAKE) health-db || true
	@$(MAKE) health-redis || true

health-dev:
	@echo "$(GREEN)=== Development Service Health Check ===$(NC)"
	@echo ""
	@docker compose -f $(COMPOSE_FILE_DEV) ps --format "table {{.Service}}\t{{.Status}}\t{{.Health}}"
	@echo ""
	@echo "$(GREEN)Checking individual services...$(NC)"
	@echo ""
	@if docker compose -f $(COMPOSE_FILE_DEV) ps -q api > /dev/null 2>&1; then \
		echo -n "$(GREEN)API: $(NC)"; \
		if docker compose -f $(COMPOSE_FILE_DEV) exec -T api wget --spider --quiet http://127.0.0.1:8000/health 2>/dev/null; then \
			echo "$(GREEN)✓ Healthy$(NC)"; \
		else \
			echo "$(RED)✗ Unhealthy$(NC)"; \
		fi; \
	fi
	@if docker compose -f $(COMPOSE_FILE_DEV) ps -q db > /dev/null 2>&1; then \
		echo -n "$(GREEN)Database: $(NC)"; \
		if docker compose -f $(COMPOSE_FILE_DEV) exec -T db pg_isready -U mediacms -d mediacms > /dev/null 2>&1; then \
			echo "$(GREEN)✓ Healthy$(NC)"; \
		else \
			echo "$(RED)✗ Unhealthy$(NC)"; \
		fi; \
	fi
	@if docker compose -f $(COMPOSE_FILE_DEV) ps -q redis > /dev/null 2>&1; then \
		echo -n "$(GREEN)Redis: $(NC)"; \
		if docker compose -f $(COMPOSE_FILE_DEV) exec -T redis redis-cli ping > /dev/null 2>&1; then \
			echo "$(GREEN)✓ Healthy$(NC)"; \
		else \
			echo "$(RED)✗ Unhealthy$(NC)"; \
		fi; \
	fi

health-api:
	@if docker compose -f $(COMPOSE_FILE) ps -q api > /dev/null 2>&1; then \
		echo -n "$(GREEN)API Health: $(NC)"; \
		if docker compose -f $(COMPOSE_FILE) exec -T api wget --spider --quiet http://127.0.0.1:8000/health 2>/dev/null; then \
			echo "$(GREEN)✓ Healthy$(NC)"; \
		else \
			echo "$(RED)✗ Unhealthy$(NC)"; \
			exit 1; \
		fi; \
	else \
		echo "$(RED)API container not running$(NC)"; \
		exit 1; \
	fi

health-db:
	@if docker compose -f $(COMPOSE_FILE) ps -q db > /dev/null 2>&1; then \
		echo -n "$(GREEN)Database Health: $(NC)"; \
		if docker compose -f $(COMPOSE_FILE) exec -T db pg_isready -U mediacms -d mediacms > /dev/null 2>&1; then \
			echo "$(GREEN)✓ Healthy$(NC)"; \
		else \
			echo "$(RED)✗ Unhealthy$(NC)"; \
			exit 1; \
		fi; \
	else \
		echo "$(RED)Database container not running$(NC)"; \
		exit 1; \
	fi

health-redis:
	@if docker compose -f $(COMPOSE_FILE) ps -q redis > /dev/null 2>&1; then \
		echo -n "$(GREEN)Redis Health: $(NC)"; \
		if docker compose -f $(COMPOSE_FILE) exec -T redis redis-cli ping > /dev/null 2>&1; then \
			echo "$(GREEN)✓ Healthy$(NC)"; \
		else \
			echo "$(RED)✗ Unhealthy$(NC)"; \
			exit 1; \
		fi; \
	else \
		echo "$(RED)Redis container not running$(NC)"; \
		exit 1; \
	fi

#########################
# Utility Targets
#########################

clean:
	@echo "$(YELLOW)Cleaning up stopped containers, unused networks, and dangling images...$(NC)"
	docker system prune -f

clean-all:
	@echo "$(RED)WARNING: This will remove ALL containers, networks, and volumes!$(NC)"
	@echo -n "Are you sure? [y/N] "; \
	read REPLY; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		docker compose -f $(COMPOSE_FILE) down -v --remove-orphans; \
		docker compose -f $(COMPOSE_FILE_DEV) down -v --remove-orphans; \
		docker system prune -af --volumes; \
		echo "$(GREEN)Cleanup complete!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled.$(NC)"; \
	fi

shell:
	@container_id=$$(docker compose -f $(COMPOSE_FILE) ps -q api); \
	if [ -z "$$container_id" ]; then \
		echo "$(RED)API container not found$(NC)"; \
		exit 1; \
	else \
		docker exec -it $$container_id /bin/sh; \
	fi

dev-shell:
	@container_id=$$(docker compose -f $(COMPOSE_FILE_DEV) ps -q api); \
	if [ -z "$$container_id" ]; then \
		echo "$(RED)API container not found$(NC)"; \
		exit 1; \
	else \
		docker exec -it $$container_id /bin/sh; \
	fi

admin-shell: shell
	@# Alias for shell (production API container)

db-shell:
	@container_id=$$(docker compose -f $(COMPOSE_FILE) ps -q db); \
	if [ -z "$$container_id" ]; then \
		echo "$(RED)Database container not found$(NC)"; \
		exit 1; \
	else \
		docker exec -it $$container_id psql -U mediacms -d mediacms; \
	fi

redis-cli:
	@container_id=$$(docker compose -f $(COMPOSE_FILE) ps -q redis); \
	if [ -z "$$container_id" ]; then \
		echo "$(RED)Redis container not found$(NC)"; \
		exit 1; \
	else \
		docker exec -it $$container_id redis-cli; \
	fi

#########################
# Existing Targets (Updated)
#########################

build-frontend:
	@echo "$(GREEN)Building frontend...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) exec frontend npm run dist
	cp -r frontend/dist/static/* static/
	docker compose -f $(COMPOSE_FILE_DEV) restart api

backup-db:
	@echo "$(GREEN)Creating production database backup...$(NC)"
	@docker compose -f $(COMPOSE_FILE) exec -T db pg_dump -U mediacms mediacms > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Database backup created: backup_$$(date +%Y%m%d_%H%M%S).sql$(NC)"

backup-db-dev:
	@echo "$(GREEN)Creating development database backup...$(NC)"
	@docker compose -f $(COMPOSE_FILE_DEV) exec -T db pg_dump -U mediacms mediacms > backup_dev_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Database backup created: backup_dev_$$(date +%Y%m%d_%H%M%S).sql$(NC)"

test:
	@echo "$(GREEN)Running tests...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) exec --env TESTING=True -T api pytest

#########################
# Help Target
#########################

help:
	@echo "$(GREEN)MediaCMS Makefile Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Production Commands:$(NC)"
	@echo "  make up              - Start production services (detached)"
	@echo "  make up-attach       - Start production services (attached, shows logs)"
	@echo "  make down            - Stop and remove production containers"
	@echo "  make down-volumes    - Stop and remove production containers and volumes"
	@echo "  make start           - Start existing production containers"
	@echo "  make stop            - Stop production containers"
	@echo "  make restart         - Restart production containers"
	@echo "  make ps               - Show production service status"
	@echo "  make logs [service]   - Show production logs (optionally for specific service)"
	@echo "  make build            - Build all production images"
	@echo "  make build-no-cache   - Build all production images (no cache)"
	@echo "  make pull             - Pull latest production images"
	@echo ""
	@echo "$(YELLOW)Development Commands:$(NC)"
	@echo "  make dev-up           - Start development services (detached)"
	@echo "  make dev-up-attach    - Start development services (attached, shows logs)"
	@echo "  make dev-down         - Stop and remove development containers"
	@echo "  make dev-down-volumes - Stop and remove development containers and volumes"
	@echo "  make dev-start        - Start existing development containers"
	@echo "  make dev-stop         - Stop development containers"
	@echo "  make dev-restart      - Restart development containers"
	@echo "  make dev-ps           - Show development service status"
	@echo "  make dev-logs [service] - Show development logs (optionally for specific service)"
	@echo "  make dev-build        - Build all development images"
	@echo "  make dev-build-no-cache - Build all development images (no cache)"
	@echo ""
	@echo "$(YELLOW)Build Commands:$(NC)"
	@echo "  make build-all        - Build all images (production and dev)"
	@echo "  make build-api        - Build only the API image (production)"
	@echo "  make build-worker     - Build worker images (production)"
	@echo "  make build-nginx      - Build nginx image (production)"
	@echo "  make build-base       - Build base image (production)"
	@echo ""
	@echo "$(YELLOW)Health Checks:$(NC)"
	@echo "  make health           - Check health of all production services"
	@echo "  make health-dev       - Check health of all development services"
	@echo "  make health-api       - Check API service health (production)"
	@echo "  make health-db        - Check database health (production)"
	@echo "  make health-redis     - Check Redis health (production)"
	@echo ""
	@echo "$(YELLOW)Utility Commands:$(NC)"
	@echo "  make clean            - Remove stopped containers, unused networks, dangling images"
	@echo "  make clean-all        - Remove ALL containers, networks, and volumes (WARNING: destructive)"
	@echo "  make shell             - Open shell in production API container"
	@echo "  make dev-shell         - Open shell in development API container"
	@echo "  make admin-shell       - Alias for shell (production API container)"
	@echo "  make db-shell          - Open PostgreSQL shell in database container"
	@echo "  make redis-cli         - Open Redis CLI in Redis container"
	@echo "  make build-frontend    - Build frontend and copy static files"
	@echo "  make backup-db         - Create production database backup"
	@echo "  make backup-db-dev     - Create development database backup"
	@echo "  make test              - Run tests in development environment"
	@echo ""
	@echo "$(GREEN)Examples:$(NC)"
	@echo "  make up                # Start production"
	@echo "  make dev-up            # Start development"
	@echo "  make health            # Check production health"
	@echo "  make logs api          # Show API logs"
	@echo "  make shell             # Open production API shell"

# Allow passing arguments to targets that accept them
%:
	@:
