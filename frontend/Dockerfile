# ── Stage 1: build frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build


# ── Stage 2: serve static build with nginx ─────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Copy Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]



### docker build -t bcmpilotlight.azurecr.io/bcm-ghcp-frontend:latest .; docker push bcmpilotlight.azurecr.io/bcm-ghcp-frontend:latest