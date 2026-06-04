# ── Stage 1: build / install dependencies ─────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

ENV UV_LINK_MODE=copy

# Install build tools needed for any compiled wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/

# Copy only the dependency manifest first so this layer is cached
COPY pyproject.toml uv.lock .

# Create project virtual environment and install runtime dependencies
RUN uv sync --no-dev --no-install-project --frozen


# ── Stage 2: runtime image ─────────────────────────────────────────────────────
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH" \
    HOME="/home/appuser"

WORKDIR /app

# Create a non-root user
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup --home /home/appuser appuser \
    && mkdir -p /home/appuser \
    && chown -R appuser:appgroup /home/appuser /app

# Copy installed virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application source and set ownership
COPY --chown=appuser:appgroup app/ ./app/

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


# docker build -t bcmpilotlight.azurecr.io/bcm-ghcp-backend:latest .; docker push bcmpilotlight.azurecr.io/bcm-ghcp-backend:latest
# docker build -t bcm-ghcp-backend .; docker run -p 8080:8000 bcm-ghcp-backend