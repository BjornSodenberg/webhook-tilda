# Используем официальный образ Node.js
FROM node:18

# Устанавливаем git
RUN apt-get update && apt-get install -y git && apt-get clean

# Скачиваем репозиторий
RUN git clone https://github.com/BjornSodenberg/webhook-tilda.git /usr/src/app

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Устанавливаем зависимости
RUN npm install

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "index.js"]