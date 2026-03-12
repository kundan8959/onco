FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["sh", "-c", "rm -rf dist && node -r ts-node/register -r tsconfig-paths/register src/main.ts"]
