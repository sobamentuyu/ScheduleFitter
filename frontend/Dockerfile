FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# ホスト側からのアクセスを許可するために --host フラグを指定
CMD ["npm", "run", "dev", "--", "--host"]