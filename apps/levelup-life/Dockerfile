FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --include=optional

COPY . .

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]