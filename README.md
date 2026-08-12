# CVitae SaaS

This repository contains the Next.js frontend and FastAPI backend wrapper for the CVitae service. 
The core CV generation logic is maintained in a Git Submodule pointing to the `cvitae` repository.

## Everyday Commands

### 1. Updating the Core Engine
If you've made changes to the main `cvitae` repository and want to pull those updates into this SaaS app, run:
```bash
make update-engine
```

### 2. Running the Next.js Frontend
```bash
# Install dependencies (only needed once or when package.json changes)
make install

# Start the development server
make dev-frontend
```
The frontend will be available at [http://localhost:3000](http://localhost:3000).

### 3. Running the Backend API
The backend wrapper uses FastAPI to expose the CV engine.
```bash
# Start the API server
make dev-backend
```
The API will be available at [http://localhost:8000](http://localhost:8000).

### 4. Google sign-in (OAuth)

Local env is pre-configured in `.env.local` (gitignored). `AUTH_SECRET` is already set; the backend reads the same file automatically.

**When you're ready for Google login**, add only these two lines to `.env.local`:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Then restart `make dev-frontend` and `make dev-backend`.

Google Cloud Console setup:

1. [Credentials](https://console.cloud.google.com/apis/credentials) → **OAuth 2.0 Client ID** → **Web application**
2. **Authorized JavaScript origins:** `http://localhost:3000`
3. **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`

First-time setup (if `.env.local` is missing):

```bash
make setup-env    # generates .env.local + AUTH_SECRET
make setup-backend
make dev-backend
make dev-frontend
```

Until Google credentials are added, the sign-in dialog shows setup instructions and disables the Google button.
