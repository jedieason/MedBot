document.getElementById("sendButton").addEventListener("click", async () => {
    const userMessageInput = document.getElementById("userMessage");
    const chatLog = document.getElementById("chat-log");
    const userMessage = userMessageInput.value.trim();
    if (!userMessage) return;
    
    // 顯示使用者訊息
    const userMsgDiv = document.createElement("div");
    userMsgDiv.className = "user-message";
    userMsgDiv.textContent = `使用者：${userMessage}`;
    chatLog.appendChild(userMsgDiv);
    userMessageInput.value = "";
    
    try {
        const assistantResponse = await window.sendMessage(userMessage);
        const assistantMsgDiv = document.createElement("div");
        assistantMsgDiv.className = "assistant-message";
        assistantMsgDiv.textContent = `診間助理：${assistantResponse}`;
        chatLog.appendChild(assistantMsgDiv);
    } catch (error) {
        const errorMsgDiv = document.createElement("div");
        errorMsgDiv.className = "error-message";
        errorMsgDiv.textContent = `錯誤：${error.message}`;
        chatLog.appendChild(errorMsgDiv);
    }
});
