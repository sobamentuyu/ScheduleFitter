FROM node:26-alpine3.23

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5173

# ホスト側からのアクセスを許可するために --host フラグを指定
CMD ["npm", "run", "dev", "--", "--host"]
