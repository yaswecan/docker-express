# Hello commande
hello:
	@echo "Hello, Yacine"

# Install
install:
	@echo "copy .env"
	@copy .env.example .env
	@copy frontend\.env.example frontend\.env

start:
	@echo "Starting the application..."
	@docker compose up -d --build

start-all: install start

start-service:
	@echo "Starting service: $(word 2,$(MAKECMDGOALS))"
	@docker compose up -d $(word 2,$(MAKECMDGOALS))

# Stop specific container (variable usage)
stop-container:
	@echo "Stopping container: $(word 2,$(MAKECMDGOALS))"
	@docker compose stop $(word 2,$(MAKECMDGOALS))

log-container:
	@echo "log container: $(word 2,$(MAKECMDGOALS))"
	@docker compose logs -d $(word 2,$(MAKECMDGOALS))

exec-container:
	@echo "exec container: $(word 2,$(MAKECMDGOALS))"
	@docker compose exec $(word 2,$(MAKECMDGOALS)) $(word 3,$(MAKECMDGOALS))

exec-it-container:
	@echo "exec container interactive: $(SERVICE)"
	@docker compose exec -it $(word 2,$(MAKECMDGOALS)) sh

lint-%:
	@echo "exec lint container: $*"
	@docker compose exec -T $* npm run lint