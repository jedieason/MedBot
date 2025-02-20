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
    chatLog.scrollTop = chatLog.scrollHeight;
    userMessageInput.value = "";
    
    try {
        const assistantResponse = await window.sendMessage(userMessage);
        const assistantMsgDiv = document.createElement("div");
        assistantMsgDiv.className = "assistant-message";
        assistantMsgDiv.textContent = `${assistantResponse}`;
        chatLog.appendChild(assistantMsgDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    } catch (error) {
        const errorMsgDiv = document.createElement("div");
        errorMsgDiv.className = "error-message";
        errorMsgDiv.textContent = `錯誤：${error.message}`;
        chatLog.appendChild(errorMsgDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    }
});

document.addEventListener("DOMContentLoaded", () => {
  const chatLog = document.getElementById("chat-log");
  const initMsgDiv = document.createElement("div");
  initMsgDiv.className = "assistant-message";
  initMsgDiv.textContent = "您好，方便請問您的候位號碼與姓名嗎？";
  chatLog.appendChild(initMsgDiv);
});

const userMessageInput = document.getElementById("userMessage");
userMessageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        document.getElementById("sendButton").click();
    }
});
