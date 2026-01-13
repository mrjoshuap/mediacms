.PHONY: admin-shell build-frontend backup-db test

admin-shell:
	@container_id=$$(docker compose ps -q api); \
	if [ -z "$$container_id" ]; then \
		echo "API container not found"; \
		exit 1; \
	else \
		docker exec -it $$container_id /bin/sh; \
	fi

build-frontend:
	docker compose -f docker-compose-dev.yaml exec frontend npm run dist
	cp -r frontend/dist/static/* static/
	docker compose -f docker-compose-dev.yaml restart api

backup-db:
	@echo "Creating database backup..."
	@docker compose exec -T db pg_dump -U mediacms mediacms > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Database backup created: backup_$$(date +%Y%m%d_%H%M%S).sql"

test:
	docker compose -f docker-compose-dev.yaml exec --env TESTING=True -T api pytest

