.PHONY: admin-shell build-frontend test test-coverage test-frontend test-frontend-coverage docs-up docs-down docs-build docs-logs

COMPOSE_DEV := docker compose -f docker-compose-dev.yaml

admin-shell:
	@container_id=$$($(COMPOSE_DEV) ps -q web); \
	if [ -z "$$container_id" ]; then \
		echo "Web container not found. Is docker-compose-dev.yaml up?"; \
		exit 1; \
	else \
		docker exec -it $$container_id /bin/bash; \
	fi

build-frontend:
	$(COMPOSE_DEV) exec frontend npm run dist
	cp -r frontend/dist/static/* static/
	$(COMPOSE_DEV) restart web

test:
	$(COMPOSE_DEV) exec --env TESTING=True -T web pytest -n auto

test-coverage:
	$(COMPOSE_DEV) exec --env TESTING=True -T web pytest -n auto --cov --cov-report=term --cov-report=html

test-frontend:
	$(COMPOSE_DEV) exec -T frontend npm run test -- --ci

test-frontend-coverage:
	$(COMPOSE_DEV) exec -T frontend npm run test-coverage -- --ci --coverageReporters=text-summary --coverageReporters=html

# MkDocs → site/, served by Django at http://localhost/documentation/
docs-up:
	$(COMPOSE_DEV) --profile docs up -d docs
	@echo "Documentation watcher started. Open http://localhost/documentation/"

docs-down:
	$(COMPOSE_DEV) --profile docs stop docs

docs-build:
	$(COMPOSE_DEV) --profile docs run --rm --no-deps docs bash -lc 'pip install -q -r requirements-docs.txt && python scripts/docs_dev_watch.py --once'
	@echo "Built site/. Open http://localhost/documentation/ (web container must be running)."

docs-logs:
	$(COMPOSE_DEV) --profile docs logs -f docs
