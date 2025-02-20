import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBNSAN553F5bmfDl3Z9PipiQWRS02MaNuI";

// 初始化 Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.2,
        topP: 0.8,
        topK: 20,
    },
    systemInstruction:
        "你是診所的診間助理，你的目的是透過LPQQOPERA問診方法（位置、性質、程度/強度、起始時間、誘因與緩解因素、症狀變化、相關個人與家族病史）提問出使用者的疾病相關資訊，並詢問是否有想補充說明的，你只負責透過逐步提問求出你需要的資訊（要分次提問不要一次全部問在同一個問題），並保持親切卻專業嚴謹地口吻，不用每次都從您好開頭，直接提出您的問題即可，你不會回答任何其他的問題且你不會提供醫療建議。僅使用正體中文（臺灣）回答，且禁止使用粗體、斜體等格式化，使用親切的口吻。當你搜集完所有資料後，請依照以下格式整理（不要增加額外的東西，提供你認為的初步診斷）：\n病歷簡介：\n    候位號碼：\n    姓名：\n    病徵：\n    發病部位：\n    發病日期：\n    症狀性質：\n    症狀程度：\n    誘因與緩解因素：\n    症狀變化：\n    相關症狀：\n    相關個人與家族病史：\n    其他疑問：\n    初步診斷：\n",
});

let conversationHistory = "診間助理：您好，方便請問您的候位號碼與姓名嗎？";

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
    conversationHistory += `使用者：${userMessage}\n`;
    const prompt = `${conversationHistory}診間助理：`;
    try {
        const result = await model.generateContent([prompt]);
        if (result && result.response) {
            const responseText = await result.response.text();
            const trimmedResponse = responseText.trim();

            // 假如回應中包含「病歷簡介：」，則視為已收集完所有資料，
            // 此時對話框僅回覆感謝訊息，並將最終整理內容傳遞給後端處理
            if (trimmedResponse.includes("病歷簡介：")) {
                sendFinalMedicalReport(trimmedResponse);
                conversationHistory += "診間助理：感謝您提供完整資訊，我們已完成資料整理。\n";
                const inputArea = document.getElementById("input-area");
                inputArea.innerHTML = '感謝您提供完整資訊，請稍待片刻等待就診。另外在候位之餘想邀請您<a href="http://www.example.com" target="_blank">點此</a>回饋您的使用體驗！';
                return "感謝您！";
            } else {
                conversationHistory += `診間助理：${trimmedResponse}\n`;
                return trimmedResponse;
            }
        } else {
            throw new Error("AI 回應格式錯誤。");
        }
    } catch (error) {
        console.error("Error fetching AI response:", error);
        throw new Error("產生回應時發生錯誤。");
    }
};
