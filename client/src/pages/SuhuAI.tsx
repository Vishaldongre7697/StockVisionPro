import React from 'react';
import EnhancedSuhuAI from '@/components/EnhancedSuhuAI';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, AlertCircle } from 'lucide-react';

const SuhuAI = () => {
  const { toast } = useToast();

  // Check if Gemini API key is available
  const hasGeminiApiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  const handleRequestApiKey = () => {
    toast({
      title: 'API Key Required',
      description: 'Please contact the administrator to set up the Gemini API key for the AI assistant.',
      variant: 'destructive',
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Info banner about API key */}
      {!hasGeminiApiKey && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 mb-1">
                Gemini API Key Required
              </h3>
              <p className="text-sm text-amber-700 mb-2">
                Suhu AI uses Google's Gemini AI model for intelligent responses. To enable this feature, 
                a Gemini API key is required.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={handleRequestApiKey}
              >
                Request API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Suhu AI component */}
      <div className="flex-1">
        <EnhancedSuhuAI className="h-full" />
      </div>
      
      {/* Information about limitations */}
      <Card className="border-muted-foreground/20">
        <CardContent className="p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-4 w-4 text-muted-foreground/70" />
            <span className="font-medium">Important note:</span>
          </div>
          <p>
            Suhu AI is a financial assistant powered by AI. While it provides information and insights, 
            it is not a substitute for professional financial advice. Always conduct your own research 
            and consult with a qualified financial advisor before making investment decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuhuAI;