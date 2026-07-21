import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function askAIPortfolioAgent(req: Request, res: Response) {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid question in the request body.",
      });
    }

    const cleanQuestion = question.trim();

    if (cleanQuestion.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Question is too long. Please limit your query to 1,000 characters.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "Gemini API is not configured on this server. Please set GEMINI_API_KEY in the Environment Variables.",
        isConfigError: true,
      });
    }

    const ai = getGeminiClient();

    console.log("Querying Gemini 3.5 Flash for Portfolio Agent response...");
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: cleanQuestion,
      config: {
        systemInstruction: `You are Natalia's professional AI Portfolio Agent. Natalia Jenkins is a highly skilled marketing, branding, and communications specialist.
Your goal is to answer questions about her career, skills, and projects in a friendly, professional, and helpful tone.
Keep responses concise, tailored to marketing and business communications, and invite the user to connect via her contact form.
If asked about topics completely unrelated to professional portfolios, marketing, or Natalia, politely guide the topic back to her work or general digital marketing.`,
      },
    });

    const reply = response.text;

    return res.status(200).json({
      success: true,
      answer: reply,
    });
  } catch (error: any) {
    console.error("Error in askAIPortfolioAgent:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while communicating with the AI service. Please try again later.",
    });
  }
}
