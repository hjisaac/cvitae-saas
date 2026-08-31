.PHONY: dev-frontend dev-backend setup-backend setup-env update-engine install

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

# Create .env.local with AUTH_SECRET (skipped if file already exists)
setup-env:
	bash scripts/setup-local-env.sh

# Run the FastAPI backend (loads AUTH_SECRET from repo-root .env.local via python-dotenv)
dev-backend:
	cd backend && uv sync && uv run uvicorn app:app --reload --port 8000

# Create tables and seed local fixture data (run once when setting up your env)
setup-backend:
	cd backend && uv run python -m db.setup

# Update the core-engine submodule to the latest main
update-engine:
	git submodule update --remote
