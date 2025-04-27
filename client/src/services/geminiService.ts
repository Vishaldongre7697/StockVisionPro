import { GoogleGenerativeAI } from '@google/generative-ai';

// API Configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Initialize the Gemini API
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Interface for chat messages
 */
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * Get response from Gemini for the chat
 * @param messages History of messages in the conversation
 * @param userStocks Array of stock symbols in user's portfolio for context
 * @returns Promise with the AI's response
 */
export const getChatResponse = async (
  messages: ChatMessage[],
  userStocks: string[] = []
): Promise<string> => {
  try {
    // Check if API key is available
    if (!genAI) {
      throw new Error('Gemini API key missing');
    }
    
    // Create a chat model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Format previous messages for the chat history
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
    
    // Create a chat session
    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Add context about user's stocks if available
    let context = '';
    if (userStocks.length > 0) {
      context = `User's stock portfolio includes: ${userStocks.join(', ')}. `;
    }
    
    // Enhanced system prompt for financial advice
    const systemPrompt = `
      You are Suhu AI, an expert financial advisor and stock market analyst. 
      ${context}
      Provide concise, accurate advice on investments, market trends, and financial planning.
      Base your recommendations on solid financial principles and market analysis.
      When discussing stocks, include relevant metrics and potential risks.
      Never guarantee returns or make promises about future performance.
      Use clear, professional language while remaining conversational and helpful.
    `;

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1].content;
    
    // Send the message with the system prompt included
    const result = await chat.sendMessage(`${systemPrompt}\n\nUser message: ${lastUserMessage}`);
    const response = result.response.text();
    
    return response;
  } catch (error) {
    console.error('Error getting chat response:', error);
    
    // If there's no API key, provide a more specific error
    if (!GEMINI_API_KEY) {
      return "I need a Gemini API key to provide intelligent responses. Please contact the administrator to set up the API key.";
    }
    
    return "I'm having trouble connecting to my AI services right now. Please try again later.";
  }
};

/**
 * Generate AI suggestions for a specific stock
 * @param symbol Stock symbol
 * @param stockData Additional data about the stock
 * @returns Promise with AI analysis and suggestion
 */
export const getStockAnalysis = async (symbol: string, stockData: any): Promise<{
  suggestion: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
  rationale: string;
  targetPrice?: number;
  stopLoss?: number;
  confidence: number;
  timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
}> => {
  try {
    if (!genAI) {
      throw new Error('Gemini API key missing');
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create a prompt for stock analysis
    const prompt = `
      As a financial analyst, provide a detailed analysis of ${symbol} stock.
      
      Here's the current data:
      - Current Price: $${stockData.currentPrice}
      - Previous Close: $${stockData.previousClose}
      - Change: ${stockData.change} (${stockData.changePercent}%)
      - 52 Week High: $${stockData.high52Week}
      - 52 Week Low: $${stockData.low52Week}
      - P/E Ratio: ${stockData.pe}
      - EPS: $${stockData.eps}
      - Volume: ${stockData.volume}
      
      Based on this data, please provide:
      1. A clear recommendation (BUY, SELL, HOLD, or WATCH)
      2. A target price (if applicable)
      3. A stop loss price (if applicable)
      4. Confidence level (0-100)
      5. Time horizon (SHORT_TERM, MEDIUM_TERM, or LONG_TERM)
      6. Brief rationale for your recommendation
      
      Format your response exactly as JSON: 
      {
        "suggestion": "BUY|SELL|HOLD|WATCH",
        "targetPrice": number or null,
        "stopLoss": number or null,
        "confidence": number (0-100),
        "timeframe": "SHORT_TERM|MEDIUM_TERM|LONG_TERM",
        "rationale": "brief explanation"
      }
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract the JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      suggestion: analysis.suggestion,
      rationale: analysis.rationale,
      targetPrice: analysis.targetPrice || undefined,
      stopLoss: analysis.stopLoss || undefined,
      confidence: analysis.confidence,
      timeframe: analysis.timeframe,
    };
  } catch (error) {
    console.error('Error generating stock analysis:', error);
    
    // Return an error status instead of mocked data
    throw new Error('Unable to generate stock analysis. Please check API key and try again.');
  }
};