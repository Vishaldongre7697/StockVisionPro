import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stock } from "@shared/schema";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, Search, Trash2, Bell, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { formatIndianCurrency } from "@/lib/stockData";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { generateChartData } from "@/lib/stockData";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const Watchlist = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Fetch user's watchlist
  const { data: watchlist, isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ['/api/watchlist', user?.id],
    queryFn: getQueryFn<Stock[]>({ on401: 'returnNull' }),
    enabled: isAuthenticated && !!user?.id,
  });

  // Fetch all stocks for search
  const { data: allStocks, isLoading: isLoadingStocks } = useQuery({
    queryKey: ['/api/stocks'],
    queryFn: getQueryFn<Stock[]>({ on401: 'returnNull' }),
  });

  // Add to watchlist mutation
  const addToWatchlist = useMutation({
    mutationFn: async (stockId: number) => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest("POST", "/api/watchlist", {
        userId: user.id,
        stockId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', user?.id] });
      toast({
        title: "Added to Watchlist",
        description: `${selectedStock?.name} has been added to your watchlist.`,
      });
      setSelectedStock(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to add to watchlist",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Remove from watchlist mutation
  const removeFromWatchlist = useMutation({
    mutationFn: async (stockId: number) => {
      if (!user) throw new Error("User not authenticated");
      return apiRequest("DELETE", `/api/watchlist/${user.id}/${stockId}`);
    },
    onSuccess: (_, stockId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', user?.id] });
      const removedStock = allStocks?.find(s => s.id === stockId);
      toast({
        title: "Removed from Watchlist",
        description: `${removedStock?.name} has been removed from your watchlist.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove from watchlist",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Filter stocks based on search query
  const filteredStocks = allStocks?.filter(stock => {
    if (!searchQuery) return false;
    return (
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  // Select stock handler
  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setSearchQuery("");
  };

  // Add to watchlist handler
  const handleAddToWatchlist = () => {
    if (selectedStock) {
      addToWatchlist.mutate(selectedStock.id);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-4">Sign In to View Your Watchlist</h2>
          <p className="text-muted-foreground mb-6">
            Create a free account to start tracking your favorite stocks.
          </p>
          <Button asChild>
            <a href="/login">Login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications & Search */}
      <div className="flex justify-between items-center gap-2">
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Add stocks to watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Bell className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="space-y-2">
              <h4 className="font-medium">Price Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Configure price alerts for your watchlist stocks
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">RELIANCE</span>
                  <Badge variant="outline" className="text-xs">₹2,950</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">TCS</span>
                  <Badge variant="outline" className="text-xs">₹3,800</Badge>
                </div>
              </div>
              <Button className="w-full mt-2" size="sm">Add New Alert</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Search Results */}
      {searchQuery && filteredStocks.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-3 max-h-60 overflow-y-auto">
            {filteredStocks.map((stock) => (
              <button
                key={stock.id}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex justify-between items-center mb-1"
                onClick={() => handleSelectStock(stock)}
              >
                <div>
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-xs text-muted-foreground">{stock.name}</div>
                </div>
                <Plus className="h-4 w-4 text-primary" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Selected Stock */}
      {selectedStock && (
        <Card className="mb-4 border-primary/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{selectedStock.symbol}</h3>
                <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddToWatchlist}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Watchlist
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedStock(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Watchlist Items */}
      {isLoadingWatchlist ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <WatchlistItemSkeleton key={i} />
          ))}
        </div>
      ) : watchlist && watchlist.length > 0 ? (
        <div className="space-y-4">
          {watchlist.map((stock) => (
            <WatchlistItem 
              key={stock.id} 
              stock={stock} 
              onRemove={() => removeFromWatchlist.mutate(stock.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
          <p className="text-sm text-muted-foreground">
            Search for stocks above to add them to your watchlist
          </p>
        </div>
      )}
      
      {/* Add More Button */}
      {watchlist && watchlist.length > 0 && (
        <Button 
          variant="outline" 
          className="w-full border-dashed"
          onClick={() => document.querySelector('input')?.focus()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add More Stock
        </Button>
      )}
    </div>
  );
};

interface WatchlistItemProps {
  stock: Stock;
  onRemove: () => void;
}

const WatchlistItem = ({ stock, onRemove }: WatchlistItemProps) => {
  const isPositive = (stock.changePercent || 0) >= 0;
  
  // Generate chart data
  const chartData = generateChartData(
    stock.currentPrice, 
    20, 
    isPositive ? "up" : "down"
  ).map(price => ({ price }));
  
  // AI sentiment and prediction
  const sentiment = isPositive ? "BUY" : Math.random() > 0.5 ? "SELL" : "HOLD";
  const targetPrice = isPositive 
    ? (stock.currentPrice * (1 + (Math.random() * 0.05))).toFixed(2) 
    : (stock.currentPrice * (1 - (Math.random() * 0.05))).toFixed(2);
  const confidence = 65 + Math.floor(Math.random() * 25);
  
  return (
    <Accordion type="single" collapsible className="border-none">
      <AccordionItem value={`stock-${stock.id}`} className="border-none">
        <div className="stock-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{stock.symbol}</h3>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  sentiment === "BUY" ? "signal-buy" : 
                  sentiment === "SELL" ? "signal-sell" : "signal-hold"
                )}>
                  {sentiment}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{stock.name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }} className="h-8 w-8 p-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-end mt-3">
            <div>
              <div className="font-semibold">
                ₹{stock.currentPrice.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2
                })}
              </div>
              <div className={isPositive ? "stock-up text-xs" : "stock-down text-xs"}>
                {isPositive ? (
                  <span className="flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {stock.changePercent?.toFixed(2)}%
                  </span>
                ) : (
                  <span className="flex items-center">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {Math.abs(stock.changePercent || 0).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-16 w-24">
              <ResponsiveContainer width="100%" height="100%">
                {isPositive ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`gradientUp-${stock.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10B981"
                      strokeWidth={2}
                      fill={`url(#gradientUp-${stock.id})`}
                      dot={false}
                    />
                  </AreaChart>
                ) : (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`gradientDown-${stock.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#EF4444"
                      strokeWidth={2}
                      fill={`url(#gradientDown-${stock.id})`}
                      dot={false}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          
          <AccordionTrigger className="py-1 hover:no-underline">
            <span className="text-xs text-muted-foreground">View details</span>
          </AccordionTrigger>
        </div>
        
        <AccordionContent className="border border-t-0 rounded-b-lg border-gray-100 dark:border-gray-700 px-4 py-3 -mt-3 bg-white dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Fundamental Data</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FII Activity</span>
                  <span className={isPositive ? "text-green-500" : "text-red-500"}>
                    {isPositive ? "Buying" : "Selling"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DII Activity</span>
                  <span>{Math.random() > 0.5 ? "Buying" : "Selling"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Block Deals</span>
                  <span>{Math.floor(Math.random() * 5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Revenue</span>
                  <span>₹{(Math.random() * 10000).toFixed(0)}Cr</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Technical Data</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSI</span>
                  <span className={
                    isPositive ? "text-green-500" : "text-red-500"
                  }>{Math.floor(Math.random() * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMA (20)</span>
                  <span>₹{(stock.currentPrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EMA (50)</span>
                  <span>₹{(stock.currentPrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span>{(Math.random() * 10).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">AI Analysis</h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="text-sm">Signal: <span className="font-medium">{sentiment}</span></span>
                <span className="text-sm">Confidence: <span className="font-medium">{confidence}%</span></span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Target Price: <span className="font-medium">₹{targetPrice}</span></span>
                <span className="text-sm">Expected Range: <span className="font-medium">±3.2%</span></span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPositive 
                  ? `Strong buying momentum with positive institutional interest. Technical indicators support a bullish stance with increasing volumes.`
                  : `Bearish signals with distribution patterns. Recommend cautious approach as technical indicators show weakness.`
                }
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const WatchlistItemSkeleton = () => {
  return (
    <Card className="stock-card">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      
      <div className="flex justify-between items-end mt-2">
        <div>
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-16 w-24" />
      </div>
    </Card>
  );
};

export default Watchlist;
