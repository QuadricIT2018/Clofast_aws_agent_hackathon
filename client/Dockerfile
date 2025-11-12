# Stage 1: Build frontend
FROM node:18-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package.json + package-lock.json and install deps
COPY package.json package-lock.json* ./
RUN npm install

# Copy rest of the code
COPY . .

# Build project (TypeScript + Vite)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.23-alpine
WORKDIR /usr/share/nginx/html

# Clear default Nginx files
RUN rm -rf *

# Copy build output
COPY --from=build /app/dist .

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
