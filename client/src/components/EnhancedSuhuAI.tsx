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
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to use Suhu AI',
        variant: 'destructive',
      });
      return;
    }
    
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
    // Replace line breaks with <br> tags
    const withLineBreaks = text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
    
    return <div>{withLineBreaks}</div>;
  };

  return (
    <div className={cn("h-full flex overflow-hidden rounded-lg border", className)}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <CardHeader className="pb-3 pt-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="/ai-avatar.png" alt="Suhu AI" />
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">Suhu AI</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Your intelligent financial advisor and market analyst
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <Separator />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex items-start gap-3",
                message.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={cn(
                "max-w-[80%] rounded-lg px-4 py-3",
                message.sender === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-xs">
                    {message.sender === 'user' ? 'You' : 'Suhu AI'}
                  </span>
                  <span className="text-xs opacity-70">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-line">
                  {formatMessageText(message.text)}
                </div>
              </div>
              
              {message.sender === 'user' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <CardFooter className="p-4 border-t">
          <div className="flex w-full gap-2">
            <Button variant="outline" size="icon" className="shrink-0">
              <Mic className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Suhu AI about market trends, stocks, or investment strategies..."
                className="min-h-[40px] resize-none pr-12"
                rows={1}
              />
              <Button 
                size="sm" 
                className="absolute right-2 bottom-2" 
                onClick={handleSendMessage}
                disabled={isTyping || !inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0"
              onClick={clearMessages}
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </div>
      
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-80 border-l flex flex-col">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b">
              <TabsList className="w-full justify-start p-0 h-auto bg-transparent rounded-none">
                <TabsTrigger 
                  value="chat" 
                  className={cn(
                    "rounded-none flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary",
                    "data-[state=active]:shadow-none"
                  )}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="features" 
                  className={cn(
                    "rounded-none flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary",
                    "data-[state=active]:shadow-none"
                  )}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Features
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="chat" className="flex-1 p-0 m-0">
              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Suggested prompts to try:
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
                      }}
                    >
                      <MessageSquare className="h-3 w-3 mr-2 text-muted-foreground" />
                      {prompt}
                    </Button>
                  ))}
                </div>
                
                <Separator />
                
                <div className="rounded-lg bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center">
                    <StarHalf className="h-4 w-4 mr-2 text-primary" />
                    <h3 className="text-sm font-medium">Pro Tips</h3>
                  </div>
                  <ul className="text-xs space-y-1 text-muted-foreground pl-6 list-disc">
                    <li>For personalized advice, ask about specific stocks in your portfolio</li>
                    <li>Provide context such as your investment timeline and risk tolerance</li>
                    <li>Ask for explanations of complex financial concepts</li>
                    <li>Request comparisons between different investment strategies</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="flex-1 p-0 m-0">
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center">
                    <Info className="h-4 w-4 mr-2 text-primary" />
                    About Suhu AI
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Suhu AI is your intelligent financial advisor powered by Google's Gemini large language model. It provides personalized insights, market analysis, and investment guidance.
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center">
                    <Server className="h-4 w-4 mr-2 text-primary" />
                    Capabilities
                  </h3>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li className="flex">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0">
                        <HelpCircle className="h-3 w-3 text-primary" />
                      </div>
                      <span>Explains financial concepts and market mechanics</span>
                    </li>
                    <li className="flex">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0">
                        <ChevronDown className="h-3 w-3 text-primary" />
                      </div>
                      <span>Helps analyze stocks and evaluate investment options</span>
                    </li>
                    <li className="flex">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0">
                        <ChevronUp className="h-3 w-3 text-primary" />
                      </div>
                      <span>Provides personalized portfolio advice and risk assessment</span>
                    </li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="rounded-lg bg-destructive/5 p-3 space-y-2">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-destructive" />
                    <h3 className="text-sm font-medium">Limitations</h3>
                  </div>
                  <ul className="text-xs space-y-1 text-muted-foreground pl-6 list-disc">
                    <li>Suhu AI is not a licensed financial advisor</li>
                    <li>Information should not be considered financial advice</li>
                    <li>Always conduct your own research before making investments</li>
                    <li>Responses are based on generalized market knowledge</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default EnhancedSuhuAI;