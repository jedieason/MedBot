import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getDatabase, ref, set } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
const firebaseConfig = {
    apiKey: "AIzaSyChdYY6AdKToEyv194bJOdAIx00ykRCtDE",
    authDomain: "geminiapiformedbot.firebaseapp.com",
    databaseURL: "https://geminiapiformedbot-default-rtdb.firebaseio.com",
    projectId: "geminiapiformedbot",
    storageBucket: "geminiapiformedbot.firebasestorage.app",
    messagingSenderId: "520520790517",
    appId: "1:520520790517:web:24f30bf0b9999dafdbb0bc",
    measurementId: "G-BCJJ36CS4S"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 使用者選擇的語言（zh | en），預設中文
let selectedLang = "zh";

let conversationHistory = [];


async function sendFinalMedicalReport(finalReport) {
    console.log("🚑 [DEBUG] Received finalReport ▼\n", finalReport);
    const reportObject = {
        "姓名": "",
        "就診原因／醫師協助期待": "",
        "情緒／睡眠／自律神經症狀及持續時間": "",
        "壓力或影響情緒事件經過": "",
        "其他不舒服症狀": "",
        "既往內科慢性病史（如氣喘、糖尿病、高血壓、肝炎等）：": "",
        "居住狀況與家庭組成": "",
        "吸菸／飲酒／檳榔／其他物質習慣及平均每日用量": "",
        "其他想告訴醫師事項": "",
        "初步診斷": ""
    };

    // === 新增：若回傳包含 XML，嘗試抽取並解析 ===
    let xmlString = null;
    const directXML = finalReport.trim().startsWith('<');
    if (directXML) {
        xmlString = finalReport.trim();
    } else {
        // 嘗試抓取 <medical_record> ... </medical_record>
        const startIdx = finalReport.indexOf("<medical_record");
        const endIdx = finalReport.indexOf("</medical_record>");
        if (startIdx !== -1 && endIdx !== -1) {
            xmlString = finalReport.slice(startIdx, endIdx + "</medical_record>".length);
        }
    }

    if (xmlString) {
        console.log("📄 [DEBUG] Extracted XML ▼\n", xmlString);
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");
            // XML 標籤 → reportObject 鍵 的對應
            const xmlToObjectKey = {
                "姓名": "姓名",
                "就診原因_醫師協助期待": "就診原因／醫師協助期待",
                "情緒_睡眠_自律神經症狀及持續時間": "情緒／睡眠／自律神經症狀及持續時間",
                "壓力或影響情緒事件經過": "壓力或影響情緒事件經過",
                "其他不舒服症狀": "其他不舒服症狀",
                "既往內科慢性病史": "既往內科慢性病史（如氣喘、糖尿病、高血壓、肝炎等）：",
                "居住狀況與家庭組成": "居住狀況與家庭組成",
                "物質使用習慣_平均每日用量": "吸菸／飲酒／檳榔／其他物質習慣及平均每日用量",
                "其他想告訴醫師事項": "其他想告訴醫師事項",
                "初步診斷": "初步診斷"
            };

            Object.entries(xmlToObjectKey).forEach(([tag, key]) => {
                const elem = xmlDoc.getElementsByTagName(tag)[0];
                if (elem && elem.textContent != null) {
                    reportObject[key] = elem.textContent.trim();
                }
            });
        } catch (xmlErr) {
            console.error("XML 解析錯誤:", xmlErr);
            /* 若失敗，會在下方備援的行分割邏輯處理 */
        }
    }

    if (!xmlString) {
        // 按行分割傳入的報告字串（純文字格式備援）
        const lines = finalReport.split('\n');
        lines.forEach(line => {
            // 使用正則表達式分割鍵和值，處理全形或半形冒號
            const parts = line.split(/：|:/);
            if (parts.length >= 2) {
                const key = parts[0].trim(); // 取得鍵，並去除前後空白
                // 將冒號後面的所有部分合併為值，並保留值中可能存在的冒號
                const value = parts.slice(1).join(parts[0].includes('：') ? '：' : ':').trim();

                // 檢查報告物件中是否有此鍵，若有則賦值
                if (reportObject.hasOwnProperty(key)) {
                    reportObject[key] = value;
                }
            }
        });
    }

    console.log("🩺 [DEBUG] Parsed reportObject ▼\n", reportObject);

    // 從 reportObject 中取得所需資訊
    const 時間戳 = Date.now();
    const 姓名_值 = reportObject["姓名"] || "未知姓名";         // 如果沒取到姓名，給個預設值
    const 病歷識別碼 = `${時間戳}｜${姓名_值}`;

    try {
        // 假設 'database', 'ref', 'set' 已經正確配置
        // import { getDatabase, ref, set } from "firebase/database";
        // const database = getDatabase();

        // 建立 Firebase Realtime Database 的參照路徑
        const reportRef = ref(database, `medical_reports/${病歷識別碼}`);
        // 將報告物件儲存到 Firebase
        await set(reportRef, reportObject);
        console.log(`醫療報告已成功儲存到 Firebase。路徑: medical_reports/${病歷識別碼} 💯`);
        console.log("儲存的資料：", reportObject);

    } catch (error) {
        console.error('儲存醫療報告到 Firebase 時發生錯誤:', error);
        // 如果有錯誤回報函數，則呼叫它
        if (typeof sendErrorReport === 'function') {
            sendErrorReport(new Error(`Firebase 儲存錯誤: ${error.message} (病歷識別碼: ${病歷識別碼})`));
        }
    }
}



async function initializeChat(initialMessage) {
    // 先顯示 loading 動畫
    const chatLog = document.getElementById("chat-log");
    const loadingMsgDiv = document.createElement("div");
    loadingMsgDiv.className = "assistant-message loading";
    loadingMsgDiv.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    chatLog.appendChild(loadingMsgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
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
                        content: [{ text: initialMessage }]
                    }
                ],
                lang: selectedLang
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 呼叫錯誤 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        // 取得回應後移除 loading
        chatLog.removeChild(loadingMsgDiv);
        const welcomeMessage = data.response.trim();
        
        // 將歡迎訊息加入對話歷史
        conversationHistory.push({ role: "assistant", message: welcomeMessage });
        
        // 顯示歡迎訊息
        const welcomeMsgDiv = document.createElement("div");
        welcomeMsgDiv.className = "assistant-message";
        welcomeMsgDiv.textContent = welcomeMessage;
        chatLog.appendChild(welcomeMsgDiv);
        
        return welcomeMessage;
    } catch (error) {
        // 發生錯誤時也要移除 loading
        chatLog.removeChild(loadingMsgDiv);
        console.error("初始化錯誤:", error);
        sendErrorReport(error);
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
                conversation: formattedConversation,
                lang: selectedLang
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 呼叫錯誤 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        const trimmedResponse = data.response.trim();

        if (trimmedResponse.includes("<medical_record") || trimmedResponse.includes("病歷簡介：")) {
            const thankMsgZh = "感謝您提供完整資訊，我們已完成資料整理。";
            const thankMsgEn = "Thank you for providing all the information. We've finished processing your data.";

            const waitingHtmlZh = '<p>感謝您提供完整資訊，請稍待片刻等待就診。另外在候位之餘想邀請您<a href="https://forms.gle/Ema6yXHhNHZ6dB6x6" target="_blank">點此</a>回饋您的使用體驗！</p>';
            const waitingHtmlEn = '<p>Thank you for providing all the information. Please wait while we arrange your consultation. Meanwhile, feel free to <a href="https://forms.gle/UrJjiA98sL4FzsKs9" target="_blank">leave feedback about your experience here</a>!</p>';

            const thankDisplay = selectedLang === "en" ? thankMsgEn : thankMsgZh;
            const waitingHtml   = selectedLang === "en" ? waitingHtmlEn : waitingHtmlZh;
            const shortReturn   = selectedLang === "en" ? "Thank you!" : "感謝您！";

            conversationHistory.push({ role: "assistant", message: thankDisplay });
            sendFinalMedicalReport(trimmedResponse);

            const inputArea = document.getElementById("input-area");
            inputArea.innerHTML = waitingHtml;

            return shortReturn;
        } else {
            conversationHistory.push({ role: "assistant", message: trimmedResponse });
            return trimmedResponse;
        }
    } catch (error) {
        console.error("錯誤：", error);
        const formattedReport = sendErrorReport(error);
        return formattedReport;
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

    const loadingMsgDiv = document.createElement("div");
    loadingMsgDiv.className = "assistant-message loading";
    // 正在輸入修改開始
    loadingMsgDiv.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    // 正在輸入修改結束
    // loadingMsgDiv.textContent = "正在輸入...";
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
        sendErrorReport(error);
        // 移除讀取訊息
        chatLog.removeChild(loadingMsgDiv);
        
        const errorMsgDiv = document.createElement("div");
        errorMsgDiv.className = "error-message";
        errorMsgDiv.textContent = `錯誤：${error.message}`;
        chatLog.appendChild(errorMsgDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const langScreen = document.getElementById("language-screen");
    const chatContainer = document.getElementById("chat-container");
    const btnZh = document.getElementById("btn-chinese");
    const btnEn = document.getElementById("btn-english");

    btnZh.addEventListener("click", async () => {
        selectedLang = "zh";
        langScreen.style.display = "none";
        chatContainer.style.display = "flex";
        await initializeChat("系統語言設定：僅使用正體中文（臺灣）回答。");
    });

    btnEn.addEventListener("click", async () => {
        selectedLang = "en";
        langScreen.style.display = "none";
        chatContainer.style.display = "flex";
        await initializeChat("Language setting: only answer with English");
    });
});

const userMessageInput = document.getElementById("userMessage");
userMessageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        document.getElementById("sendButton").click();
    }
});

function sendErrorReport(error) {
    const now = new Date();
    const timestamp = now.toLocaleString('zh-TW', { hour12: false });
    
    const historyText = conversationHistory
        .map((msg, idx) => `${idx + 1}. 【${msg.role === 'user' ? '使用者' : '助理'}】 ${msg.message}`)
        .join('\n');

    const reportContent = [
        '===== 錯誤回報 =====',
        `時間：${timestamp}`,
        `錯誤訊息：${error.message}`,
        '',
        '----- 完整對話歷史 -----',
        historyText,
        '====================='
    ].join('\n');

    const url = 'https://script.google.com/macros/s/AKfycbypoBJyxKh436VSYk_PFyaWoVuK-BuBezOCkxuhhm28GcR68jHwMyIHK7EG5Gge_SCfhQ/exec';
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ content: reportContent })
    })
    .then(res => res.text())
    .then(resText => {
        console.log('已回報錯誤：', resText);
    })
    .catch(reportError => {
        console.error('回報錯誤時發生問題：', reportError);
    });

    return reportContent;
}
