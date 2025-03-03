# AHPC Chat - AI Assistant

Чат-бот с искусственным интеллектом для Актюбинского высшего политехнического колледжа.

## Возможности

- 🤖 AI-ассистент на базе Gemini Pro
- 📰 Автоматическое обновление новостей с сайта колледжа
- 📞 Актуальная контактная информация
- 🔍 Поиск по сайту колледжа
- 💬 Интерактивный чат-интерфейс

## Установка

1. Клонируйте репозиторий:
```bash
git clone [url-репозитория]
cd ahpc-chat
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл .env и добавьте необходимые переменные окружения:
```
GEMINI_API_KEY=ваш-api-ключ
```

4. Запустите сервер:
```bash
npm start
```

Для разработки используйте:
```bash
npm run dev
```

## Структура проекта

- `server.js` - Основной серверный файл
- `app.js` - Клиентский JavaScript
- `webscraper.js` - Модуль веб-скрапинга
- `public/` - Статические файлы
  - `index.html` - Главная страница
  - `style.css` - Стили
- `collegeData.json` - Базовые данные о колледже

## API Endpoints

- `POST /chat` - Отправка сообщения боту
- `GET /api/news` - Получение новостей
- `GET /api/news/:url` - Детали новости
- `GET /api/contacts` - Контактная информация
- `GET /api/search` - Поиск по сайту

## Технологии

- Node.js + Express
- Google Gemini AI
- Axios + Cheerio для веб-скрапинга
- Vanilla JavaScript
- HTML5 + CSS3

## Разработка

1. Используйте `npm run dev` для запуска с автоперезагрузкой
2. Следите за логами сервера для отладки
3. Проверяйте консоль браузера для клиентских ошибок

## TODO

- [ ] Добавить кэширование результатов веб-скрапинга
- [ ] Улучшить обработку ошибок
- [ ] Добавить систему логирования
- [ ] Оптимизировать поиск по сайту
- [ ] Добавить тесты
