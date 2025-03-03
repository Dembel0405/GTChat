# Используем официальный образ Node.js
FROM node:20-alpine

# Создаем директорию приложения
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 3001

# Запускаем приложение
CMD ["node", "server.js"]
