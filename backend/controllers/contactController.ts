import { Request, Response } from "express";
import { Contact } from "../models/Contact.js"; // Note: we can use relative imports
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini safely and lazily to avoid startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Quick helper to strip HTML tags to protect against Cross-Site Scripting (XSS)
function sanitizeInput(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export async function submitContactForm(req: Request, res: Response) {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Basic Server-side Validation & Type Checks
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, error: "Please provide a valid name." });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ success: false, error: "Please provide a valid email address." });
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ success: false, error: "Please provide a subject." });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "Please provide a message." });
    }

    // Length Constraints (protect against oversized payload attacks)
    if (name.length > 100) {
      return res.status(400).json({ success: false, error: "Name must be 100 characters or fewer." });
    }
    if (email.length > 254) {
      return res.status(400).json({ success: false, error: "Email address is too long." });
    }
    if (subject.length > 200) {
      return res.status(400).json({ success: false, error: "Subject must be 200 characters or fewer." });
    }
    if (message.length > 5000) {
      return res.status(400).json({ success: false, error: "Message must be 5000 characters or fewer." });
    }

    // 2. Input Sanitization & Formatting
    const cleanName = sanitizeInput(name.trim());
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = sanitizeInput(subject.trim());
    const cleanMessage = sanitizeInput(message.trim());

    // Email validation regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    // 3. Optional AI Enrichment with Gemini
    let aiMetadata = undefined;
    const ai = getGeminiClient();

    if (ai) {
      try {
        console.log("Analyzing message content with Gemini 3.5 Flash...");
        const prompt = `Analyze this contact form message sent to Natalia (a marketing and communications specialist) and generate metadata.
Sender Name: ${cleanName}
Sender Email: ${cleanEmail}
Subject: ${cleanSubject}
Message: ${cleanMessage}`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: `You are Natalia's professional AI assistant. Analyze incoming contact forms. Categorize the inquiry as 'Job Offer', 'Freelance Project', 'Networking', or 'General Inquiry'. Provide a 1-sentence executive summary. Draft a highly professional, polite, and context-appropriate reply starting with 'Dear [Name],' that Natalia can review and send. Do not include markdown or external references. Output your reply STRICTLY as a single JSON object.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: "Categorization of the message: 'Job Offer', 'Freelance Project', 'Networking', or 'General Inquiry'",
                },
                summary: {
                  type: Type.STRING,
                  description: "A concise 1-sentence summary of the message's content.",
                },
                suggestedReply: {
                  type: Type.STRING,
                  description: "A draft professional reply to send back to the user.",
                },
              },
              required: ["category", "summary", "suggestedReply"],
            },
          },
        });

        const jsonStr = aiResponse.text?.trim();
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          aiMetadata = {
            category: parsed.category,
            summary: parsed.summary,
            suggestedReply: parsed.suggestedReply,
            processedAt: new Date(),
          };
          console.log("Successfully enriched message with Gemini metadata.");
        }
      } catch (geminiError) {
        // Proceed even if Gemini fails so we never block user form submissions
        console.error("Gemini AI Enrichment failed (proceeding to save message regardless):", geminiError);
      }
    }

    // 4. Save to MongoDB via Mongoose
    const newContact = new Contact({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      submittedAt: new Date(),
      aiMetadata,
    });

    const savedDoc = await newContact.save();
    console.log(`Successfully saved contact submission in Mongoose. ID: ${savedDoc._id}`);

    return res.status(200).json({
      success: true,
      message: "Your message has been safely saved to Natalia's secure database! Thank you.",
      id: savedDoc._id,
      aiProcessed: !!aiMetadata,
    });
  } catch (error: any) {
    console.error("Error in submitContactForm controller:", error);
    
    // Check if it's a validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      error: "An error occurred while saving your message. Please try again later.",
    });
  }
}
