.PHONY: dev-frontend dev-backend update-engine install

# Path to the compatible node binary (v22 from nvm)
NODE := $(HOME)/.nvm/versions/node/v22.19.0/bin/node
PNPM := $(NODE) /usr/local/lib/node_modules/pnpm/bin/pnpm.cjs
NEXT := $(NODE) node_modules/next/dist/bin/next

# Install frontend dependencies
install:
	$(PNPM) install --strict-peer-dependencies=false

# Run the Next.js frontend
dev-frontend:
	$(NEXT) dev

# Build for production
build:
	$(NEXT) build

# Run the FastAPI backend
dev-backend:
	cd backend && uv run uvicorn server:app --reload --port 8000

# Update the core-engine submodule to the latest main
update-engine:
	git submodule update --remote
