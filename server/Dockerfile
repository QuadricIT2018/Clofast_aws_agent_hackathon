# Stage 1: Build backend
FROM node:18-alpine AS build
WORKDIR /app

# Copy package.json + package-lock.json and install deps
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine
WORKDIR /app

# Copy compiled JS from build stage
COPY --from=build /app/dist ./dist

# Copy package.json and install only production dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Expose backend port
EXPOSE 5550

# Start backend
CMD ["node", "dist/index.js"] 

# adjust if your entry point is different
