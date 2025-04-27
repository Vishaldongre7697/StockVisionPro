import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMarketSummary } from '@/services/marketDataService';

export interface MarketSummaryProps {
  showRefreshButton?: boolean;
  compactView?: boolean;
  className?: string;
}

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

/**
 * Market Summary Component that displays key market indices with live data
 */
export default function MarketSummary({
  showRefreshButton = false,
  compactView = false,
  className
}: MarketSummaryProps) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Fetch market summary data
  const fetchMarketData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getMarketSummary();
      
      // Transform API data to match our MarketIndex interface
      const transformedData: MarketIndex[] = data.map((item: any) => ({
        name: item.name,
        symbol: item.symbol,
        value: item.price || 0,
        change: item.change || 0,
        changePercent: item.changePercent || 0
      }));
      
      setIndices(transformedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching market summary:', err);
      setError('Could not load market data. Please check your API key settings and try again.');
      
      // Clear indices instead of using fallback data
      setIndices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial data fetch
  useEffect(() => {
    fetchMarketData();
    
    // Optional: Set up automatic refresh (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchMarketData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchMarketData]);
  
  // Format time for last updated
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn("pb-2", compactView && "py-2")}>
        <div className="flex justify-between items-center">
          <CardTitle className={cn("font-bold", compactView ? "text-base" : "text-lg")}>
            Market Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            {showRefreshButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={fetchMarketData}
                disabled={isLoading}
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  isLoading && "animate-spin"
                )} />
              </Button>
            )}
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {new Date().toLocaleDateString('en-US', { 
                weekday: compactView ? undefined : 'short', 
                day: 'numeric', 
                month: compactView ? 'numeric' : 'short',
                year: compactView ? undefined : 'numeric' 
              })}
            </Badge>
          </div>
        </div>
        {!compactView && (
          <CardDescription className="text-sm mt-1">
            Last updated: {formatTime(lastUpdated)}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="rounded-md bg-amber-500/10 p-3 mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className={cn(
          "grid gap-3", 
          compactView ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
        )}>
          {isLoading ? (
            // Loading skeletons
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className={cn("p-3", compactView && "p-2")}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Actual data
            indices.map((index) => (
              <Card key={index.symbol} className="bg-card border-border">
                <CardContent className={cn("p-3", compactView && "p-2")}>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn(
                        "font-medium", 
                        compactView ? "text-xs" : "text-sm"
                      )}>
                        {index.name}
                      </span>
                      <div className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        index.changePercent > 0 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}>
                        {index.changePercent > 0 ? (
                          <span className="flex items-center">
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                            {index.changePercent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                            {Math.abs(index.changePercent).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "font-bold", 
                      compactView ? "text-base" : "text-xl"
                    )}>
                      {index.value.toLocaleString('en-US', { 
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2
                      })}
                    </span>
                    <span className={cn(
                      "text-xs mt-1",
                      index.changePercent > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {(index.changePercent > 0 ? '+' : '') + index.change.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}