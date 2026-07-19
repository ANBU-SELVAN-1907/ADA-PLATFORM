# Stage 1: Build the React Application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy the rest of the application
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.27-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Write a proper nginx config with extended timeouts for SSE streaming
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    client_max_body_size 10M;\n\
\n\
    # Serve static frontend files\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
        expires 1d;\n\
        add_header Cache-Control "public, must-revalidate";\n\
    }\n\
\n\
    # Proxy API requests to the backend container (sidecar on same task)\n\
    location /api/ {\n\
        proxy_pass http://127.0.0.1:8000/api/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_set_header Connection "";\n\
        # Extended timeouts for long-running LLM discovery (up to 10 minutes)\n\
        proxy_connect_timeout 30s;\n\
        proxy_read_timeout 600s;\n\
        proxy_send_timeout 600s;\n\
        # Required for SSE streaming responses\n\
        proxy_buffering off;\n\
        proxy_cache off;\n\
        chunked_transfer_encoding on;\n\
    }\n\
\n\
    # Proxy report download requests to the backend\n\
    location /output/ {\n\
        proxy_pass http://127.0.0.1:8000/output/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_read_timeout 60s;\n\
    }\n\
\n\
    # Health check endpoint for ALB target group\n\
    location /health {\n\
        return 200 "ok";\n\
        add_header Content-Type text/plain;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
