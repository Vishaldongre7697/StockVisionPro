import { Search, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Stock } from '@shared/schema';

const Home = () => {
  const { user } = useAuth();
  
  // Fetch top stocks
  const { data: topStocks } = useQuery({
    queryKey: ['/api/stocks/top'],
    queryFn: getQueryFn<Stock[]>({ on401: 'returnNull' })
  });

  // Fetch all stocks for search functionality
  const { data: allStocks } = useQuery({
    queryKey: ['/api/stocks'],
    queryFn: getQueryFn<Stock[]>({ on401: 'returnNull' })
  });

  // Market summary data
  const marketSummary = {
    text: "Nifty 50 is up 1.2% with strong FII inflows. IT and Banking sectors showing positive momentum. Global markets are mixed with US futures pointing higher.",
    indices: [
      { name: "NIFTY 50", value: 22875.50, change: 275.45, changePercent: 1.22 },
      { name: "SENSEX", value: 75245.35, change: 882.05, changePercent: 1.18 },
      { name: "BANKNIFTY", value: 48230.75, change: 615.80, changePercent: 1.29 },
      { name: "NIFTYIT", value: 35980.60, change: -125.40, changePercent: -0.35 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search stocks, indices..." 
          className="pl-10 pr-4"
        />
      </div>
      
      {/* Welcome & Market Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Welcome {user?.fullName || user?.username || 'Trader'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {marketSummary.text}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {marketSummary.indices.map((index) => (
              <Card key={index.name} className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">{index.name}</span>
                    {index.changePercent > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                        {index.changePercent.toFixed(2)}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <ArrowDownRight className="mr-1 h-3 w-3" />
                        {Math.abs(index.changePercent).toFixed(2)}%
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="text-lg font-semibold">
                      {index.value.toLocaleString('en-IN', { 
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Trending Stocks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Trending Stocks</h2>
          <Button variant="ghost" size="sm" className="text-xs">
            <TrendingUp className="mr-1 h-3 w-3" />
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          {topStocks?.slice(0, 4).map((stock) => (
            <Card key={stock.id} className="stock-card">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{stock.symbol}</h3>
                  <p className="text-xs text-muted-foreground">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ₹{stock.currentPrice.toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2
                    })}
                  </p>
                  <p className={stock.change && stock.change > 0 ? "stock-up text-xs" : "stock-down text-xs"}>
                    {stock.change ? (stock.change > 0 ? '+' : '') + stock.change.toFixed(2) : '0.00'} 
                    ({stock.changePercent ? (stock.changePercent > 0 ? '+' : '') + stock.changePercent.toFixed(2) : '0.00'}%)
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* AI Market Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">AI Market Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Today's Sentiment</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Bullish
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Markets are showing bullish momentum with strong buying in IT, Banking, and Consumer sectors. FII inflows remain positive.
            </p>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Top AI Pick</span>
              <span className="signal-buy">BUY</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">RELIANCE</p>
                <p className="text-xs text-muted-foreground">Target: ₹3,120</p>
              </div>
              <Button variant="outline" size="sm">View Analysis</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
