import { Search, TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, AreaChart, DollarSign, PieChart, BarChart4, LineChart, Activity, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Stock } from '@shared/schema';
import { cn } from '@/lib/utils';

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
    text: "Market is up with strong FII inflows. IT and Banking sectors showing positive momentum. Global markets are mixed with US futures pointing higher.",
    indices: [
      { name: "NIFTY 50", value: 22875.50, change: 275.45, changePercent: 1.22 },
      { name: "SENSEX", value: 75245.35, change: 882.05, changePercent: 1.18 },
      { name: "BANKNIFTY", value: 48230.75, change: 615.80, changePercent: 1.29 },
      { name: "NIFTYIT", value: 35980.60, change: -125.40, changePercent: -0.35 }
    ]
  };

  // Top buying stocks with quantity data
  const topBuyingStocks = [
    { id: 1, symbol: 'HDFC', name: 'HDFC Bank Ltd', currentPrice: 1678.45, change: 28.55, changePercent: 1.73, volume: 3245000, buyQuantity: 2100000 },
    { id: 2, symbol: 'INFY', name: 'Infosys Ltd', currentPrice: 1425.70, change: 32.80, changePercent: 2.35, volume: 1876500, buyQuantity: 1200000 },
    { id: 3, symbol: 'TCS', name: 'Tata Consultancy Services', currentPrice: 3456.20, change: 45.30, changePercent: 1.33, volume: 985000, buyQuantity: 650000 },
    { id: 4, symbol: 'RELI', name: 'Reliance Industries Ltd', currentPrice: 2512.40, change: 38.75, changePercent: 1.57, volume: 2654000, buyQuantity: 1750000 },
    { id: 5, symbol: 'ICBK', name: 'ICICI Bank Ltd', currentPrice: 932.60, change: 15.40, changePercent: 1.68, volume: 3120000, buyQuantity: 1950000 }
  ];

  // Trending stocks with additional data
  const trendingStocks = [
    { id: 1, symbol: 'ADANI', name: 'Adani Enterprises Ltd', currentPrice: 2765.30, change: 125.45, changePercent: 4.75, volume: 4250000, momentum: 'high' },
    { id: 2, symbol: 'BHARTI', name: 'Bharti Airtel Ltd', currentPrice: 895.20, change: 23.75, changePercent: 2.73, volume: 1965000, momentum: 'medium' },
    { id: 3, symbol: 'ITC', name: 'ITC Ltd', currentPrice: 425.85, change: -8.35, changePercent: -1.92, volume: 5760000, momentum: 'low' },
    { id: 4, symbol: 'WIPRO', name: 'Wipro Ltd', currentPrice: 452.70, change: 12.35, changePercent: 2.80, volume: 2320000, momentum: 'medium' },
    { id: 5, symbol: 'TATAMOT', name: 'Tata Motors Ltd', currentPrice: 632.45, change: 18.70, changePercent: 3.05, volume: 3854000, momentum: 'high' },
    { id: 6, symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', currentPrice: 645.20, change: -5.35, changePercent: -0.82, volume: 1265000, momentum: 'low' }
  ];

  return (
    <div className="space-y-6 bg-white">
      {/* Header with Search */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Market Overview</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search stocks..." 
            className="pl-10 pr-4 bg-gray-50 border-gray-100"
          />
        </div>
      </div>
      
      {/* Market Summary */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold">Market Summary</CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </Badge>
          </div>
          <CardDescription className="text-sm">
            {marketSummary.text}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketSummary.indices.map((index) => (
              <Card key={index.name} className="bg-white border border-gray-100 shadow-sm">
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
                      {index.value.toLocaleString('en-IN', { 
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
      </Card>
      
      {/* Trending Stocks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Trending Stocks</span>
          </h2>
          <Button variant="outline" size="sm" className="text-xs gap-1 border-blue-200 text-blue-700">
            View All
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingStocks.map((stock) => (
            <Card key={stock.id} className="bg-white border border-gray-100 shadow-sm hover:shadow transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      stock.changePercent > 0 
                        ? "bg-green-50 text-green-700" 
                        : "bg-red-50 text-red-700"
                    )}>
                      <span className="font-bold text-sm">
                        {stock.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{stock.symbol}</h3>
                      <p className="text-xs text-muted-foreground">{stock.name}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    stock.momentum === 'high' ? "bg-green-50 text-green-700" :
                    stock.momentum === 'medium' ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  )}>
                    {stock.momentum === 'high' ? "High Momentum" :
                     stock.momentum === 'medium' ? "Medium Momentum" :
                     "Low Momentum"}
                  </div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-500">Volume</p>
                    <p className="text-sm font-medium">{(stock.volume / 1000000).toFixed(2)}M</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      ₹{stock.currentPrice.toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2
                      })}
                    </p>
                    <p className={stock.changePercent > 0 ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                      {(stock.changePercent > 0 ? '+' : '') + stock.change.toFixed(2)} 
                      ({(stock.changePercent > 0 ? '+' : '') + stock.changePercent.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Top Buying Stocks - With Quantity Section */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Top Buying Stocks with Volume</span>
            </CardTitle>
            <Button variant="outline" size="sm" className="text-xs border-blue-200 text-blue-700">
              View Details
            </Button>
          </div>
          <CardDescription>
            Stocks with highest buying quantity in today's session
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {topBuyingStocks.map((stock, index) => (
              <div key={stock.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{stock.symbol}</span>
                      <span className="text-xs text-gray-500">{stock.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">₹{stock.currentPrice.toFixed(2)}</span>
                    <div className={stock.changePercent > 0 ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                      {(stock.changePercent > 0 ? '+' : '') + stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span>Buy Quantity: {(stock.buyQuantity / 1000000).toFixed(2)}M</span>
                    <span>Volume: {(stock.volume / 1000000).toFixed(2)}M</span>
                  </div>
                  <Progress 
                    value={(stock.buyQuantity / stock.volume) * 100}
                    className="h-2 bg-gray-100"
                    indicatorClassName={stock.changePercent > 0 ? "bg-green-500" : "bg-red-500"}
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Buy Ratio: {((stock.buyQuantity / stock.volume) * 100).toFixed(1)}%</span>
                    <span className={stock.changePercent > 0 ? "text-green-600" : "text-red-600"}>
                      {stock.changePercent > 0 ? "Bullish" : "Bearish"} Trend
                    </span>
                  </div>
                </div>
                
                {index < topBuyingStocks.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Market Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium">Market Breadth</h3>
              <p className="text-3xl font-bold mt-2 text-green-600">1.45</p>
              <p className="text-xs text-gray-500 mt-1">Advance/Decline Ratio</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium">Advancing</h3>
              <p className="text-3xl font-bold mt-2">1,854</p>
              <p className="text-xs text-gray-500 mt-1">Total Advancing Stocks</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-medium">Declining</h3>
              <p className="text-3xl font-bold mt-2">1,278</p>
              <p className="text-xs text-gray-500 mt-1">Total Declining Stocks</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-medium">Total Volume</h3>
              <p className="text-3xl font-bold mt-2">7.8B</p>
              <p className="text-xs text-gray-500 mt-1">Market Volume (shares)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
