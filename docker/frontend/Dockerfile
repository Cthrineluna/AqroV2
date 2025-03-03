# docker/frontend/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install -g expo-cli
RUN npm install

COPY . .

EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

CMD ["expo", "start", "--no-dev", "--minify"]