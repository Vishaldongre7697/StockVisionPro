import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stock, AiSuggestion } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWebSocketContext } from "@/lib/websocketContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Calculator, ArrowDown, ArrowUp, Layers, LineChart, CandlestickChart, Activity, Target, DollarSign, ArrowUpRight, TrendingDown, AlertCircle } from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Scatter
} from "recharts";
import { generateChartData, generateTimeLabels } from "@/lib/stockData";
import { getHistoricalData, getIntradayData } from "@/services/marketDataService";

const Predictions = () => {
  const [selectedStock, setSelectedStock] = useState<string>("RELIANCE");
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M">("1D");
  const [quantity, setQuantity] = useState<number>(10);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [calculatedProfit, setCalculatedProfit] = useState<{ profit: number; percentage: number } | null>(null);
  const [realTimePrice, setRealTimePrice] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Get WebSocket context for real-time data
  const { isConnected, registerHandler } = useWebSocketContext();
  
  // Fetch all stocks
  const { data: stocks, isLoading: isLoadingStocks } = useQuery({
    queryKey: ["/api/stocks"],
    queryFn: getQueryFn<Stock[]>({ on401: "returnNull" }),
  });

  // Fetch selected stock data
  const { data: stockData, isLoading: isLoadingStockData } = useQuery({
    queryKey: ["/api/stocks", selectedStock],
    queryFn: getQueryFn<Stock>({ on401: "returnNull" }),
    enabled: !!selectedStock,
  });

  // Fetch AI suggestion for the selected stock
  const { data: aiSuggestion, isLoading: isLoadingAiSuggestion } = useQuery({
    queryKey: ["/api/ai-suggestions/stock", stockData?.id],
    queryFn: getQueryFn<AiSuggestion>({ on401: "returnNull" }),
    enabled: !!stockData?.id,
  });
  
  // Fetch top AI suggestions
  const { data: topAiSuggestions, isLoading: isLoadingTopSuggestions } = useQuery({
    queryKey: ["/api/ai-suggestions/top"],
    queryFn: getQueryFn<(AiSuggestion & { stock: Stock })[]>({ on401: "returnNull" }),
  });

  // Generate chart data
  useEffect(() => {
    const fetchChartData = async () => {
      if (!stockData) return;
      
      try {
        let data: any[];
        if (timeframe === "1D") {
          data = await getIntradayData(selectedStock, "15min");
        } else if (timeframe === "1W") {
          data = await getHistoricalData(selectedStock, "daily");
          // Filter to last 7 days
          data = data.slice(-7);
        } else {
          data = await getHistoricalData(selectedStock, "daily");
          // Filter to last 30 days
          data = data.slice(-30);
        }
        
        // Add prediction data (using aiSuggestion if available)
        const withPredictions = data.map((point, index) => {
          // Add predictions only to the future part (last 30% of the chart)
          const isPrediction = index > Math.floor(data.length * 0.7);
          let predictionValue = null;
          
          if (isPrediction) {
            // Use AI suggestion if available
            if (aiSuggestion?.targetPrice && point.close) {
              // Create a gradual movement toward the target price
              const predictedChange = aiSuggestion.targetPrice - data[Math.floor(data.length * 0.7)].close;
              const step = predictedChange / (data.length * 0.3);
              const stepsFromBoundary = index - Math.floor(data.length * 0.7);
              predictionValue = data[Math.floor(data.length * 0.7)].close + (step * stepsFromBoundary);
            } else {
              // Fallback if no AI suggestion available
              predictionValue = point.close * (1 + ((index - Math.floor(data.length * 0.7)) / 100));
            }
          }
          
          return {
            ...point,
            prediction: predictionValue,
            formattedDate: new Date(point.date || point.datetime).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              ...(timeframe === "1M" ? { year: "numeric" } : {})
            }),
            time: point.date || point.datetime
          };
        });
        
        setChartData(withPredictions);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        // Fallback to generated data
        const generatedData = generatePredictionChartData();
        setChartData(generatedData);
      }
    };
    
    fetchChartData();
  }, [stockData, selectedStock, timeframe, aiSuggestion]);

  // Subscribe to real-time updates for the selected stock
  useEffect(() => {
    if (!isConnected || !selectedStock) return;
    
    const handleStockUpdate = (data: any) => {
      setRealTimePrice(data.price);
      setLastUpdated(new Date());
      
      // Update chart data with the new price point
      setChartData(prevData => {
        if (!prevData || prevData.length === 0) return prevData;
        
        const updatedData = [...prevData];
        const lastPoint = {...updatedData[updatedData.length - 1]};
        
        // Update last point with real-time data
        lastPoint.close = data.price;
        lastPoint.high = Math.max(lastPoint.high || 0, data.price);
        lastPoint.low = Math.min(lastPoint.low || Number.MAX_SAFE_INTEGER, data.price);
        
        updatedData[updatedData.length - 1] = lastPoint;
        return updatedData;
      });
    };
    
    // Register for updates
    const unregister = registerHandler(selectedStock, handleStockUpdate);
    
    return () => {
      unregister();
    };
  }, [isConnected, selectedStock, registerHandler]);

  // Generate chart data (fallback if API fails)
  const generatePredictionChartData = () => {
    if (!stockData) return [];

    const historicalData = generateChartData(
      stockData.currentPrice,
      30,
      "up"
    );

    const labels = generateTimeLabels(30, timeframe);

    // Create the chart data with time labels
    const chartData = historicalData.map((price, index) => ({
      time: labels[index],
      price,
      prediction: index > 20 ? price * (1 + (Math.random() * 0.04 - 0.01)) : null,
      open: price * 0.99,
      close: price,
      high: price * 1.01,
      low: price * 0.98,
      volume: Math.floor(Math.random() * 100000) + 50000
    }));

    return chartData;
  };
  
  // Calculate entry, target and stop loss prices
  const entryPriceValue = entryPrice || stockData?.currentPrice || 0;
  const targetPriceValue = aiSuggestion?.targetPrice || (entryPriceValue * 1.05);
  const stopLossValue = aiSuggestion?.stopLoss || (entryPriceValue * 0.95);

  // Handle profit calculator
  const handleCalculateProfit = () => {
    if (!stockData) return;
    
    const currentPrice = realTimePrice || stockData.currentPrice;
    const profit = (targetPriceValue - (entryPrice || currentPrice)) * quantity;
    const percentage = ((targetPriceValue - (entryPrice || currentPrice)) / (entryPrice || currentPrice)) * 100;
    
    setCalculatedProfit({ profit, percentage });
  };

  // Reset profit calculator
  const handleResetCalculator = () => {
    setQuantity(10);
    setEntryPrice(0);
    setCalculatedProfit(null);
  };
  
  // Format display price
  const displayPrice = realTimePrice || stockData?.currentPrice;
  const getChangeClass = (change: number) => {
    return change >= 0 
      ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };
  
  // Custom tooltip component for charts
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{color: string; dataKey: string; name: string; payload: any; value: number;}> | undefined;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-2 border border-border shadow-sm rounded-md text-xs">
          <p className="font-medium">{label || payload[0].payload.formattedDate}</p>
          
          {payload.map((entry, index: number) => {
            if (entry.dataKey === "prediction" && !entry.value) return null;
            
            return (
              <p key={index} style={{ color: entry.color }}>
                {entry.name || entry.dataKey}: ₹{entry.value?.toFixed(2)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Define custom candlestick component
  interface CandleStickProps {
    x: number;
    y: number;
    width: number;
    height: number;
    open: number;
    close: number;
    high: number;
    low: number;
    yMin: number;
    yMax: number;
  }
  
  // Using default shape props from recharts

  const CandleStick = (props: CandleStickProps) => {
    const { x, y, width, height, open, close, high, low, yMin, yMax } = props;
    const isIncreasing = close > open;
    const color = isIncreasing ? "#10B981" : "#EF4444";
    
    // Calculate positions using yMin and yMax
    const yRange = yMax - yMin;
    const toY = (val: number) => y + height - ((val - yMin) / yRange) * height;
    
    const yOpen = toY(open);
    const yClose = toY(close);
    const yHigh = toY(high);
    const yLow = toY(low);
    
    return (
      <g>
        {/* Wick line */}
        <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} />
        
        {/* Candle body */}
        <rect
          x={x - width / 2}
          y={Math.min(yOpen, yClose)}
          width={width}
          height={Math.max(1, Math.abs(yOpen - yClose))}
          fill={color}
          stroke="none"
        />
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top AI Suggestions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Highest Potential Stocks</CardTitle>
          <CardDescription>
            Stocks with the highest AI-predicted growth potential
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTopSuggestions ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : topAiSuggestions && topAiSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topAiSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedStock(suggestion.stock.symbol)}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{suggestion.stock.symbol}</CardTitle>
                        <CardDescription className="text-xs truncate max-w-[150px]">
                          {suggestion.stock.name}
                        </CardDescription>
                      </div>
                      <Badge className={getChangeClass(suggestion.stock.changePercent || 0)}>
                        {(suggestion.stock.changePercent || 0) >= 0 ? "+" : ""}
                        {(suggestion.stock.changePercent || 0).toFixed(2)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Current</span>
                      <span className="text-lg font-bold">₹{suggestion.stock.currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center">
                        <Target className="h-3 w-3 mr-1 text-green-500" /> Target
                      </span>
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-green-600">₹{suggestion.targetPrice?.toFixed(2) || "--"}</span>
                        <span className="text-xs ml-1 text-green-600">
                          (+{((((suggestion.targetPrice || 0) - suggestion.stock.currentPrice) / suggestion.stock.currentPrice) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <Badge variant="outline" className="text-xs">{suggestion.timeframe || "MEDIUM_TERM"}</Badge>
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {suggestion.confidence || 75}% Confidence
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p>No AI suggestions available at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Price Predictions</h2>
        
        {isLoadingStocks ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <Select
            value={selectedStock}
            onValueChange={setSelectedStock}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a stock" />
            </SelectTrigger>
            <SelectContent>
              {stocks?.filter(s => s.symbol !== "NIFTY" && s.symbol !== "SENSEX").map(stock => (
                <SelectItem key={stock.id} value={stock.symbol}>
                  {stock.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Charting Section */}
      <Card className="chart-container">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">
                {stockData?.name || 'Loading...'}
                {stockData && (
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${getChangeClass(stockData?.changePercent || 0)}`}
                  >
                    {(stockData?.changePercent || 0) >= 0 ? '+' : ''}
                    {stockData?.changePercent?.toFixed(2)}%
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Current price: ₹{displayPrice?.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2
                }) || '0.00'}
                {realTimePrice && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (Updated: {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})})
                  </span>
                )}
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <div className="border rounded-md p-1">
                <Button 
                  variant={chartType === "line" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setChartType("line")}
                  className="h-8 w-8 p-0"
                >
                  <LineChart className="h-4 w-4" />
                </Button>
                <Button 
                  variant={chartType === "candlestick" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setChartType("candlestick")}
                  className="h-8 w-8 p-0"
                >
                  <CandlestickChart className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="border rounded-md p-1">
                <Button 
                  variant={timeframe === "1D" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setTimeframe("1D")}
                  className="h-8 px-2 text-xs"
                >
                  1D
                </Button>
                <Button 
                  variant={timeframe === "1W" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setTimeframe("1W")}
                  className="h-8 px-2 text-xs"
                >
                  1W
                </Button>
                <Button 
                  variant={timeframe === "1M" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setTimeframe("1M")}
                  className="h-8 px-2 text-xs"
                >
                  1M
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2">
          <div className="h-[300px] w-full">
            {isLoadingStockData || chartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : chartType === "line" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 30,
                    bottom: 5,
                  }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="formattedDate" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#4F46E5"
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    strokeWidth={2}
                    name="Price"
                  />
                  <Area
                    type="monotone"
                    dataKey="prediction"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorPrediction)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Prediction"
                  />
                  <ReferenceLine
                    y={entryPriceValue}
                    label="Entry"
                    stroke="#6366F1"
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine
                    y={targetPriceValue}
                    label="Target"
                    stroke="#10B981"
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine
                    y={stopLossValue}
                    label="Stop Loss"
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 30,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="formattedDate" />
                  <YAxis yAxisId="price" domain={['auto', 'auto']} />
                  <YAxis yAxisId="volume" orientation="right" tickFormatter={(value) => `${(value/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Volume bars at the bottom */}
                  <Bar 
                    yAxisId="volume"
                    dataKey="volume" 
                    fill="#8884d8" 
                    opacity={0.3} 
                    barSize={10}
                  />
                  
                  {/* Add a scatter plot for custom rendering of candlesticks */}
                  <Scatter
                    yAxisId="price"
                    data={chartData}
                    shape={(props: any) => {
                      const { cx, cy, width, payload } = props;
                      
                      // Calculate min/max for scaling
                      const yMin = Math.min(...chartData.map(d => d.low));
                      const yMax = Math.max(...chartData.map(d => d.high));
                      
                      return (
                        <CandleStick
                          x={cx}
                          y={cy}
                          width={10} // Fixed width for candles
                          height={300} // This will be adjusted by the scaling logic
                          open={payload.open}
                          close={payload.close}
                          high={payload.high}
                          low={payload.low}
                          yMin={yMin}
                          yMax={yMax}
                        />
                      );
                    }}
                    line={false}
                  />
                  
                  {/* Prediction line */}
                  <RechartsLine
                    yAxisId="price"
                    type="monotone"
                    dataKey="prediction"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Prediction"
                  />
                  
                  {/* Reference lines */}
                  <ReferenceLine
                    yAxisId="price"
                    y={entryPriceValue}
                    label="Entry"
                    stroke="#6366F1"
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine
                    yAxisId="price"
                    y={targetPriceValue}
                    label="Target"
                    stroke="#10B981"
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine
                    yAxisId="price"
                    y={stopLossValue}
                    label="Stop Loss"
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="flex flex-wrap justify-between items-center mt-4 text-sm gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
              <span>Actual Price</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>AI Prediction</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-blue-500 rounded-full mr-2"></div>
              <span>Entry Point</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-green-500 rounded-full mr-2"></div>
              <span>Target</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-red-500 rounded-full mr-2"></div>
              <span>Stop Loss</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profit Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calculator className="mr-2 h-5 w-5" />
              Profit Calculator
            </CardTitle>
            <CardDescription>
              Estimate potential profit based on your trade parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Quantity</label>
                  <span className="text-sm text-muted-foreground">{quantity} shares</span>
                </div>
                <Slider
                  value={[quantity]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(value) => setQuantity(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Entry Price (₹)</label>
                <Input
                  type="number"
                  value={entryPrice || ''}
                  onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                  placeholder={stockData?.currentPrice.toString() || "Enter price"}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use current market price
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Price (₹)</label>
                <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted">
                  {targetPriceValue.toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2
                  })}
                </div>
                <p className="text-xs text-muted-foreground">AI predicted target price</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleResetCalculator}>Reset</Button>
            <Button onClick={handleCalculateProfit}>Calculate</Button>
          </CardFooter>
        </Card>
        
        {/* Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Risk Analysis
            </CardTitle>
            <CardDescription>
              Understand potential risks and rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {calculatedProfit ? (
                <div className="p-4 bg-muted/50 rounded-lg text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Estimated Profit</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{calculatedProfit.profit.toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2
                    })}
                  </p>
                  <p className="text-sm">
                    {calculatedProfit.percentage > 0 ? (
                      <span className="text-green-600 flex items-center justify-center">
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                        {calculatedProfit.percentage.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center justify-center">
                        <TrendingDown className="mr-1 h-4 w-4" />
                        {Math.abs(calculatedProfit.percentage).toFixed(2)}%
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Calculate your potential profit</p>
                  <ArrowDown className="h-5 w-5 mx-auto" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium mb-1 flex items-center">
                    <Target className="h-4 w-4 mr-1 text-green-500" />
                    Reward
                  </p>
                  <p className="text-xl font-bold">
                    ₹{((targetPriceValue - entryPriceValue) * quantity).toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2
                    })}
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium mb-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                    Risk
                  </p>
                  <p className="text-xl font-bold">
                    ₹{((entryPriceValue - stopLossValue) * quantity).toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium mb-1 flex items-center">
                  <Layers className="h-4 w-4 mr-1" />
                  Risk-Reward Ratio
                </p>
                <p className="text-lg font-bold">
                  1:{((targetPriceValue - entryPriceValue) / (entryPriceValue - stopLossValue)).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Technical Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Technical Analysis</CardTitle>
          <CardDescription>
            Key technical indicators and their interpretations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">RSI (14)</p>
              <p className="text-lg font-semibold">54.3</p>
              <Badge variant="outline" className="mt-1">
                Neutral
              </Badge>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">MACD</p>
              <p className="text-lg font-semibold">+12.5</p>
              <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Bullish
              </Badge>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Bollinger Bands</p>
              <p className="text-lg font-semibold">Middle</p>
              <Badge variant="outline" className="mt-1">
                Neutral
              </Badge>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Volume</p>
              <p className="text-lg font-semibold">4.2M</p>
              <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Above Avg
              </Badge>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-2">AI Analysis Summary</h4>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Technical indicators show mixed signals for {stockData?.symbol || 'this stock'}. RSI is neutral, 
                suggesting neither overbought nor oversold conditions. MACD is slightly bullish, indicating 
                potential upward momentum. The stock is trading near the middle Bollinger Band, suggesting 
                stable price movement. Volume is above average, confirming the current trend. Consider setting 
                a stop loss at ₹{stopLossValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} to manage risk.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Predictions;