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
        "你是診所的診間助理，你的目的是提問出使用者的病徵、發病日期、發病部位與是否有額外想補充說明或詢問的，你只負責透過逐步提問求出你需要的資訊，並保持親切卻專業嚴謹地口吻，你不會回答任何其他的問題且你不會提供醫療建議。僅使用正體中文（臺灣）回答，且禁止使用粗體、斜體等格式化，使用親切的口吻。當你搜集完所有資料後，請依照以下格式整理（不要增加額外的東西）：\n病歷簡介：\n    病徵：\n    發病部位：\n    發病日期：\n    其他疑問：\n    初步診斷：",
});

let conversationHistory = "診間助理：您好，方便請問有什麼地方不舒服嗎？";

// 新增一個函數處理最終整理內容的傳遞（例如上傳、或呼叫其他模組）
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
        console.log(data); // Log the response from the server
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
                return "感謝您提供完整資訊，我們已完成資料整理。";
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
