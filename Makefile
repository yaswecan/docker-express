SHELL := bash

hello:
	@echo "hello world"

install:
	@echo "Installing package..."
	@copy .env.example .env
	@copy .\frontend\.env.example .\frontend\.env
	@echo All done !

start: 
	@echo Build App...
	@docker compose up -d --build
	@echo All done !

setup:
	@make install
	@make start

stop:
	@docker compose down $(or ${word 2,$(MAKECMDGOALS)}, -v)

logs:
	@docker compose logs $(word 2,$(MAKECMDGOALS))

exec:
	@docker compose exec -it $(word 2,$(MAKECMDGOALS)) $(word 3,$(MAKECMDGOALS))

lint-%:
	@docker compose exec $* npm run lint

test:
	@docker compose exec backend npm run lint && docker compose exec frontend npm run lint