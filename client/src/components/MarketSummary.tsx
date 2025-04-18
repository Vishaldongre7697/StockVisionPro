import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketSummary } from '@/hooks/useMarketData';
import { ArrowUpRight, ArrowDownRight, RefreshCcw, TrendingUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export interface MarketSummaryProps {
  showRefreshButton?: boolean;
  compactView?: boolean;
  className?: string;
}

/**
 * Market Summary Component that displays key market indices with live data
 */
const MarketSummary = ({
  showRefreshButton = true,
  compactView = false,
  className,
}: MarketSummaryProps) => {
  const { data, loading, error, refresh, lastUpdated } = useMarketSummary({
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
  });
  const { toast } = useToast();

  const handleRefresh = () => {
    refresh();
    toast({
      title: 'Refreshing market data',
      description: 'Fetching the latest market information.',
    });
  };

  const handleRequestApiKey = () => {
    toast({
      title: 'API Key Required',
      description: 'A stock market API key is needed for live market data.',
      variant: 'destructive',
    });
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // If loading, show skeleton UI
  if (loading && !data) {
    return (
      <Card className={cn("bg-white border border-gray-100 shadow-sm", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white border border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-7 w-24 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If there's an error, show error state
  if (error) {
    return (
      <Card className={cn("bg-white border border-destructive shadow-sm", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold">Market Summary</CardTitle>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {formatDate()}
            </Badge>
          </div>
          <CardDescription className="text-destructive">
            {error.includes('API key') ? (
              <>
                Market data requires an API key. 
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={handleRequestApiKey}
                >
                  Request API Key
                </Button>
              </>
            ) : (
              'Failed to load market data. Please try again later.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            variant="outline"
            className="mt-2"
            onClick={handleRefresh}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Generate market summary text
  const generateSummaryText = () => {
    if (!data || data.length === 0) return 'Market data unavailable';
    
    // Count how many indices are up/down
    const upCount = data.filter(index => index.changePercent > 0).length;
    const trend = upCount > data.length / 2 ? 'positive' : 'negative';
    
    // Find the best and worst performing indices
    const sortedIndices = [...data].sort((a, b) => b.changePercent - a.changePercent);
    const bestPerformer = sortedIndices[0];
    const worstPerformer = sortedIndices[sortedIndices.length - 1];
    
    if (trend === 'positive') {
      return `Markets are ${upCount === data.length ? 'all' : 'mostly'} trending up today, with ${bestPerformer.name} leading at +${bestPerformer.changePercent.toFixed(2)}%. ${worstPerformer.changePercent < 0 ? `${worstPerformer.name} is down ${Math.abs(worstPerformer.changePercent).toFixed(2)}%.` : ''}`;
    } else {
      return `Markets are ${upCount === 0 ? 'all' : 'mostly'} trending down today, with ${worstPerformer.name} down ${Math.abs(worstPerformer.changePercent).toFixed(2)}%. ${bestPerformer.changePercent > 0 ? `${bestPerformer.name} is up ${bestPerformer.changePercent.toFixed(2)}%.` : ''}`;
    }
  };

  // Render market data
  return (
    <Card className={cn("bg-white border border-gray-100 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Market Summary</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {formatDate()}
            </Badge>
            {showRefreshButton && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-sm">
          {generateSummaryText()}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.map((index) => (
            <Card key={index.symbol} className="bg-white border border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{index.name}</span>
                    <div className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      index.changePercent > 0 
                        ? "bg-green-50 text-green-700" 
                        : "bg-red-50 text-red-700"
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
                  <span className="text-xl font-bold">
                    ${index.price.toLocaleString('en-US', { 
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2
                    })}
                  </span>
                  <span className={cn(
                    "text-xs mt-1",
                    index.changePercent > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {(index.changePercent > 0 ? '+' : '') + index.change.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
      
      {!compactView && (
        <CardFooter className="pt-0">
          <Link href="/market" className="text-primary text-sm flex items-center ml-auto">
            View detailed market data
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
};

export default MarketSummary;