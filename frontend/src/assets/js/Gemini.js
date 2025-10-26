function toggleChat(event) {
    const chatBox = document.getElementById('chatBox');
    // Chỉ mở khung chat nếu đang ẩn
    if (chatBox.style.display === 'none' || chatBox.style.display === '') {
        chatBox.style.display = 'flex';
    }
    event.stopPropagation(); // Ngăn sự kiện nhấp vào icon lan ra document
}

function addMessage(content, isUser) {
    const messages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (isUser ? 'user-message' : 'bot-message');
    messageDiv.textContent = content;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || message.length === 0) {
        addMessage("Vui lòng nhập tin nhắn!", false);
        return;
    }

    addMessage(message, true);
    input.value = '';

    try {
        const response = await fetch('/Gemini/Chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (data.success) {
            addMessage(data.response, false);
        } else {
            addMessage('Lỗi: ' + data.error, false);
        }
    } catch (error) {
        addMessage('Lỗi: ' + error.message, false);
    }
}

// Đóng khung chat khi nhấp bất kỳ đâu ngoài chatBox
document.addEventListener('click', function (event) {
    const chatBox = document.getElementById('chatBox');
    // Nếu khung chat đang hiển thị và nhấp không nằm trong chatBox thì đóng
    if (chatBox.style.display === 'flex' && !chatBox.contains(event.target)) {
        chatBox.style.display = 'none';
    }
});

// Ngăn sự kiện click trong chatBox lan ra ngoài
document.getElementById('chatBox').addEventListener('click', function (event) {
    event.stopPropagation();
});