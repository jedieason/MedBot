// 初始化對話歷史
let conversationHistory = [];

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


// 初始化函數，用於獲取歡迎訊息
async function initializeChat() {
    try {
        const response = await fetch("https://us-central1-geminiapiformedbot.cloudfunctions.net/geminiFunction", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation: [
                    { 
                        role: 'user', 
                        content: [{ text: 'INIT_CHAT' }] 
                    }
                ]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 呼叫錯誤 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        const welcomeMessage = data.response.trim();
        
        // 將歡迎訊息加入對話歷史
        conversationHistory.push({ role: "assistant", message: welcomeMessage });
        
        // 顯示歡迎訊息
        const chatLog = document.getElementById("chat-log");
        const welcomeMsgDiv = document.createElement("div");
        welcomeMsgDiv.className = "assistant-message";
        welcomeMsgDiv.textContent = welcomeMessage;
        chatLog.appendChild(welcomeMsgDiv);
        
        return welcomeMessage;
    } catch (error) {
        console.error("初始化錯誤:", error);
        const chatLog = document.getElementById("chat-log");
        const errorMsgDiv = document.createElement("div");
        errorMsgDiv.className = "error-message";
        errorMsgDiv.textContent = `初始化錯誤: ${error.message}`;
        chatLog.appendChild(errorMsgDiv);
        return "您好，請問有什麼能幫您的嗎？";
    }
}

window.sendMessage = async function (userMessage) {
    // 將使用者訊息加入 conversationHistory（顯示用）
    conversationHistory.push({ role: "user", message: userMessage });
    
    try {
        // 產生一個新的陣列，僅包含送 API 時需要的訊息，過濾掉第一則助理訊息
        const historyForAPI = conversationHistory.filter((msg, idx) => {
            // 如果第一則訊息是助理的歡迎訊息，就過濾掉
            if (idx === 0 && msg.role === "assistant") {
                return false;
            }
            return true;
        });
        
        // 格式化送給 Gemini API 的對話歷史
        const formattedConversation = historyForAPI.map(msg => ({
            role: msg.role, 
            content: [{ text: msg.message }]
        }));
        
        console.log("發送到後端的對話歷史:", JSON.stringify(formattedConversation));
        
        const response = await fetch("https://us-central1-geminiapiformedbot.cloudfunctions.net/geminiFunction", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation: formattedConversation
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 呼叫錯誤 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        const trimmedResponse = data.response.trim();

        if (trimmedResponse.includes("病歷簡介：")) {
            conversationHistory.push({ role: "assistant", message: "感謝您提供完整資訊，我們已完成資料整理。" });
            sendFinalMedicalReport(trimmedResponse);
            const inputArea = document.getElementById("input-area");
            inputArea.innerHTML = '<p>感謝您提供完整資訊，請稍待片刻等待就診。另外在候位之餘想邀請您<a href="https://forms.gle/Ema6yXHhNHZ6dB6x6" target="_blank">點此</a>回饋您的使用體驗！</p>';
            return "感謝您！";
        } else {
            conversationHistory.push({ role: "assistant", message: trimmedResponse });
            return trimmedResponse;
        }
    } catch (error) {
        console.error("錯誤：", error);
        throw new Error(`產生回應時發生錯誤: ${error.message}`);
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

    // 顯示讀取中...
    const loadingMsgDiv = document.createElement("div");
    loadingMsgDiv.className = "assistant-message loading";
    loadingMsgDiv.textContent = "處理中...";
    chatLog.appendChild(loadingMsgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

    try {
        const assistantResponse = await window.sendMessage(userMessage);
        // 移除讀取訊息
        chatLog.removeChild(loadingMsgDiv);
        
        const assistantMsgDiv = document.createElement("div");
        assistantMsgDiv.className = "assistant-message";
        assistantMsgDiv.textContent = assistantResponse;
        chatLog.appendChild(assistantMsgDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    } catch (error) {
        // 移除讀取訊息
        chatLog.removeChild(loadingMsgDiv);
        
        const errorMsgDiv = document.createElement("div");
        errorMsgDiv.className = "error-message";
        errorMsgDiv.textContent = `錯誤：${error.message}`;
        chatLog.appendChild(errorMsgDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    await initializeChat();
});

const userMessageInput = document.getElementById("userMessage");
userMessageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        document.getElementById("sendButton").click();
    }
});
