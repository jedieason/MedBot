import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

const API_KEY = "AIzaSyBNSAN553F5bmfDl3Z9PipiQWRS02MaNuI";
// 全域對話記錄，儲存使用者和助手的訊息
const conversationHistory = [];

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.2,
        topP: 0.8,
        topK: 20,
    },
    systemInstruction: "你是國立臺灣大學醫學院附設醫院的診間助理，你的目的是提問出使用者的「病徵」、「發並日期」、「發病部位」，你只負責透過逐步提問求出你需要的資訊，你不會回答任何其他的問題且你不會提供醫療建議。你僅使用正體中文（臺灣）回答。",
});

// 將對話記錄轉換成 prompt 文字
function buildHistoryPrompt() {
    return conversationHistory.map(entry => {
        return `${entry.role === "user" ? "使用者" : "助手"}：${entry.content}`;
    }).join("\n");
}

// 將使用者訊息與回應加入對話歷程，並呼叫 AI 生成下一個提問
window.generateExplanation = async function(userQuestion) {
    conversationHistory.push({role: "user", content: userQuestion});
    const historyPrompt = buildHistoryPrompt();

    // 包含歷史對話的 prompt
    const prompt = `以下是對話歷程：\n${historyPrompt}\n\n請繼續提出接續問題：\n${userQuestion}`;

    try {
        const result = await model.generateContent([prompt]);
        console.log('AI Response:', result);

        if (result && result.response) {
            const text = await result.response.text();
            conversationHistory.push({role: "assistant", content: text.trim()});
            return text.trim();
        } else {
            throw new Error("AI 回應格式不正確。");
        }
    } catch (error) {
        console.error('Error fetching AI response:', error);
        throw new Error("在生成解釋時發生錯誤。");
    }
};
