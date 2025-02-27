document.getElementById('send-btn').addEventListener('click', async function() {
    const messageInput = document.getElementById('message-input');
    const chatBox = document.getElementById('chat-box');
    
    const userMessage = messageInput.value;
    if (!userMessage) return;
    
    // Отображаем сообщение пользователя
    chatBox.innerHTML += `<div><strong>You:</strong> ${userMessage}</div>`;
    messageInput.value = '';

    
    try {
        // Отправляем запрос к Gemini API
        const response = await fetch('https://gemini-api-url.com/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'AIzaSyA0MAO274OoQzjoObhPhVjRpeVidXC_M6k'
            },
            body: JSON.stringify({
                message: userMessage
            })
        });

        const data = await response.json();
        
        // Отображаем ответ AI
        chatBox.innerHTML += `<div><strong>AI:</strong> ${data.reply}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        
    } catch (error) {
        console.error('Error:', error);
        chatBox.innerHTML += `<div><strong>Error:</strong> Something went wrong. Please try again.</div>`;
    }
});
