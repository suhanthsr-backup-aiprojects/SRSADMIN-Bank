import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client with telemetry header
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
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

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Gemini Banking Assistant endpoint
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required." });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (e: any) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please ensure GEMINI_API_KEY is available.",
      });
    }

    const systemInstruction = `You are "Shristi" (सृष्टि), the friendly, highly knowledgeable, and polite AI Banking Assistant mascot for SRSADMIN Bank (एसआरएसएडमिन बैंक), a premier Indian scheduled commercial bank.
You assist retail NetBanking customers and branch CBS banking officers.

Rules:
1. Greet customers warmly with "Namaste" or friendly professional courtesy. Introduce yourself as Shristi when relevant.
2. Provide concise, clear, human, professional, and mathematically accurate financial advice and answers.
3. When answering about account balances, cards, or transactions, refer directly to the user's provided account context.
4. Keep answers easy to read on mobile and desktop: use clean bullet points, bold key figures, and avoid robotic jargon or repetitive boilerplate.
5. If asked about security (PIN, OTP, CVV), remind them securely that SRSADMIN Bank and Shristi will never ask for private credentials or one-time passwords.
6. Format currency in Indian Rupees (₹).`;

    const userContent = context
      ? `[CONTEXT DATA]\n${JSON.stringify(context, null, 2)}\n\n[USER QUERY]\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userContent,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm here to help with your SRSADMIN Bank accounts, cards, and transactions.";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to communicate with Gemini assistant.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SRSADMIN Bank Core Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
