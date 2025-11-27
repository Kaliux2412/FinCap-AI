
import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";
import { FinancialContext, Language, Transaction } from "../types";
import { formatCurrency, addTransaction } from "./mockFirebaseService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

// Tool Definition for creating transactions
const createTransactionTool: FunctionDeclaration = {
  name: "createTransaction",
  description: "Creates a new financial record (income or expense) in the database. Use this when the user explicitly asks to save, add, or register a transaction.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description: "The description of the transaction (e.g., 'Office Rent', 'Client Payment')."
      },
      amount: {
        type: Type.NUMBER,
        description: "The numeric amount of the transaction."
      },
      type: {
        type: Type.STRING,
        enum: ["income", "expense"],
        description: "Whether it is an income or an expense."
      },
      category: {
        type: Type.STRING,
        description: "Category name of the transaction (e.g., 'Marketing', 'Payroll', 'Sales')."
      },
      date: {
        type: Type.STRING,
        description: "Date of the transaction in YYYY-MM-DD format. If not specified, use today's date (2025-11-18)."
      }
    },
    required: ["description", "amount", "type"]
  }
};

const tools: Tool[] = [{ functionDeclarations: [createTransactionTool] }];

const createSystemInstruction = (context: FinancialContext, lang: Language): string => {
  const locale = lang === 'es' ? 'es-MX' : 'en-US';
  
  const recentTxStr = context.recentTransactions
    .slice(0, 15)
    .map(t => `- ${t.date}: ${t.description} (${t.type}) ${formatCurrency(t.amount, locale)} [${t.category?.name || 'Uncategorized'}]`)
    .join('\n');

  const upcomingStr = context.upcomingExpenses
    .map(t => `- ${t.nextDueDate || t.date}: ${t.description} (${formatCurrency(t.amount, locale)})`)
    .join('\n');

  const langInstruction = lang === 'es' 
    ? "RESPOND ONLY IN SPANISH (Mexican Spanish context)." 
    : "RESPOND IN ENGLISH.";

  return `
    ${langInstruction}
    You are FinCap AI, an expert CFO assistant for the startup "${context.companyName}".
    User: ${context.user.displayName} (${context.user.email}).
    
    IMPORTANT DATE CONTEXT:
    Today is **November 18, 2025**. 
    All analysis must be relative to this date.
    
    DATABASE CONTEXT (as of Nov 18, 2025):
    - Cash on Hand: ${formatCurrency(context.currentCash, locale)}
    - Monthly Burn: ${formatCurrency(context.monthlyBurn, locale)}
    - Runway: ${context.runwayMonths.toFixed(1)} months
    - Safe to Spend: ${formatCurrency(context.safeToSpend, locale)}
    
    UPCOMING BILLS (Next 10 days):
    ${upcomingStr}

    RECENT TRANSACTIONS (Database):
    ${recentTxStr}

    GOALS:
    1. Analyze spending patterns based on the transactions provided above.
    2. If the user asks about a specific document they uploaded, refer to the transactions that were extracted from it (look at the recent transactions list).
    3. Give strategic advice on how to extend runway considering we are in late 2025.
    4. **ACTIVE DATABASE MODIFICATION**: You have the ability to modify the database. If the user asks to "add", "register", "create", or "save" an income or expense, you MUST use the 'createTransaction' tool immediately. Do not ask for confirmation if the user provided description and amount.
  `;
};

export const sendMessageToGemini = async (
  message: string,
  financialContext: FinancialContext,
  lang: Language
): Promise<{ text: string; dataChanged: boolean }> => {
  try {
    const systemInstruction = createSystemInstruction(financialContext, lang);
    let dataChanged = false;

    // 1. First call to model (checking if tool is needed)
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        tools: tools,
      },
    });

    // 2. Check for function calls
    const functionCalls = response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]; // Handle single call for simplicity
      
      if (call.name === 'createTransaction') {
        const args = call.args as any;
        
        // Execute the actual database update
        await addTransaction({
          description: args.description,
          amount: args.amount,
          type: args.type,
          category: args.category || 'General',
          date: args.date || '2025-11-18',
          expenseType: 'variable' // Default
        });

        dataChanged = true;

        // 3. Send the result back to the model to get the final text response
        const resultPart = {
          functionResponse: {
            name: 'createTransaction',
            response: { 
                result: "Success", 
                message: `Transaction '${args.description}' of ${args.amount} saved successfully.` 
            },
            id: call.id // Important for SDK to match call/response
          }
        };

        const finalResponse = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: [
            { role: 'user', parts: [{ text: message }] },
            response.candidates![0].content, // The model's decision to call function
            { role: 'tool', parts: [resultPart] } // The function result
          ],
          config: {
             systemInstruction: systemInstruction 
          }
        });

        return { text: finalResponse.text || "Transaction created.", dataChanged };
      }
    }

    return { text: response.text || "No response.", dataChanged };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
        text: lang === 'es' 
            ? "Error conectando con el motor financiero." 
            : "Error connecting to financial engine.",
        dataChanged: false 
    };
  }
};

export const analyzeFinancialDocument = async (
  base64Data: string, 
  mimeType: string
): Promise<Partial<Transaction>[]> => {
  try {
    const prompt = `
      Analyze this financial document (bank statement, invoice, or receipt).
      Extract all individual transactions found.
      
      Rules:
      1. Use the document's date for the transaction. 
      2. If year is missing, assume 2025.
      3. Ensure Amount is a pure number (no currency symbols).
      4. Determine if it is 'income' or 'expense' based on context (credit/debit columns).
      5. Assign a short, clear Category Name.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "YYYY-MM-DD" },
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  type: { type: Type.STRING, description: "income or expense" },
                  category: { type: Type.STRING }
                },
                required: ["date", "description", "amount", "type", "category"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error", e);
      return [];
    }

    if (result.transactions && Array.isArray(result.transactions)) {
        // Sanitize data
        return result.transactions.map((t: any) => {
            let cleanAmount = t.amount;
            if (typeof t.amount === 'string') {
                cleanAmount = parseFloat(t.amount.replace(/[^0-9.-]+/g,""));
            }

            let cleanType = 'expense';
            if (t.type && t.type.toLowerCase().includes('income')) cleanType = 'income';
            if (t.type && t.type.toLowerCase().includes('deposit')) cleanType = 'income';
            if (t.type && t.type.toLowerCase().includes('credit')) cleanType = 'income';

            return {
                ...t,
                amount: cleanAmount,
                type: cleanType,
                date: t.date || '2025-11-18'
            };
        }).filter((t: any) => !isNaN(t.amount) && t.amount > 0);
    }
    
    return [];
  } catch (error) {
    console.error("PDF Analysis Error:", error);
    return []; 
  }
};
