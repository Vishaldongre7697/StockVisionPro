import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stock, AiSuggestion } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area 
} from "recharts";
import LiveStockChart from "./LiveStockChart";
import { useWebSocketContext } from "@/lib/websocketContext";
import { Skeleton } from "@/components/ui/skeleton";
import { generateChartData, generateTimeLabels, formatIndianCurrency } from "@/lib/stockData";
import { cn } from "@/lib/utils";

interface StockAnalysisProps {
  stockSymbol?: string;
}

const StockAnalysis = ({ stockSymbol = "RELIANCE" }: StockAnalysisProps) => {
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y" | "All">("1D");
  
  const { data: stock, isLoading: isLoadingStock } = useQuery<Stock>({
    queryKey: [`/api/stocks/${stockSymbol}`],
  });
  
  const { data: aiSuggestion, isLoading: isLoadingSuggestion } = useQuery<AiSuggestion>({
    queryKey: [`/api/ai-suggestions/stock/${stock?.id}`],
    enabled: !!stock?.id,
  });
  
  const isLoading = isLoadingStock || isLoadingSuggestion;
  
  if (isLoading || !stock) {
    return <StockAnalysisSkeleton />;
  }
  
  const isPositive = (stock.changePercent || 0) >= 0;
  
  // Generate chart data based on the selected timeframe
  const dataPoints = timeframe === "1D" ? 24 : 
                    timeframe === "1W" ? 7 : 
                    timeframe === "1M" ? 30 : 
                    timeframe === "3M" ? 90 : 
                    timeframe === "1Y" ? 365 : 180;
  
  const chartData = generateChartData(
    stock.currentPrice, 
    dataPoints, 
    isPositive ? "up" : "down"
  );
  
  const timeLabels = generateTimeLabels(
    dataPoints, 
    timeframe === "1D" ? "1D" : timeframe === "1W" ? "1W" : "1M"
  );
  
  const formattedChartData = chartData.map((price, index) => ({
    time: timeLabels[index] || index.toString(),
    price
  }));
  
  // Calculate day range values
  const dayHigh = Math.max(...chartData.slice(-24));
  const dayLow = Math.min(...chartData.slice(-24));
  
  // Calculate 52-week range (just for demo)
  const yearHigh = stock.currentPrice * 1.2; // Simulated high
  const yearLow = stock.currentPrice * 0.8; // Simulated low
  
  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-neutral-900">Stock Analysis</h2>
        <div className="flex items-center">
          <span className="text-xs text-neutral-500 mr-2">{stock.symbol}</span>
          <button className="text-blue-500 text-sm font-medium">Change</button>
        </div>
      </div>
      
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between mb-4">
            <div>
              <h3 className="font-medium text-lg">{stock.name}</h3>
              <div className="text-sm text-neutral-500">{stock.exchange}: {stock.symbol} | {stock.sector}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold font-mono">{formatIndianCurrency(stock.currentPrice)}</div>
              <div className={isPositive ? "text-green-500" : "text-red-500"}>
                {isPositive ? "+" : ""}{stock.changePercent?.toFixed(2)}% ({formatIndianCurrency(stock.change || 0)})
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="h-[300px]">
              {/* Using LiveStockChart for real-time data */}
              <LiveStockChart 
                symbol={stockSymbol}
                companyName={stock.name}
                defaultTimeframe={timeframe === "1D" ? "intraday" : 
                                timeframe === "1W" ? "daily" : 
                                timeframe === "1M" ? "daily" : 
                                timeframe === "3M" ? "weekly" : "monthly"}
                defaultChartType={isPositive ? "area" : "line"}
                height={300}
              />
            <div className="flex justify-center mt-2">
              <div className="flex space-x-2 text-sm">
                {["1D", "1W", "1M", "3M", "1Y", "All"].map((period) => (
                  <button 
                    key={period}
                    className={cn(
                      "px-3 py-1 rounded-full",
                      timeframe === period 
                        ? "bg-primary text-white" 
                        : "text-neutral-600 hover:bg-gray-100"
                    )}
                    onClick={() => setTimeframe(period as any)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="border-r border-gray-200 pr-3">
              <div className="text-sm text-neutral-500">Day Range</div>
              <div className="text-base font-medium font-mono">
                ₹{dayLow.toFixed(2)} - ₹{dayHigh.toFixed(2)}
              </div>
            </div>
            <div className="border-r border-gray-200 pr-3">
              <div className="text-sm text-neutral-500">52W Range</div>
              <div className="text-base font-medium font-mono">
                ₹{yearLow.toFixed(2)} - ₹{yearHigh.toFixed(2)}
              </div>
            </div>
            <div className="border-r border-gray-200 pr-3">
              <div className="text-sm text-neutral-500">Market Cap</div>
              <div className="text-base font-medium font-mono">
                ₹{stock.marketCap ? (stock.marketCap / 1000000000000).toFixed(2) : 0}T
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-500">P/E Ratio</div>
              <div className="text-base font-medium font-mono">28.5</div>
            </div>
          </div>
          
          {aiSuggestion && (
            <div className="mb-3">
              <h4 className="font-medium mb-2">AI Prediction</h4>
              <div className="flex items-center p-3 bg-blue-500 bg-opacity-10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <div className="font-medium">Bullish Outlook (3-5 days)</div>
                  <div className="text-sm text-neutral-600 mt-1">{aiSuggestion.rationale}</div>
                  <div className="mt-2 flex items-center">
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden mr-2">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${aiSuggestion.confidence || 50}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-green-500 font-medium">{aiSuggestion.confidence}% Confidence</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="fundamentals">
            <TabsList className="mb-3">
              <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="news">News</TabsTrigger>
              <TabsTrigger value="institutional">Institutional</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fundamentals">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">EPS</span>
                    <span className="text-sm font-medium font-mono">₹103.01</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">Dividend Yield</span>
                    <span className="text-sm font-medium font-mono">0.42%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">ROE</span>
                    <span className="text-sm font-medium font-mono">11.2%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">Debt to Equity</span>
                    <span className="text-sm font-medium font-mono">0.38</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">Book Value</span>
                    <span className="text-sm font-medium font-mono">₹970.33</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">ROCE</span>
                    <span className="text-sm font-medium font-mono">12.8%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">Operating Margin</span>
                    <span className="text-sm font-medium font-mono">15.4%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">Profit Growth (YoY)</span>
                    <span className="text-sm font-medium font-mono text-green-500">+10.2%</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="technical">
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-1">Technical Analysis Coming Soon</h3>
                  <p className="text-sm text-neutral-600">
                    Technical indicators and chart patterns will be available in the next update.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="news">
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-1">News Feed Coming Soon</h3>
                  <p className="text-sm text-neutral-600">
                    Latest news and announcements will be available in the next update.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="institutional">
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-1">Institutional Data Coming Soon</h3>
                  <p className="text-sm text-neutral-600">
                    FII/DII holdings and recent transactions will be available in the next update.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
};

const StockAnalysisSkeleton = () => {
  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-6 w-40" />
        <div className="flex items-center">
          <Skeleton className="h-4 w-16 mr-2" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between mb-4">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="text-right">
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          
          <Skeleton className="h-[300px] w-full mb-6" />
          
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="h-8 w-12 rounded-full" />
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
          
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex mb-3">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-10 w-24 mx-1" />
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="flex justify-between mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default StockAnalysis;
