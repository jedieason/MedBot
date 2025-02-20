document.getElementById("sendButton").addEventListener("click", async () => {
    const userMessageInput = document.getElementById("userMessage");
    const chatLog = document.getElementById("chat-log");
    const userMessage = userMessageInput.value.trim();
    if (!userMessage) return;
    
    // 顯示使用者訊息
    const userMsgDiv = document.createElement("div");
    userMsgDiv.className = "user-message";
    userMsgDiv.textContent = `${userMessage}`;
    chatLog.appendChild(userMsgDiv);
    userMessageInput.value = "";
    
    try {
        const assistantResponse = await window.sendMessage(userMessage);
        const assistantMsgDiv = document.createElement("div");
        assistantMsgDiv.className = "assistant-message";
        assistantMsgDiv.textContent = `${assistantResponse}`;
        chatLog.appendChild(assistantMsgDiv);
    } catch (error) {
        const errorMsgDiv = document.createElement("div");
        errorMsgDiv.className = "error-message";
        errorMsgDiv.textContent = `錯誤：${error.message}`;
        chatLog.appendChild(errorMsgDiv);
    }
});

document.addEventListener("DOMContentLoaded", () => {
  const chatLog = document.getElementById("chat-log");
  const initMsgDiv = document.createElement("div");
  initMsgDiv.className = "assistant-message";
  initMsgDiv.textContent = "您好，方便請問有什麼地方不舒服嗎？";
  chatLog.appendChild(initMsgDiv);
});
