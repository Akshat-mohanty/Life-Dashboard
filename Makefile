.PHONY: help setup local-up local-down local-init seed build local-api frontend-dev deploy test clean

SHELL := /bin/bash
AWS_REGION ?= us-east-1
LOCALSTACK_ENDPOINT ?= http://localhost:4566
TABLE_NAME ?= LifeDashboard
BUCKET_NAME ?= life-dashboard-storage-local

help:
	@echo "Life Dashboard Developer Commands:"
	@echo "  make setup         - Install backend and frontend dependencies"
	@echo "  make local-up      - Start LocalStack container (DynamoDB, S3, SNS, SES, etc.)"
	@echo "  make local-down    - Stop LocalStack container"
	@echo "  make local-init    - Provision local DynamoDB table and S3 bucket in LocalStack"
	@echo "  make seed          - Seed mock data into DynamoDB"
	@echo "  make build         - Run AWS SAM build for backend"
	@echo "  make local-api     - Run SAM local API Gateway connected to LocalStack"
	@echo "  make frontend-dev  - Start Vite frontend dev server"
	@echo "  make deploy        - Deploy backend using SAM to AWS"
	@echo "  make test          - Run backend unit/integration tests"
	@echo "  make clean         - Remove build artifacts and caches"

setup:
	@echo "Installing backend dependencies..."
	npm --prefix backend install
	@echo "Installing frontend dependencies (if package.json exists)..."
	@if [ -f frontend/package.json ]; then npm --prefix frontend install; fi
	@echo "Setup complete."

local-up:
	docker compose up -d
	@echo "Waiting for LocalStack to be ready..."
	@until curl -s $(LOCALSTACK_ENDPOINT)/_localstack/health | grep -q "\"dynamodb\": \"running\""; do sleep 1; done
	@echo "LocalStack is online."

local-down:
	docker compose down

local-init:
	@echo "Creating local DynamoDB table: $(TABLE_NAME)..."
	aws --endpoint-url=$(LOCALSTACK_ENDPOINT) --region $(AWS_REGION) dynamodb create-table \
		--table-name $(TABLE_NAME) \
		--attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
		--key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
		--billing-mode PAY_PER_REQUEST || true
	@echo "Creating local S3 bucket: $(BUCKET_NAME)..."
	aws --endpoint-url=$(LOCALSTACK_ENDPOINT) --region $(AWS_REGION) s3 mb s3://$(BUCKET_NAME) || true
	@echo "Local resources initialized."

seed:
	@echo "Seeding DynamoDB table..."
	DYNAMODB_ENDPOINT=$(LOCALSTACK_ENDPOINT) AWS_REGION=$(AWS_REGION) TABLE_NAME=$(TABLE_NAME) node backend/scripts/seed.js

build:
	cd backend && sam build

local-api:
	cd backend && sam local start-api \
		--docker-network life-dashboard-net \
		--parameter-overrides Environment=dev \
		--port 3001

frontend-dev:
	npm --prefix frontend run dev

deploy:
	cd backend && sam build && sam deploy --guided

test:
	npm --prefix backend test

clean:
	rm -rf backend/.aws-sam
	rm -rf frontend/dist
