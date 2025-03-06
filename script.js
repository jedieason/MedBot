let conversationHistory = [
    {
      role: "assistant",
      content: [{ type: "text", text: "您好，方便請問您的候位號碼與姓名嗎？" }]
    }
  ];
  
  function sendFinalMedicalReport(finalReport) {
    const url = 'https://script.google.com/macros/s/AKfycbypoBJyxKh436VSYk_PFyaWoVuK-BuBezOCkxuhhm28GcR68jHwMyIHK7EG5Gge_SCfhQ/exec';
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ content: finalReport })
    })
    .then(response => response.text())
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
    console.log("最終醫療敘述已傳送：", finalReport);
  }
  
  window.sendMessage = async function (userMessage) {
    conversationHistory.push({
      role: "user",
      content: [{ type: "text", text: userMessage }]
    });
  
    try {
      const response = await fetch("https://us-central1-geminiapiformedbot.cloudfunctions.net/geminiFunction", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversation: conversationHistory })
      });
      if (!response.ok) throw new Error("API 呼叫錯誤");
      const data = await response.json();
      const trimmedResponse = data.response.trim();
  
      if (trimmedResponse.includes("病歷簡介：")) {
        sendFinalMedicalReport(trimmedResponse);
        conversationHistory.push({
          role: "assistant",
          content: [{ type: "text", text: "感謝您提供完整資訊，我們已完成資料整理。" }]
        });
        const inputArea = document.getElementById("input-area");
        inputArea.innerHTML = '<p>感謝您提供完整資訊，請稍待片刻等待就診。另外在候位之餘想邀請您<a href="http://www.example.com" target="_blank">點此</a>回饋您的使用體驗！</p>';
        return "感謝您！";
      } else {
        conversationHistory.push({
          role: "assistant",
          content: [{ type: "text", text: trimmedResponse }]
        });
        return trimmedResponse;
      }
    } catch (error) {
      console.error("錯誤：", error);
      throw new Error("產生回應時發生錯誤。");
    }
  };
  
  document.getElementById("sendButton").addEventListener("click", async () => {
    const userMessageInput = document.getElementById("userMessage");
    const chatLog = document.getElementById("chat-log");
    const userMessage = userMessageInput.value.trim();
    if (!userMessage) return;
  
    const userMsgDiv = document.createElement("div");
    userMsgDiv.className = "user-message";
    userMsgDiv.textContent = userMessage;
    chatLog.appendChild(userMsgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
    userMessageInput.value = "";
  
    try {
      const assistantResponse = await window.sendMessage(userMessage);
      const assistantMsgDiv = document.createElement("div");
      assistantMsgDiv.className = "assistant-message";
      assistantMsgDiv.textContent = assistantResponse;
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
  
