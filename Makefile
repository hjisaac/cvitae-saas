.PHONY: dev-frontend dev-backend update-engine install

# Install frontend dependencies
install:
	pnpm install

# Run the Next.js frontend
dev-frontend:
	pnpm run dev

# Run the FastAPI backend
dev-backend:
	cd backend && uv run uvicorn server:app --reload --port 8000

# Update the core-engine submodule to the latest main
update-engine:
	git submodule update --remote
