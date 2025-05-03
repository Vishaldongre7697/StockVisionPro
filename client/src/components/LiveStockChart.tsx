import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar,
  ReferenceLine, Rectangle, Scatter, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, RefreshCw, AlertTriangle, 
  Clock, Calendar, LineChart as LineChartIcon, BarChart3, 
  AreaChart as AreaChartIcon, CandlestickChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getHistoricalData, 
  getIntradayData, 
  registerForUpdates, 
  subscribeToSymbol 
} from '@/services/marketDataService';

export interface LiveStockChartProps {
  symbol: string;
  companyName?: string;
  className?: string;
  showControls?: boolean;
  defaultTimeframe?: 'intraday' | 'daily' | 'weekly' | 'monthly';
  defaultChartType?: 'line' | 'area' | 'bar' | 'candlestick';
  height?: number;
}

interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  close: number;
  low: number;
  volume: number;
  tooltip?: string;
  formattedDate?: string;
}

/**
 * LiveStockChart - Interactive stock chart component with live data and controls
 */
export default function LiveStockChart({
  symbol,
  companyName,
  className,
  showControls = true,
  defaultTimeframe = 'daily',
  defaultChartType = 'line',
  height = 350
}: LiveStockChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'intraday' | 'daily' | 'weekly' | 'monthly'>(defaultTimeframe);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'candlestick'>(defaultChartType || 'line');
  const [intradayInterval, setIntradayInterval] = useState<'1min' | '5min' | '15min' | '30min' | '60min'>('15min');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Fetch stock data based on timeframe
  const fetchStockData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let fetchedData: any[] = [];
      
      if (timeframe === 'intraday') {
        fetchedData = await getIntradayData(symbol, intradayInterval);
      } else {
        fetchedData = await getHistoricalData(symbol, timeframe === 'daily' ? 'daily' : timeframe);
      }
      
      // Format the data for the chart
      const formattedData = fetchedData.map(point => {
        // Format the date/time based on timeframe
        const dateObj = new Date(timeframe === 'intraday' ? point.datetime : point.date);
        const formattedDate = timeframe === 'intraday' 
          ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : dateObj.toLocaleDateString([], { 
              month: timeframe === 'daily' ? 'short' : 'numeric', 
              day: 'numeric',
              year: timeframe === 'monthly' ? 'numeric' : undefined
            });
        
        return {
          ...point,
          formattedDate,
          // For tooltip display
          tooltip: `Open: $${point.open.toFixed(2)} Close: $${point.close.toFixed(2)}
High: $${point.high.toFixed(2)} Low: $${point.low.toFixed(2)}
Volume: ${(point.volume/1000).toFixed(0)}K`
        };
      });
      
      setChartData(formattedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(`Error fetching ${timeframe} data for ${symbol}:`, err);
      setError(`Could not load ${timeframe} chart data for ${symbol}`);
      
      // Clear chart data on error
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, intradayInterval]);
  
  // Update single data point when real-time data is received
  const updateRealTimeData = useCallback((data: any) => {
    setChartData(prevData => {
      if (!prevData || prevData.length === 0) return prevData;

      // For intraday, we want to add a new point
      if (timeframe === 'intraday') {
        // Create a new data point with current timestamp
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newPoint = {
          date: now.toISOString(),
          datetime: now.toISOString(),
          open: data.price,
          high: data.price,
          low: data.price,
          close: data.price,
          volume: data.volume || 0,
          formattedDate: formattedTime,
          tooltip: `Open: $${data.price.toFixed(2)} Close: $${data.price.toFixed(2)}\nHigh: $${data.price.toFixed(2)} Low: $${data.price.toFixed(2)}\nVolume: ${((data.volume || 0)/1000).toFixed(0)}K`
        };
        
        // Limit to reasonable number of points
        const updatedData = [...prevData, newPoint].slice(-100);
        return updatedData;
      } else {
        // For other timeframes, we update the latest point
        const updatedData = [...prevData];
        const lastPoint = {...updatedData[updatedData.length - 1]};
        
        // Update the closing price and potentially the high/low
        lastPoint.close = data.price;
        lastPoint.high = Math.max(lastPoint.high, data.price);
        lastPoint.low = Math.min(lastPoint.low, data.price);
        
        // Update tooltip
        lastPoint.tooltip = `Open: $${lastPoint.open.toFixed(2)} Close: $${lastPoint.close.toFixed(2)}\nHigh: $${lastPoint.high.toFixed(2)} Low: $${lastPoint.low.toFixed(2)}\nVolume: ${((lastPoint.volume || 0)/1000).toFixed(0)}K`;
        
        updatedData[updatedData.length - 1] = lastPoint;
        return updatedData;
      }
    });
    
    // Update lastUpdated
    setLastUpdated(new Date());
  }, [timeframe]);

  // Initial data load and setup real-time updates
  useEffect(() => {
    // Fetch initial data
    fetchStockData();
    
    // Subscribe to real-time updates
    subscribeToSymbol(symbol);
    const unsubscribe = registerForUpdates(symbol, updateRealTimeData);
    
    // Set up refresh interval for backup (if WebSocket fails)
    const intervalTime = timeframe === 'intraday' ? 30000 : 60000; // 30 sec for intraday, 1 min for others
    const intervalId = setInterval(() => {
      fetchStockData();
    }, intervalTime);
    
    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [fetchStockData, timeframe, symbol, updateRealTimeData]);
  
  // Determine price change
  const getPriceChange = () => {
    if (chartData.length < 2) return { change: 0, changePercent: 0 };
    
    const firstPrice = chartData[0].close;
    const lastPrice = chartData[chartData.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    
    return { change, changePercent };
  };
  
  // Get current price from latest data point
  const getCurrentPrice = () => {
    if (chartData.length === 0) return null;
    return chartData[chartData.length - 1].close;
  };
  
  const { change, changePercent } = getPriceChange();
  const currentPrice = getCurrentPrice();
  
  // Format time for last updated
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-2 border border-border shadow-sm rounded-md text-xs">
          <p className="font-medium">{payload[0].payload.formattedDate}</p>
          <p className="text-primary">Price: ${payload[0].value.toFixed(2)}</p>
          <div className="text-muted-foreground whitespace-pre-line text-[10px] mt-1">
            {payload[0].payload.tooltip}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Render chart based on selected chart type
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 20, left: 20, bottom: 5 }
    };
    
    const commonAxisProps = {
      stroke: "#94a3b8",
      fontSize: 12
    };
    
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="formattedDate" 
              {...commonAxisProps}
              tickFormatter={(value) => {
                // Show fewer ticks on small screens
                return value;
              }}
            />
            <YAxis 
              {...commonAxisProps}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#3b82f6" 
              dot={false} 
              activeDot={{ r: 5 }}
              strokeWidth={2}
              name="Price"
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="formattedDate" 
              {...commonAxisProps}
            />
            <YAxis 
              {...commonAxisProps}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="#3b82f6" 
              fill="rgba(59, 130, 246, 0.1)" 
              name="Price"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="formattedDate" 
              {...commonAxisProps}
            />
            <YAxis 
              {...commonAxisProps}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="close" 
              fill="#3b82f6" 
              radius={[2, 2, 0, 0]}
              name="Price"
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'candlestick') {
      // Custom candle rendering
      const CandleStick = (props: any) => {
        const { x, y, width, height, low, high, open, close } = props;
        const isIncreasing = close > open;
        const color = isIncreasing ? '#16a34a' : '#e11d48'; // Green for increasing, red for decreasing
        const yHigh = y + height / 2 - ((high - low) / (props.domain[1] - props.domain[0])) * (high - props.domain[0]) * height;
        const yOpen = y + height / 2 - ((open - low) / (props.domain[1] - props.domain[0])) * (open - props.domain[0]) * height;
        const yClose = y + height / 2 - ((close - low) / (props.domain[1] - props.domain[0])) * (close - props.domain[0]) * height;
        const yLow = y + height / 2 - ((low - low) / (props.domain[1] - props.domain[0])) * (low - props.domain[0]) * height;
        const halfWidth = width / 2;
        
        return (
          <g>
            {/* The wick line */}
            <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} />
            
            {/* The candle body */}
            <rect 
              x={x - halfWidth} 
              y={Math.min(yOpen, yClose)} 
              width={width} 
              height={Math.abs(yOpen - yClose) || 1} 
              fill={color} 
              stroke={color}
            />
          </g>
        );
      };
      
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="formattedDate" 
              {...commonAxisProps} 
            />
            <YAxis 
              {...commonAxisProps}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* Volume bars at the bottom */}
            <Bar 
              dataKey="volume" 
              barSize={6}
              fill="url(#volumeGradient)" 
              opacity={0.5}
              yAxisId="volume"
            />
            
            {/* Custom candlestick rendering */}
            <Scatter
              data={chartData}
              fill="#8884d8"
              shape={<CandleStick />}
              line={false}
              lineType="joint"
              name="Price"
              isAnimationActive={false}
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    
    return null;
  };
  
  // Loading state for the chart
  const renderLoadingState = () => (
    <div className="flex flex-col space-y-3 p-4 h-[350px] items-center justify-center">
      <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      <p className="text-sm text-muted-foreground">Loading chart data...</p>
    </div>
  );
  
  // Error state for the chart
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center h-[350px] p-4">
      <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
      <h3 className="text-base font-medium mb-1">Failed to load chart</h3>
      <p className="text-sm text-muted-foreground mb-3 text-center">{error}</p>
      <Button variant="outline" size="sm" onClick={fetchStockData}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="font-bold">{symbol}</span>
              {currentPrice !== null && (
                <span className="text-base font-normal">
                  ${currentPrice.toFixed(2)}
                </span>
              )}
              {change !== 0 && (
                <Badge
                  className={cn(
                    change > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
                    "ml-1"
                  )}
                >
                  <span className="flex items-center">
                    {change > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {change > 0 ? "+" : ""}
                    {changePercent.toFixed(2)}%
                  </span>
                </Badge>
              )}
            </CardTitle>
            {companyName && (
              <CardDescription className="text-sm mt-1">
                {companyName}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Updated: {formatTime(lastUpdated)}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={fetchStockData}
              disabled={isLoading}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isLoading && "animate-spin"
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showControls && (
        <div className="px-4 pb-1 pt-0 flex flex-wrap justify-between gap-2">
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground mr-2">Timeframe:</span>
            <ToggleGroup 
              type="single" 
              defaultValue={timeframe}
              onValueChange={(value) => {
                if (value) setTimeframe(value as any);
              }}
              className="border rounded-md"
            >
              <ToggleGroupItem value="intraday" size="sm" className="text-xs h-7 px-2">
                <Clock className="h-3 w-3 mr-1" />
                Intraday
              </ToggleGroupItem>
              <ToggleGroupItem value="daily" size="sm" className="text-xs h-7 px-2">
                <Calendar className="h-3 w-3 mr-1" />
                Daily
              </ToggleGroupItem>
              <ToggleGroupItem value="weekly" size="sm" className="text-xs h-7 px-2">
                Weekly
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" size="sm" className="text-xs h-7 px-2">
                Monthly
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground mr-2">Chart:</span>
            <ToggleGroup 
              type="single" 
              defaultValue={chartType}
              onValueChange={(value) => {
                if (value) setChartType(value as any);
              }}
              className="border rounded-md"
            >
              <ToggleGroupItem value="line" size="sm" className="text-xs h-7 px-2">
                <LineChartIcon className="h-3 w-3 mr-1" />
                Line
              </ToggleGroupItem>
              <ToggleGroupItem value="area" size="sm" className="text-xs h-7 px-2">
                <AreaChartIcon className="h-3 w-3 mr-1" />
                Area
              </ToggleGroupItem>
              <ToggleGroupItem value="bar" size="sm" className="text-xs h-7 px-2">
                <BarChart3 className="h-3 w-3 mr-1" />
                Bar
              </ToggleGroupItem>
              <ToggleGroupItem value="candlestick" size="sm" className="text-xs h-7 px-2">
                <CandlestickChart className="h-3 w-3 mr-1" />
                Candle
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {timeframe === 'intraday' && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Interval:</span>
              <ToggleGroup 
                type="single" 
                defaultValue={intradayInterval}
                onValueChange={(value) => {
                  if (value) setIntradayInterval(value as any);
                }}
                className="border rounded-md"
              >
                <ToggleGroupItem value="1min" size="sm" className="text-xs h-7 px-2">1m</ToggleGroupItem>
                <ToggleGroupItem value="5min" size="sm" className="text-xs h-7 px-2">5m</ToggleGroupItem>
                <ToggleGroupItem value="15min" size="sm" className="text-xs h-7 px-2">15m</ToggleGroupItem>
                <ToggleGroupItem value="30min" size="sm" className="text-xs h-7 px-2">30m</ToggleGroupItem>
                <ToggleGroupItem value="60min" size="sm" className="text-xs h-7 px-2">1h</ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
        </div>
      )}
      
      <CardContent className="p-0 pt-4">
        {isLoading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  );
}