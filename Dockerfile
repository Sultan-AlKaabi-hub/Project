# Full server version of Rasid. Build: docker build -t rasid .   Run: docker run -p 3000:3000 -v rasid-data:/app/data -e ANTHROPIC_API_KEY=... rasid
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .
RUN node scripts/build-static.js
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server/index.js"]
