FROM node:18-alpine

WORKDIR /app

# Copy package.json và pnpm-lock.yaml trước để cache cài đặt
COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install

# Copy toàn bộ mã nguồn vào container
COPY . .

EXPOSE 3000

# Chạy ở chế độ development
CMD ["pnpm", "dev"]
