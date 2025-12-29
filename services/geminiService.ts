
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getReflectionMessage = async (dayIndex: number, completedTasksCount: number, stateCounts: Record<string, number>) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, supportive, and elegant reflection message for a user finishing day ${dayIndex + 1} of their "Twelve Days of Christmas" intentionality journey. They completed ${completedTasksCount} tasks and used modes like ${JSON.stringify(stateCounts)}. Keep the tone bird or carol-inspired, subtle, and poetic. Max 2 sentences.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "May your intentional rest bring peace to the coming dawn.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "A quiet end to a meaningful verse. Sleep well.";
  }
};

export const getDriftReminder = async (mode: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user has drifted away from their ${mode} session. Generate a gentle, carol-inspired nudge to return to their task. Phrasing should be soft like "Chirp... this song isn't finished yet". Max 15 words.`,
      config: {
        temperature: 0.8,
      }
    });
    return response.text || "This verse awaits its ending. Shall we return?";
  } catch (error) {
    return "Chirp... your focus is wandering. Shall we return to the song?";
  }
};
