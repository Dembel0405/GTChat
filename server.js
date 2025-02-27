const express = require('express');
const axios = require('axios');
require('dotenv').config();
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Вводные данные о колледже
const collegeInfo = {
    name: "Актюбинский высший политехнический колледж",
    established: 1965,
    description: "Актюбинский высший политехнический колледж был основан в 1965 году."
};

// Добавьте обработчик для корневого маршрута
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const context = `Вы ассистент колледжа. ${collegeInfo.description}`;
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API key is missing' });
    }

    let responseSent = false;

    const sendRequest = async (retries = 3) => {
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    contents: [
                        {
                            parts: [
                                { text: `${context}\n\nВопрос: ${userMessage}` }
                            ]
                        }
                    ]
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            console.log('API Response:', response.data);

            if (!responseSent) {
                if (response.data.candidates && response.data.candidates.length > 0) {
                    const candidate = response.data.candidates[0];
                    console.log('Candidate content:', candidate.content); // Логируем content

                    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                        const responseText = candidate.content.parts.map(part => part.text).join('');
                        res.json({ reply: responseText });
                    } else {
                        console.log('No parts in candidate content');
                        res.json({ reply: 'Ответ не найден.' });
                    }
                } else {
                    console.log('No candidates received');
                    res.json({ reply: 'No candidates received.' });
                }
                responseSent = true;
            }
        } catch (error) {
            console.error('Fetch error:', error.response ? error.response.data : error.message);
            if (error.response && error.response.status === 503 && retries > 0) {
                console.log('Повторный запрос...');
                return setTimeout(() => sendRequest(retries - 1), 5000);
            }
            if (!responseSent) {
                res.status(500).json({ error: 'Internal Server Error' });
                responseSent = true;
            }
        }
    };

    sendRequest();
});




// Указываем порт, на котором будет запущен сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
