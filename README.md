# CVitae SaaS

This repository contains the Next.js frontend and FastAPI backend wrapper for the CVitae service. 
The core CV generation logic is maintained in a Git Submodule pointing to the `cvitae` repository.

## Everyday Commands

### 1. Updating the Core Engine
If you've made changes to the main `cvitae` repository and want to pull those updates into this SaaS app, run:
```bash
git submodule update --remote
```

### 2. Running the Next.js Frontend
```bash
# Install dependencies (only needed once or when package.json changes)
pnpm install

# Start the development server
pnpm run dev
```
The frontend will be available at [http://localhost:3000](http://localhost:3000).

### 3. Running the Backend API
The backend wrapper uses FastAPI to expose the CV engine.
```bash
cd backend

# Start the API server
uv run uvicorn server:app --reload --port 8000
```
The API will be available at [http://localhost:8000](http://localhost:8000).
