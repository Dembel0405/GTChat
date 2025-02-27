const chat = document.getElementById('chat');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const clearChatButton = document.getElementById('clearChatButton');

// Экранирование HTML
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatReply(text) {
    console.log("Оригинальный текст:", text);

    // Замена жирного текста: **text** на <strong>text</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Для обычного курсивного текста

    // Преобразование переносов строк: \n -> <br/>
    text = text.replace(/\n/g, '<br/>');

    // Преобразование табуляции: \t -> &nbsp;&nbsp;&nbsp;&nbsp;
    text = text.replace(/\t+/g, match => '&nbsp;'.repeat(match.length * 4));

    // Преобразование пунктов списка (замена "* текст" на "<li>текст</li>")
    text = text.replace(/(?:^|\n)\*\s+(.*?)(?=\n|$)/g, '<li>$1</li>');

    // Группировка всех <li> элементов в <ul>
    text = text.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

    // Удаление лишних <br/> внутри списков
    text = text.replace(/<ul><br\/>/g, '<ul>').replace(/<br\/><\/ul>/g, '</ul>');
    text = text.replace(/<li><br\/>/g, '<li>').replace(/<br\/><\/li>/g, '</li>');

    console.log("После преобразования текста:", text);

    return text;
}

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация подсветки синтаксиса
    if (window.hljs) {
        hljs.highlightAll();
    }
});

// Функция добавления нового сообщения
function addMessage(content, isUser) {
    const message = document.createElement('div');
    message.className = isUser ? 'message user' : 'message ai';

    // Создание элемента для аватарки
    if (!isUser) {
        const avatar = document.createElement('img');
        avatar.src = 'path/to/logo.png'; // Замените на путь к логотипу компании
        avatar.alt = 'AI Avatar';
        avatar.className = 'avatar';
        message.appendChild(avatar); // Добавляем аватар в сообщение
    }

    // Убедитесь, что контент предварительно обработан функцией formatReply
    const formattedContent = formatReply(content);
    const textContainer = document.createElement('div');
    textContainer.innerHTML = formattedContent;
    message.appendChild(textContainer);

    chat.appendChild(message); // Добавляем сообщение в контейнер
    chat.scrollTop = chat.scrollHeight; // Прокручиваем чат вниз
}

// Сохранение сообщения
function saveMessage(message) {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.push(message);
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Загрузка истории чата
function loadChatHistory() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chat.innerHTML = ''; // Очистка чата перед загрузкой
    chatHistory.forEach(message => {
        chat.innerHTML += message;
    });
    scrollToBottom();
}

// Обработка и отображение ответа
function processReply(data) {
    let replyText = data.reply || ''; // Проверяем, есть ли ответ
    console.log("Ответ от сервера:", replyText);

    // Обрабатываем код-блоки
    replyText = replyText.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        lang = lang || 'plaintext';
        return `<pre><code class="language-${lang}">${escapeHTML(code)}</code></pre>`;
    });

    // Обрабатываем списки
    replyText = replyText.replace(/(?:^|\n)\*\s+(.*?)(?=\n|$)/g, '<li>$1</li>');
    replyText = replyText.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

    // Обрабатываем жирный текст и курсив
    replyText = replyText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    replyText = replyText.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Обрабатываем переносы строк
    replyText = replyText.replace(/\n/g, '<br/>');

    console.log("После форматирования:", replyText);

    const replyHtml = `
        <div class="message ai">
            <img src="./img/blue.png" alt="AI Avatar" class="avatar">
            <div class="reply-text">${replyText}</div>
        </div>`;

    // Подсветка синтаксиса
    setTimeout(() => {
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }, 100);

    return replyHtml;
}


userInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // предотвращает стандартное поведение Enter (перенос строки)
        
        const message = userInput.value.trim();
        if (!message) return; // если сообщение пустое, не отправляем

        // Отображение сообщения пользователя
        const userMessage = `<div class="message user"> ${escapeHTML(message)}</div>`;
        chat.innerHTML += userMessage;
        saveMessage(userMessage);
        userInput.value = '';

        document.getElementById('typing-indicator').classList.add('active');

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            const replyMessage = processReply(data);

            chat.innerHTML += replyMessage;
            saveMessage(replyMessage);
        } catch (error) {
            const errorMessage = `<div class="message ai"><span>Ошибка при отправке сообщения.</span></div>`;
            chat.innerHTML += errorMessage;
            saveMessage(errorMessage);
        } finally {
            document.getElementById('typing-indicator').classList.remove('active');
            scrollToBottom();
        }
    }
});

// Отправка сообщения
sendButton.addEventListener('click', async () => {
    const message = userInput.value.trim();
    if (!message) return;

    const userMessage = `<div class="message user">Вы: ${escapeHTML(message)}</div>`;
    chat.innerHTML += userMessage;
    saveMessage(userMessage);
    userInput.value = '';

    document.getElementById('typing-indicator').classList.add('active');

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        const replyMessage = processReply(data);

        chat.innerHTML += replyMessage;
        saveMessage(replyMessage);
    } catch (error) {
        const errorMessage = `<div class="message ai"><span>Ошибка при отправке сообщения.</span></div>`;
        chat.innerHTML += errorMessage;
        saveMessage(errorMessage);
    } finally {
        document.getElementById('typing-indicator').classList.remove('active');
        scrollToBottom();
    }
});

// Прокрутка чата вниз
function scrollToBottom() {
    chat.scroll({
        top: chat.scrollHeight,
        behavior: 'smooth'
    });
}

// Очистка чата
clearChatButton.addEventListener('click', () => {
    chat.innerHTML = '';
    localStorage.removeItem('chatHistory');
});

// Отображение блока с кодом
function displayCode(code, language = 'javascript') {
    const codeContainer = document.createElement('div');
    codeContainer.classList.add('code-container');

    const pre = document.createElement('pre');
    const codeElement = document.createElement('code');
    codeElement.classList.add(`language-${language}`);
    codeElement.textContent = code;

    // Подсветка синтаксиса после добавления элемента
    if (window.hljs) {
        hljs.highlightElement(codeElement);
    }

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Копировать код';
    copyButton.classList.add('copy-button');
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
            copyButton.textContent = 'Скопировано!';
            setTimeout(() => (copyButton.textContent = 'Копировать код'), 2000);
        });
    });

    pre.appendChild(codeElement);
    codeContainer.appendChild(pre);
    codeContainer.appendChild(copyButton);

    chat.appendChild(codeContainer);
    scrollToBottom();
}

// Делегируем событие на контейнер chat, чтобы обрабатывать динамически созданные кнопки
chat.addEventListener('click', (event) => {
    if (event.target.classList.contains('copy-btn')) {
        const codeElement = event.target.nextElementSibling.querySelector('code');
        if (codeElement) {
            const codeText = codeElement.textContent;
            navigator.clipboard.writeText(codeText)
                .then(() => {
                    event.target.textContent = 'Скопировано!';
                    setTimeout(() => event.target.textContent = 'Копировать', 2000);
                })
                .catch(err => {
                    console.error('Ошибка копирования:', err);
                    event.target.textContent = 'Ошибка!';
                    setTimeout(() => event.target.textContent = 'Копировать', 2000);
                });
        }
    }
});

// Загрузка истории при загрузке страницы
window.onload = loadChatHistory;
