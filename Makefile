info:
	@echo "See README!"
temporal:
	@docker-compose up
worker:
	@cd simple-flow/worker && go run main.go
boltjs:
	@cd slackbot && npm run demo
