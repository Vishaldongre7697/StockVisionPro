import { useQuery } from "@tanstack/react-query";
import { AiSuggestion, Stock, SuggestionType } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Cpu, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIndianCurrency } from "@/lib/stockData";
import { cn } from "@/lib/utils";

type SuggestionWithStock = AiSuggestion & {
  stock?: Stock;
};

const AISuggestions = () => {
  const { data: suggestions, isLoading } = useQuery<SuggestionWithStock[]>({
    queryKey: ['/api/ai-suggestions/top'],
  });

  if (isLoading || !suggestions) {
    return <AISuggestionsSkeleton />;
  }

  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-neutral-900">AI Suggestions</h2>
        <button className="text-blue-500 text-sm font-medium">View All</button>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary px-4 py-3">
          <div className="flex items-center">
            <span className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
              <Cpu className="h-4 w-4 text-primary" />
            </span>
            <h3 className="text-white font-medium">Suhu AI's Top Picks</h3>
            <span className="ml-auto ai-pulse bg-white text-primary text-xs px-2 py-0.5 rounded-full">LIVE</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-neutral-500 mb-3">
            Based on institutional activity, volume analysis, and market patterns
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {suggestions.map((suggestion) => {
              if (!suggestion.stock) return null;
              
              let Icon = Eye;
              let iconColor = "text-neutral-500";
              let borderColor = "border-neutral-300";
              
              if (suggestion.suggestion === SuggestionType.BUY) {
                Icon = TrendingUp;
                iconColor = "text-green-500";
                borderColor = "border-green-500";
              } else if (suggestion.suggestion === SuggestionType.SELL) {
                Icon = TrendingDown;
                iconColor = "text-red-500";
                borderColor = "border-red-500";
              }
              
              return (
                <div key={suggestion.id} className={cn("border rounded-lg p-3", borderColor)}>
                  <div className="flex items-center mb-2">
                    <span className={iconColor}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-medium ml-2">
                      {suggestion.suggestion}: {suggestion.stock.name}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-neutral-500">Current:</span>
                      <span className="font-mono">{formatIndianCurrency(suggestion.stock.currentPrice)}</span>
                    </div>
                    
                    {suggestion.targetPrice && (
                      <div className="flex justify-between mb-1">
                        <span className="text-neutral-500">
                          {suggestion.suggestion === SuggestionType.SELL ? "Target:" : "Target:"}
                        </span>
                        <span className={cn(
                          "font-mono",
                          suggestion.suggestion === SuggestionType.BUY 
                            ? "text-green-500" 
                            : suggestion.suggestion === SuggestionType.SELL 
                              ? "text-red-500" 
                              : ""
                        )}>
                          {formatIndianCurrency(suggestion.targetPrice)}
                        </span>
                      </div>
                    )}
                    
                    {suggestion.stopLoss && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Stop Loss:</span>
                        <span className={cn(
                          "font-mono",
                          suggestion.suggestion === SuggestionType.BUY 
                            ? "text-red-500" 
                            : suggestion.suggestion === SuggestionType.SELL 
                              ? "text-green-500" 
                              : ""
                        )}>
                          {formatIndianCurrency(suggestion.stopLoss)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs flex justify-between items-center">
                    <span className={cn(
                      "px-2 py-1 rounded-full",
                      suggestion.suggestion === SuggestionType.BUY 
                        ? "bg-green-100 text-green-500" 
                        : suggestion.suggestion === SuggestionType.SELL 
                          ? "bg-red-100 text-red-500" 
                          : "bg-neutral-200 text-neutral-600"
                    )}>
                      Confidence: {suggestion.confidence}%
                    </span>
                    <button className="text-blue-500">Details</button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

const AISuggestionsSkeleton = () => {
  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary px-4 py-3">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full mr-3" />
            <Skeleton className="h-5 w-32" />
            <div className="ml-auto">
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-full mb-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="border rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default AISuggestions;
