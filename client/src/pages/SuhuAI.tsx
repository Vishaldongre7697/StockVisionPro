import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Send, User, Bot } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const SuhuAI = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am SuhuAI, your personal trading assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample responses for demo purposes
  const sampleResponses = [
    "Based on the latest market data, Nifty 50 shows bullish momentum with strong support at 22,340. The RSI is neutral at 56, indicating room for further upward movement.",
    "I've analyzed Reliance Industries for you. The stock is currently showing positive momentum with consistent buying from FIIs. With a P/E ratio of 22.4, it's fairly valued compared to sector peers.",
    "For intraday trading, you might want to consider IT stocks today. TCS and Infosys are showing strong technical patterns with increased volume activity.",
    "Looking at your portfolio, your exposure to banking stocks is quite high (42%). I'd recommend diversifying into other sectors like pharma or FMCG for better risk management.",
    "Today's market sentiment is cautious ahead of the US Fed meeting. It's advisable to avoid taking large positions until the policy announcement."
  ];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    
    // Simulate API delay
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * sampleResponses.length);
      const aiResponse = sampleResponses[randomIndex];
      
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: aiResponse,
          timestamp: new Date()
        }
      ]);
      
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // If not authenticated, show toast
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to chat with SuhuAI",
        variant: "destructive"
      });
      return;
    }

    // Add user message
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputMessage('');
    
    // Simulate AI response
    simulateAIResponse(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-auto px-2">
        <div className="space-y-4 py-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`flex max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <div className="mr-2 mt-1">
                  {message.sender === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="text-sm">{message.text}</div>
                  <div className="text-xs text-right mt-1 opacity-70">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <div className="typing-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <Card className="mt-auto">
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <Button variant="outline" size="icon">
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Ask SuhuAI anything about trading..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-center mt-2 text-muted-foreground">
            SuhuAI can analyze markets, suggest trades, and explain concepts
          </div>
        </CardContent>
      </Card>
      
      <style>
        {`
        .typing-animation {
          display: flex;
          align-items: center;
          column-gap: 3px;
        }
        
        .typing-animation span {
          height: 8px;
          width: 8px;
          background-color: #555;
          border-radius: 50%;
          display: block;
          opacity: 0.4;
        }
        
        .typing-animation span:nth-child(1) {
          animation: pulse 1s infinite 0.1s;
        }
        
        .typing-animation span:nth-child(2) {
          animation: pulse 1s infinite 0.3s;
        }
        
        .typing-animation span:nth-child(3) {
          animation: pulse 1s infinite 0.5s;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        `}
      </style>
    </div>
  );
};

export default SuhuAI;