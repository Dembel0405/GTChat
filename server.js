const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

// Настройка логгера
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

const app = express();
const port = 3000;

// Проверка API ключа
if (!process.env.GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY не найден в .env файле');
    process.exit(1);
}

// Настройка Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

// Настройка CORS
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
};

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'blob:'],
        },
    }
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(limiter);
app.use(express.json());
app.use(express.static('public'));

// Инициализация Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Тестовый запрос к API
async function testGeminiAPI() {
    try {
        logger.info('Начало тестирования Gemini API...');
        logger.info('API KEY присутствует:', !!process.env.GEMINI_API_KEY);
        
        // Создаем модель
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        logger.info('Модель создана:', model.model);
        
        // Тестовый запрос
        logger.info('Отправляем тестовый запрос к API...');
        const result = await model.generateContent('Say "Hello" in Russian', {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        });
        logger.info('Получен ответ от API (result):', !!result);
        
        const response = await result.response;
        logger.info('Получен response:', !!response);
        
        const text = response.text();
        logger.info('Получен текст ответа:', text);
        
        return true;
    } catch (error) {
        logger.error('Ошибка в testGeminiAPI:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            details: error.toString()
        });
        return false;
    }
}

// Обработчик сообщений
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        logger.info('Получено сообщение:', message);
        logger.info('API KEY присутствует:', !!process.env.GEMINI_API_KEY);

        try {
            // Создаем модель
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            logger.info('Модель создана:', model.model);
            
            // Отправляем сообщение
            logger.info('Отправляем запрос к API...');
            const result = await model.generateContent(message, {
                temperature: 0.9,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
            });
            logger.info('Получен ответ от API (result):', !!result);
            
            const response = await result.response;
            logger.info('Получен response:', !!response);
            
            const text = response.text();
            logger.info('Получен текст ответа:', text);
            
            logger.info('Успешно получен ответ от Gemini');
            return res.json({ response: text });
        } catch (error) {
            logger.error('Ошибка при генерации ответа:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                details: error.toString()
            });
            return res.status(500).json({ 
                error: 'Ошибка при получении ответа от AI',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    } catch (error) {
        logger.error('Общая ошибка в обработчике /chat:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            details: error.toString()
        });
        return res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Запуск сервера
const server = app.listen(port, async () => {
    logger.info(`Сервер запущен на порту ${port}`);
    const apiTest = await testGeminiAPI();
    if (!apiTest) {
        logger.error('Ошибка подключения к Gemini API');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received. Closing HTTP server...');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});
