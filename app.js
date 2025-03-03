document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;
    
    // Disable input and button while processing
    messageInput.disabled = true;
    sendBtn.disabled = true;
    
    // Display user message
    const sanitizedMessage = escapeHtml(userMessage);
    chatBox.innerHTML += `
        <div class="message user">
            <div class="message-content">
                <div class="message-text">${sanitizedMessage}</div>
            </div>
        </div>`;
    messageInput.value = '';

    try {
        // Send request to our local server endpoint
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Display AI response with proper structure
        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai';
        
        // Create message content wrapper
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Process the response text and detect code blocks
        const processedContent = processMessageWithCode(data.reply);
        messageContent.innerHTML = processedContent;
        
        aiMessage.appendChild(messageContent);
        chatBox.appendChild(aiMessage);
        
        // Initialize syntax highlighting for new code blocks
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
        
    } catch (error) {
        console.error('Error:', error);
        chatBox.innerHTML += `
            <div class="message error">
                <div class="message-content">
                    <div class="message-text">Error: Something went wrong. Please try again.</div>
                </div>
            </div>`;
    } finally {
        // Re-enable input and button
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper function to process message and wrap code blocks
function processMessageWithCode(message) {
    // Split message by code blocks
    const parts = message.split('```');
    let result = '';
    
    parts.forEach((part, index) => {
        if (index % 2 === 0) {
            // This is regular text
            result += `<div class="message-text">${part}</div>`;
        } else {
            // This is a code block
            const firstLineBreak = part.indexOf('\n');
            const language = firstLineBreak > 0 ? part.substring(0, firstLineBreak) : '';
            const code = firstLineBreak > 0 ? part.substring(firstLineBreak + 1) : part;
            
            result += `
                <div class="code-container">
                    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                    <pre><code class="language-${language}">${escapeHtml(code)}</code></pre>
                </div>`;
        }
    });
    
    return result;
}

// Function to copy code to clipboard
function copyCode(button) {
    const codeBlock = button.nextElementSibling.querySelector('code');
    const text = codeBlock.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}
