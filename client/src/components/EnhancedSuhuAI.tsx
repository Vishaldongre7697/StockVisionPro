import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bot, Send, Mic, User, RefreshCw, Trash2, 
  ChevronDown, ChevronUp, Info, PanelRightOpen, PanelRightClose,
  StarHalf, Sparkles, MessageSquare, Server, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useChat } from '@/hooks/useSuhuAI';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EnhancedSuhuAIProps {
  className?: string;
  initialMessages?: { id: string; sender: 'user' | 'ai'; text: string; timestamp: Date }[];
  showSidebar?: boolean;
}

const EnhancedSuhuAI = ({
  className,
  initialMessages,
  showSidebar = true
}: EnhancedSuhuAIProps) => {
  const { user, isAuthenticated } = useAuth();
  const { messages, isTyping, sendMessage, clearMessages } = useChat(initialMessages);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(showSidebar);
  const [activeTab, setActiveTab] = React.useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Check if API key is available
  const checkGeminiApiKey = () => {
    const hasApiKey = !!import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!hasApiKey) {
      toast({
        title: 'API Key Required',
        description: 'Gemini API key is needed for the AI assistant',
        variant: 'destructive',
      });
      
      // Here you would typically ask the user for the API key
      // We'd use ask_secrets utility in a real implementation
    }
    
    return hasApiKey;
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Check if API key is available
    if (!checkGeminiApiKey()) {
      return;
    }
    
    // Send message
    sendMessage(inputMessage);
    setInputMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format message text with line breaks and links
  const formatMessageText = (text: string) => {
    // Create an array of text elements with <br> tags between lines
    const lines = text.split('\n');
    
    // Create elements manually instead of using React.Fragment
    return (
      <div>
        {lines.map((line, i) => (
          // Use a <span> instead of React.Fragment to avoid issues
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Messages Area - ChatGPT style */}
      <div className="flex-1 overflow-y-auto py-4 px-2 md:px-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">How can I help you with investing today?</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-8">
              I can analyze stocks, explain market trends, or help with investment strategies. Just ask a question to get started.            
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
              {[
                "Explain the concept of dollar-cost averaging",
                "What stocks are trending this week?",
                "How do interest rates affect the market?",
                "What is a P/E ratio and why is it important?",
              ].map((prompt, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className="justify-start text-sm h-auto py-3 px-4 font-normal"
                  onClick={() => {
                    setInputMessage(prompt);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }}
                >
                  <MessageSquare className="h-3 w-3 mr-2 text-muted-foreground" />
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={cn(
                  "flex items-start gap-4 px-2",
                  message.sender === 'user' ? "justify-end md:justify-start" : "justify-start"
                )}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[90%] md:max-w-[75%] rounded-lg px-4 py-3",
                  message.sender === 'user' 
                    ? "bg-primary text-primary-foreground ml-auto md:ml-0" 
                    : "bg-muted"
                )}>
                  <div className="text-sm whitespace-pre-line">
                    {formatMessageText(message.text)}
                  </div>
                </div>
                
                {message.sender === 'user' && (
                  <div className="hidden md:flex w-8 h-8 rounded-full bg-secondary flex-center shrink-0 mt-0.5 items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-4 px-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-foreground/70 rounded-full animate-pulse delay-0"></span>
                    <span className="w-1.5 h-1.5 bg-foreground/70 rounded-full animate-pulse delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-foreground/70 rounded-full animate-pulse delay-300"></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Area - ChatGPT style */}
      <div className="p-4 border-t">
        <div className="max-w-3xl mx-auto relative">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message SuhuAI..."
              className="min-h-[50px] resize-none rounded-xl pr-12 py-3 pl-4 border-muted-foreground/20"
              rows={1}
            />
            <Button 
              size="icon" 
              className="absolute right-2 bottom-2 h-8 w-8 rounded-lg" 
              onClick={handleSendMessage}
              disabled={isTyping || !inputMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto px-2 py-1 text-xs"
                onClick={clearMessages}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear chat
              </Button>
              
              {showSidebar && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto px-2 py-1 text-xs"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  {isSidebarOpen ? (
                    <>
                      <PanelRightClose className="h-3 w-3 mr-1" />
                      Hide examples
                    </>
                  ) : (
                    <>
                      <PanelRightOpen className="h-3 w-3 mr-1" />
                      Show examples
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <span>SuhuAI is in preview mode</span>
          </div>
        </div>
      </div>
      
      {/* Sidebar (only shown when enabled) */}
      {showSidebar && isSidebarOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-72 md:w-80 bg-background border-l shadow-lg z-10 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Examples</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Try asking:
              </p>
              
              <div className="space-y-2">
                {[
                  "Explain the concept of dollar-cost averaging for beginners",
                  "What factors should I consider when building a diversified portfolio?",
                  "How do rising interest rates affect the stock market?",
                  "What are the key financial metrics to evaluate a growth stock?",
                  "What is the difference between active and passive investing?",
                ].map((prompt, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="w-full justify-start text-sm h-auto py-2 font-normal"
                    onClick={() => {
                      setInputMessage(prompt);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                      setIsSidebarOpen(false);
                    }}
                  >
                    <MessageSquare className="h-3 w-3 mr-2 text-muted-foreground" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center mb-2">
                <Server className="h-4 w-4 mr-2 text-primary" />
                <h3 className="text-sm font-medium">Capabilities</h3>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>Explains financial concepts and market mechanics</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>Helps analyze stocks and evaluate investment options</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>Provides portfolio insights and investment strategies</span>
                </li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 mr-2 text-destructive" />
                <h3 className="text-sm font-medium">Limitations</h3>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>Not a licensed financial advisor</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>Information should not be considered financial advice</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>Always do your own research before investing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSuhuAI;