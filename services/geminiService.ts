
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category } from "../types";

// Added categories parameter to resolve categoryId to names for better AI context
export const getFinancialInsights = async (transactions: Transaction[], categories: Category[]) => {
  // Always use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fixed: Property 'category' does not exist on type 'Transaction'. 
  // Map categoryId to the actual category name for the AI prompt.
  const transactionsSummary = transactions.map(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    const categoryName = cat ? cat.name : 'Other';
    return `${t.date}: ${t.type} of $${t.amount} for ${categoryName} (${t.description})`;
  }).join('\n');

  const prompt = `
    Analyze the following transaction history and provide 3 actionable financial insights.
    Categorize them as "saving", "warning", or "tip".
    Keep descriptions concise and professional.
    
    Transactions:
    ${transactionsSummary}
  `;

  try {
    // Upgraded to gemini-3-pro-preview for complex reasoning task as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
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
                description: "Must be one of: saving, warning, tip"
              }
            },
            required: ["title", "content", "type"]
          }
        }
      }
    });

    // Access text property directly as per guidelines
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return [
      {
        title: "Manual Tip: Start Small",
        content: "Try to save at least 10% of your income this month for a rainy day fund.",
        type: "tip"
      }
    ];
  }
};
