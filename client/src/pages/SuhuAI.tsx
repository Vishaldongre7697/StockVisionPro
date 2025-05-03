import React from 'react';
import EnhancedSuhuAI from '@/components/EnhancedSuhuAI';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bot } from 'lucide-react';

const SuhuAI = () => {
  const { toast } = useToast();

  // Check if Gemini API key is available
  const hasGeminiApiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  const handleRequestApiKey = () => {
    toast({
      title: 'API Key Required',
      description: 'Please contact the administrator to set up the API key for the AI assistant.',
      variant: 'destructive',
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Simple header */}
      <div className="border-b p-4 flex items-center justify-center shadow-sm bg-background">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">SuhuAI Chat</h1>
        </div>
      </div>

      {/* API key alert - only shown when needed */}
      {!hasGeminiApiKey && (
        <div className="px-4 pt-4">
          <Alert className="border-amber-200 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>
                SuhuAI needs an API key to generate intelligent responses about stocks and financial information.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={handleRequestApiKey}
              >
                Request API Key
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main chat component */}
      <div className="flex-1 overflow-hidden">
        <EnhancedSuhuAI className="h-full" showSidebar={false} />
      </div>
      
      {/* Minimal disclaimer at bottom */}
      <div className="border-t p-2 text-xs text-center text-muted-foreground">
        SuhuAI provides information only. Not financial advice. Always consult a professional advisor.
      </div>
    </div>
  );
};

export default SuhuAI;