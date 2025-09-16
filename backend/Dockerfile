FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /app/public
EXPOSE 3000
CMD ["sh", "-c", "node init_admin.js && node app.js"]
