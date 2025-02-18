// 確保已載入 gemini.js，並可呼叫 window.generateExplanation

const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// 將訊息加到對話視窗
function appendMessage(role, text) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", role);
  
  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("bubble");
  bubbleDiv.textContent = text;
  
  messageDiv.appendChild(bubbleDiv);
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  appendMessage("user", text);
  userInput.value = "";
  // 呼叫 gemini API 取得回應
  try {
    const response = await window.generateExplanation(text);
    appendMessage("assistant", response);
  } catch (error) {
    appendMessage("assistant", "發生錯誤，請稍後再試。");
    console.error(error);
  }
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
