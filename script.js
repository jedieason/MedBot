import './gemini.js';

document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');

  function appendMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (type === 'user') {
      messageDiv.classList.add('user-message');
    } else {
      messageDiv.classList.add('ai-message');
    }
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    userInput.value = '';

    // 顯示等待效果
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('message', 'ai-message');
    loadingMessage.textContent = '...';
    chatMessages.appendChild(loadingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const response = await window.generateExplanation(text);
      chatMessages.removeChild(loadingMessage);
      appendMessage(response, 'ai');
    } catch (error) {
      chatMessages.removeChild(loadingMessage);
      appendMessage('發生錯誤，請稍後再試。', 'ai');
      console.error(error);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});
