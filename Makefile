DB_HOST := mysql
DB_PORT := 3306
DB_USER := ${DB_USER}
DB_PASS := ${DB_ROOT_PASSWORD}
DB_NAME := ${DB_NAME}
BACKUP_DIR := ./backups

hello:
	echo "hello julio"

install: 
	@copy .env.example .env
	@copy frontend\.env.example frontend\.env

start:
	@docker compose up -d --build

setup: 
	@make install
	@make start

stop:
	@docker compose down

stop-front:
	@docker compose down frontend

stop-backend:
	@docker compose down backend

stop-db:
	@docker compose down mysql

backend-logs:
	@docker logs backend
	
frontend-logs:
	@docker logs frontend

backup: create_dir dump compress

create_dir:
	@mkdir -p $(BACKUP_DIR)/$(shell date +%Y-%m-%d_%H-%M-%S)

dump:
	@mysqldump -h $(DB_HOST) -P $(DB_PORT) -u $(DB_USER) -p$(DB_PASS) $(DB_NAME) \
		> $(BACKUP_DIR)/$(shell date +%Y-%m-%d_%H-%M-%S)/$(DB_NAME).sql

compress:
	@cd $(BACKUP_DIR)/$(shell date +%Y-%m-%d_%H-%M-%S) && \
	gzip $(DB_NAME).sql


backend-eslint:
	cd backend && npm run lint

frontend-eslint:
	cd frontend && npm run lint