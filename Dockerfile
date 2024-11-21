# Используем официальный образ Node.js
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем весь код
COPY . .

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "index.js"]