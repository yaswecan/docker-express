install:
	copy frontend\.env.example .env
	copy .env.example .env

start: 
	docker compose up -d --build
	