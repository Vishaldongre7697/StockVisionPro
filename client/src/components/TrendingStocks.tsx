import { useQuery } from "@tanstack/react-query";
import { Stock, StockSentiment } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { generateChartData, calculateSentiment } from "@/lib/stockData";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIndianCurrency } from "@/lib/stockData";
import { cn } from "@/lib/utils";

const TrendingStocks = () => {
  const { data: stocks, isLoading } = useQuery<Stock[]>({
    queryKey: ['/api/stocks/top'],
  });

  if (isLoading || !stocks) {
    return <TrendingStocksSkeleton />;
  }

  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-neutral-900">Trending Stocks</h2>
        <button className="text-blue-500 text-sm font-medium">View All</button>
      </div>
      
      {stocks.filter(stock => stock.symbol !== "NIFTY" && stock.symbol !== "SENSEX")
        .slice(0, 3)
        .map((stock) => {
          const isPositive = (stock.changePercent || 0) >= 0;
          const sentiment = calculateSentiment(stock);
          const chartData = generateChartData(
            stock.currentPrice, 
            7, 
            isPositive ? "up" : "down"
          ).map(price => ({ price }));
          
          let suggestionType = "HOLD";
          let borderColor = "border-neutral-400";
          
          if (isPositive && stock.changePercent && stock.changePercent > 1) {
            suggestionType = "BUY";
            borderColor = "border-green-500";
          } else if (!isPositive && stock.changePercent && stock.changePercent < -0.5) {
            suggestionType = "SELL";
            borderColor = "border-red-500";
          }
          
          let sentimentColor = "text-neutral-600";
          if (sentiment === StockSentiment.VERY_BULLISH || sentiment === StockSentiment.BULLISH) {
            sentimentColor = "text-green-500";
          } else if (sentiment === StockSentiment.BEARISH || sentiment === StockSentiment.VERY_BEARISH) {
            sentimentColor = "text-red-500";
          }
          
          return (
            <Card 
              key={stock.id} 
              className={cn("mb-3 border-l-4", borderColor)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium text-neutral-900">{stock.name}</h3>
                      <span 
                        className={cn(
                          "ml-2 text-xs px-2 py-0.5 rounded",
                          suggestionType === "BUY" 
                            ? "bg-green-100 text-green-500" 
                            : suggestionType === "SELL" 
                              ? "bg-red-100 text-red-500" 
                              : "bg-neutral-200 text-neutral-600"
                        )}
                      >
                        {suggestionType}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">{stock.exchange}: {stock.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium font-mono text-lg">{formatIndianCurrency(stock.currentPrice)}</div>
                    <div className={isPositive ? "text-green-500" : "text-red-500"}>
                      {isPositive ? "+" : ""}{stock.changePercent?.toFixed(2)}% ({formatIndianCurrency(stock.change || 0)})
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Volume: {(stock.volume ? (stock.volume / 1000000).toFixed(1) : 0)}M</span>
                    <span>AI Sentiment: <span className={sentimentColor}>{sentiment}</span></span>
                  </div>
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke={isPositive ? "#10B981" : "#EF4444"}
                          fill={isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}
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
        })}
    </section>
  );
};

const TrendingStocksSkeleton = () => {
  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      {[1, 2, 3].map((item) => (
        <Card key={item} className="mb-3">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="text-right">
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};

export default TrendingStocks;
