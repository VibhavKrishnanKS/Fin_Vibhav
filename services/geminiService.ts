
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category } from "../types";

export const getFinancialInsights = async (transactions: Transaction[], categories: Category[]) => {
  // Always initialize right before use with the current process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const transactionsSummary = transactions.slice(0, 50).map(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    const categoryName = cat ? cat.name : 'Other';
    return `${t.date}: ${t.type} of ₹${t.amount} for ${categoryName} (${t.description})`;
  }).join('\n');

  const prompt = `
    Analyze this financial ledger:
    ${transactionsSummary}

    Generate 3 professional financial insights for a high-net-worth individual.
    Categories: "saving", "warning", or "tip".
    Return ONLY a JSON array.
  `;

  try {
    // Fix: Added thinkingBudget for complex financial reasoning with gemini-3-pro-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              type: { 
                type: Type.STRING,
                description: "Must be saving, warning, or tip"
              }
            },
            required: ["title", "content", "type"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Insight Engine Error:", error);
    // Graceful fallback for demo purposes
    return [
      {
        title: "Capital Preservation",
        content: "Maintain a liquid reserve of 15% to capitalize on market volatility.",
        type: "tip"
      }
    ];
  }
};
