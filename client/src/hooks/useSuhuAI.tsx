import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getChatResponse, ChatMessage, getStockAnalysis } from '../services/geminiService';
import { useAuth } from '@/lib/auth';

interface UseChatReturn {
  messages: {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
  }[];
  isTyping: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

interface UseStockAnalysisReturn {
  analysis: {
    suggestion: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
    rationale: string;
    targetPrice?: number;
    stopLoss?: number;
    confidence: number;
    timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  } | null;
  loading: boolean;
  error: string | null;
  getAnalysis: (symbol: string, stockData: any) => Promise<void>;
}

/**
 * Custom hook for Suhu AI chat functionality
 */
export const useChat = (
  initialMessages: { id: string; sender: 'user' | 'ai'; text: string; timestamp: Date }[] = []
): UseChatReturn => {
  const [messages, setMessages] = useState<{
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
  }[]>(initialMessages.length > 0 
    ? initialMessages 
    : [{
        id: 'welcome',
        sender: 'ai',
        text: 'Hello! I am SuhuAI, your personal trading assistant. How can I help you today?',
        timestamp: new Date()
      }]
  );
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Send message to the AI and get a response
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;
    
    // Add user message to the chat
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user' as const,
      text: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    try {
      // Format messages for the AI service
      const formattedMessages: ChatMessage[] = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: msg.text
      }));
      
      // Add current message
      formattedMessages.push({
        role: 'user',
        content: messageText
      });
      
      // Get user's stock symbols if we have a user (for context)
      let userStocks: string[] = [];
      if (user?.id) {
        // Normally we'd fetch this from the API but for now we'll leave it empty
        // You could add API call to get user's portfolio here
      }
      
      // Get response from the AI
      const response = await getChatResponse(formattedMessages, userStocks);
      
      // Add AI response to the chat
      const aiMessage = {
        id: Date.now().toString(),
        sender: 'ai' as const,
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to get a response from the AI.',
        variant: 'destructive'
      });
      
      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        sender: 'ai' as const,
        text: 'I apologize, but I encountered an issue processing your request. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, toast, user]);
  
  // Clear all messages except the welcome message
  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      sender: 'ai' as const,
      text: 'Hello! I am SuhuAI, your personal trading assistant. How can I help you today?',
      timestamp: new Date()
    }]);
  }, []);
  
  return { messages, isTyping, sendMessage, clearMessages };
};

/**
 * Custom hook for getting AI stock analysis
 */
export const useStockAnalysis = (): UseStockAnalysisReturn => {
  const [analysis, setAnalysis] = useState<{
    suggestion: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
    rationale: string;
    targetPrice?: number;
    stopLoss?: number;
    confidence: number;
    timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const getAnalysis = useCallback(async (symbol: string, stockData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getStockAnalysis(symbol, stockData);
      setAnalysis(result);
    } catch (err: any) {
      setError('Failed to generate AI analysis');
      console.error(err);
      toast({
        title: 'Analysis Error',
        description: 'Could not generate AI analysis for this stock.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  return { analysis, loading, error, getAnalysis };
};