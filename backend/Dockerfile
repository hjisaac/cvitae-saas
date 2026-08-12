FROM python:3.11-slim

# Install LaTeX compiler (texlive-latex-base) and requirements
RUN apt-get update && apt-get install -y \
    texlive-latex-base texlive-fonts-recommended texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv (fast python package installer)
RUN pip install uv

# Copy python project configuration
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
RUN uv sync --frozen

# Copy the rest of the application
COPY . .

# Run uvicorn server
CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
