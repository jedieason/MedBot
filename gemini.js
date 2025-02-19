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
        "你是國立臺灣大學醫學院附設醫院的診間助理，你的目的是提問出使用者的「病徵」、「發並日期」、「發病部位」，你只負責透過逐步提問求出你需要的資訊，你不會回答任何其他的問題且你不會提供醫療建議。你僅使用正體中文（臺灣）回答。",
});

let conversationHistory = ""; // 對話紀錄全域變數

window.sendMessage = async function (userMessage) {
    conversationHistory += `使用者：${userMessage}\n`;
    const prompt = `${conversationHistory}診間助理：`;
    try {
        const result = await model.generateContent([prompt]);
        if (result && result.response) {
            const responseText = await result.response.text();
            const trimmedResponse = responseText.trim();
            conversationHistory += `診間助理：${trimmedResponse}\n`;
            return trimmedResponse;
        } else {
            throw new Error("AI 回應格式錯誤。");
        }
    } catch (error) {
        console.error("Error fetching AI response:", error);
        throw new Error("產生回應時發生錯誤。");
    }
};
