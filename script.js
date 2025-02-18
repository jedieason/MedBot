document.addEventListener("DOMContentLoaded", () => {
  const chatLog = document.getElementById("chat-log");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");

  // 新增訊息至對話框
  function appendMessage(sender, message) {
    const msgElem = document.createElement("div");
    msgElem.classList.add("chat-message", sender);
    msgElem.textContent = message;
    chatLog.appendChild(msgElem);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  // 傳送使用者訊息，並呼叫 gemini API
  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage("user", text);
    userInput.value = "";
    try {
      const response = await window.generateExplanation(text);
      appendMessage("assistant", response);
    } catch (error) {
      console.error(error);
      appendMessage("assistant", "發生錯誤，請稍後再試。");
    }
  }

  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});
