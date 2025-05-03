import OpenAI from 'openai';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = 'gpt-4o';

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Note: In production, API calls should be proxied through a backend
});

/**
 * Get a chat completion from OpenAI
 */
export async function getChatCompletion(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
  try {
    if (!import.meta.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return 'I need an API key to provide intelligent responses. Please ask the administrator to configure an OpenAI API key.';
    }

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    return 'Sorry, I encountered an error while generating a response. Please try again later.';
  }
}

/**
 * Generate a financial advice response based on user input
 */
export async function getFinancialAdvice(userMessage: string, chatHistory: { role: string; content: string }[] = []) {
  // Prepare the system message with financial context
  const systemMessage = {
    role: 'system' as const,
    content: 'You are SuhuAI, an intelligent financial advisor with expertise in stocks, trading, and market analysis. ' +
      'Provide accurate, knowledgeable advice about financial markets, investment strategies, and trading concepts. ' +
      'Your responses should be informative, balanced, and educational. When discussing specific stocks, provide balanced analysis. ' +
      'Always remind users to do their own research and consult with financial professionals before making investment decisions.'
  };

  // Format chat history in OpenAI format
  const formattedHistory = chatHistory.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content
  }));

  // Add user's new message
  const messages = [
    systemMessage,
    ...formattedHistory,
    { role: 'user' as const, content: userMessage }
  ];

  return await getChatCompletion(messages);
}
