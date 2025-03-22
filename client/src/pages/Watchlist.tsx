import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stock } from "@shared/schema";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import MarketTicker from "@/components/MarketTicker";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { formatIndianCurrency } from "@/lib/stockData";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  ResponsiveContainer
} from "recharts";
import { generateChartData } from "@/lib/stockData";

const Watchlist = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Fetch user's watchlist
  const { data: watchlist, isLoading: isLoadingWatchlist } = useQuery<Stock[]>({
    queryKey: ['/api/watchlist', user?.id],
    enabled: isAuthenticated && !!user?.id,
  });

  // Fetch all stocks for search
  const { data: allStocks, isLoading: isLoadingStocks } = useQuery<Stock[]>({
    queryKey: ['/api/stocks'],
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
      <div className="min-h-screen pb-16 relative">
        <Header />
        <MarketTicker />
        
        <main className="container mx-auto px-4 py-10">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">Sign In to View Your Watchlist</h2>
            <p className="text-neutral-600 mb-6">
              Create a free account to start tracking your favorite stocks.
            </p>
            <Button asChild>
              <a href="/login">Login</a>
            </Button>
          </div>
        </main>
        
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 relative">
      <Header />
      <MarketTicker />
      
      <main className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Watchlist</h2>
          <div className="relative">
            <div className="flex items-center">
              <Input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              <Search className="absolute right-3 top-2 h-4 w-4 text-neutral-400" />
            </div>
            
            {searchQuery && filteredStocks.length > 0 && (
              <div className="absolute top-full mt-1 w-full z-10 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredStocks.map((stock) => (
                  <button
                    key={stock.id}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex justify-between items-center"
                    onClick={() => handleSelectStock(stock)}
                  >
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-xs text-neutral-500">{stock.name}</div>
                    </div>
                    <Plus className="h-4 w-4 text-blue-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {selectedStock && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{selectedStock.symbol}</h3>
                  <p className="text-sm text-neutral-500">{selectedStock.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddToWatchlist}>
                    Add
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
            <p className="text-neutral-500 mb-4">Your watchlist is empty</p>
            <p className="text-sm text-neutral-400">
              Search for stocks above to add them to your watchlist
            </p>
          </div>
        )}
      </main>
      
      <Navigation />
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
  
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center">
              <h3 className="font-medium">{stock.symbol}</h3>
              <span className={cn(
                "ml-2 text-xs px-2 py-0.5 rounded",
                isPositive ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"
              )}>
                {isPositive ? "BUY" : "SELL"}
              </span>
            </div>
            <p className="text-sm text-neutral-500">{stock.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
        
        <div className="flex justify-between items-end mt-2">
          <div>
            <div className="font-medium font-mono">{formatIndianCurrency(stock.currentPrice)}</div>
            <div className={isPositive ? "text-green-500" : "text-red-500"}>
              {isPositive ? "+" : ""}{stock.changePercent?.toFixed(2)}% ({formatIndianCurrency(stock.change || 0)})
            </div>
          </div>
          <div className="h-16 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "#10B981" : "#EF4444"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const WatchlistItemSkeleton = () => {
  return (
    <Card>
      <CardContent className="p-3">
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
      </CardContent>
    </Card>
  );
};

export default Watchlist;
