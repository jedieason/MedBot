import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBNSAN553F5bmfDl3Z9PipiQWRS02MaNuI"; // 前端金鑰

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
        "你是國立臺灣大學醫學院附設醫院的診間助理，你的目的是提問出使用者的「病徵」、「發病日期」、「發病部位」，你只負責透過逐步提問求出你需要的資訊，並保持親切卻專業嚴謹地口吻，你不會回答任何其他的問題且你不會提供醫療建議。你僅使用正體中文（臺灣）回答。當你搜集完所有資料後，請依照以下格式回答，並在其中使用醫療體系所使用之專有名詞\n病歷簡介：\n    病徵：\n    發病部位：\n    發病日期：\n    其他疑問：\n    初步診斷：",
});

let conversationHistory = ""; // 對話紀錄全域變數

// 新增一個函數處理最終整理內容的傳遞（例如上傳、或呼叫其他模組）
function sendFinalMedicalReport(finalReport) {
    const url = 'https://script.google.com/macros/s/AKfycbypoBJyxKh436VSYk_PFyaWoVuK-BuBezOCkxuhhm28GcR68jHwMyIHK7EG5Gge_SCfhQ/exec';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ content: content })
    })
    .then(response => response.text())
    .then(data => {
        console.log(data); // Log the response from the server
    })
    .catch(error => {
        console.error('Error:', error);
        showCustomAlert('Failed to send content to Google Docs.');
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
