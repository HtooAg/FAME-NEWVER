# Use Node.js 18 as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy local code to container
COPY . .

# Set build-time variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV DISABLE_ERR_OVERLAY=true
ENV NEXT_DISABLE_TYPE_CHECKS=true
ENV NEXT_DISABLE_ESLINT=true

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM node:18-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
