import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getTripInsights(destination: string, startDate: string, endDate: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide travel insights for a trip to ${destination} from ${startDate} to ${endDate}. Include top 3 must-visit spots, local food recommendations, and a brief weather expectation. Format as a concise markdown list.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error getting trip insights:", error);
    return "Could not load AI insights at this time.";
  }
}

export async function generateItinerarySuggestion(destination: string, days: number) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a ${days}-day itinerary for ${destination}. For each day, provide 2 activities. Format as JSON with an array of objects containing 'day', 'activity', and 'description'.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error generating itinerary:", error);
    return [];
  }
}

export async function chatWithAI(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are a helpful travel assistant for Afar Tourism (Arhot Aba). You know about Danakil Depression, Erta Ale, Dallol, and Afar culture. Be polite and informative. Keep responses concise and newspaper-themed if possible.",
      },
      history: history
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error in AI chat:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
}
