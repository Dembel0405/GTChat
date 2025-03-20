const chat = document.getElementById('chat');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const clearChatButton = document.getElementById('clearChatButton');

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatReply(text) {
    // Сначала обрабатываем блоки кода
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        lang = lang || 'plaintext';
        
        // Нормализуем отступы, заменяя табуляцию на пробелы
        const formattedCode = code
            .split('\n')
            .map(line => line.replace(/\t/g, '    '))  // Заменяем табы на 4 пробела
            .join('\n')
            .trim();

        // Добавляем специальный маркер для защиты блока кода
        return `###CODE_BLOCK_START###<div class="code-container">
            <button class="copy-btn">Копировать</button>
            <pre><code class="language-${lang}">${escapeHTML(formattedCode)}</code></pre>
        </div>###CODE_BLOCK_END###`;
    });

    // Форматируем обычный текст
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Разбиваем текст на части по маркерам
    const parts = text.split(/(###CODE_BLOCK_START###.*?###CODE_BLOCK_END###)/s);
    
    // Обрабатываем каждую часть
    text = parts.map(part => {
        if (part.startsWith('###CODE_BLOCK_START###')) {
            // Убираем маркеры из блока кода
            return part.slice(21, -19);
        } else {
            // Заменяем переносы строк на <br/> только в обычном тексте
            return part.replace(/\n/g, '<br/>');
        }
    }).join('');

    return text;
}

function addMessage(content, isUser) {
    const message = document.createElement('div');
    message.className = isUser ? 'message user' : 'message ai';
    
    if (!isUser) {
        const avatar = document.createElement('img');
        avatar.src = './img/blue.png';
        avatar.alt = 'AI Avatar';
        avatar.className = 'avatar';
        message.appendChild(avatar);
    }
    
    const textContainer = document.createElement('div');
    textContainer.className = 'message-text';
    textContainer.innerHTML = formatReply(content);
    message.appendChild(textContainer);
    
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;

    // Подсветка синтаксиса
    const codeBlocks = textContainer.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        hljs.highlightElement(block);
    });
}

function getChatHistory() {
    return JSON.parse(localStorage.getItem('chatHistory')) || [];
}

function saveMessages(message) {
    const chatHistory = getChatHistory();
    chatHistory.push(message);
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    chat.innerHTML = '';
    getChatHistory().forEach(({ role, content }) => addMessage(content, role === "user"));
}

userInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        await sendMessage();
    }
});

sendButton.addEventListener('click', sendMessage);

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    let chatHistory = getChatHistory();
    chatHistory.push({ role: "user", content: message });
    userInput.value = '';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatHistory })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const replyMessage = data.response || "Ошибка ответа";
        chatHistory.push({ role: "model", content: replyMessage });
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        addMessage(replyMessage, false);
    } catch (error) {
        console.error('Ошибка:', error);
        addMessage(`Ошибка: ${error.message}`, false);
    }
}

clearChatButton.addEventListener('click', () => {
    chat.innerHTML = '';
    localStorage.removeItem('chatHistory');
});

// Обработчик копирования кода
chat.addEventListener('click', (event) => {
    if (event.target.classList.contains('copy-btn')) {
        const codeElement = event.target.nextElementSibling.querySelector('code');
        if (codeElement) {
            navigator.clipboard.writeText(codeElement.textContent)
                .then(() => {
                    event.target.textContent = 'Скопировано!';
                    setTimeout(() => event.target.textContent = 'Копировать', 2000);
                })
                .catch(err => console.error('Ошибка копирования:', err));
        }
    }
});

window.onload = loadChatHistory;
