// 全域對話歷史，初始為問候語
let conversationHistory = "診間助理：您好，方便請問您的候位號碼與姓名嗎？\n";

// 定義呼叫 Lambda 的函式
async function sendMessageToLambda(userMessage) {
    // 將使用者訊息加入對話歷史
    conversationHistory += `使用者：${userMessage}\n`;
    // 建立傳送給 Lambda 的資料
    const payload = {
        conversationHistory: conversationHistory
    };

    try {
        const response = await fetch('https://22guvlu6i8.execute-api.ap-southeast-2.amazonaws.com/CORSsetting/Med-OpenAI-API', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
            const assistantResponse = data.response;
            // 將 Lambda 回傳的診間助理訊息加入對話歷史
            conversationHistory += `診間助理：${assistantResponse}\n`;
            return assistantResponse;
        } else {
            throw new Error(data.error || "未知錯誤");
        }
    } catch (error) {
        console.error("呼叫 Lambda 時發生錯誤:", error);
        throw error;
    }
}

// 綁定傳送按鈕的點擊事件
document.getElementById("sendButton").addEventListener("click", async () => {
    const userMessageInput = document.getElementById("userMessage");
    const chatLog = document.getElementById("chat-log");
    const userMessage = userMessageInput.value.trim();
    if (!userMessage) return;

    // 顯示使用者訊息
    const userMsgDiv = document.createElement("div");
    userMsgDiv.className = "user-message";
    userMsgDiv.textContent = userMessage;
    chatLog.appendChild(userMsgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
    userMessageInput.value = "";

    try {
        const assistantResponse = await sendMessageToLambda(userMessage);
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

// 頁面初始載入時顯示第一則訊息
document.addEventListener("DOMContentLoaded", () => {
    const chatLog = document.getElementById("chat-log");
    const initMsgDiv = document.createElement("div");
    initMsgDiv.className = "assistant-message";
    initMsgDiv.textContent = "診間助理：您好，方便請問您的候位號碼與姓名嗎？";
    chatLog.appendChild(initMsgDiv);
});

// 監聽使用者在文字方塊按下 Enter 鍵時傳送訊息
const userMessageInput = document.getElementById("userMessage");
userMessageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        document.getElementById("sendButton").click();
    }
});
