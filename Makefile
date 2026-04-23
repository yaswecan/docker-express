install:
	echo "Hello ci"

start: 
	docker compose up -d --build
	