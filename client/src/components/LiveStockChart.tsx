import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, RefreshCw, AlertTriangle, 
  Clock, Calendar, LineChart as LineChartIcon, BarChart3, 
  AreaChart as AreaChartIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getHistoricalData, getIntradayData } from '@/services/marketDataService';

export interface LiveStockChartProps {
  symbol: string;
  companyName?: string;
  className?: string;
  showControls?: boolean;
  defaultTimeframe?: 'intraday' | 'daily' | 'weekly' | 'monthly';
  defaultChartType?: 'line' | 'area' | 'bar';
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
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>(defaultChartType);
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
  
  // Initial data load and setup refresh interval
  useEffect(() => {
    fetchStockData();
    
    // Set up refresh interval - more frequent for intraday
    const intervalTime = timeframe === 'intraday' ? 30000 : 60000; // 30 sec for intraday, 1 min for others
    const intervalId = setInterval(() => {
      fetchStockData();
    }, intervalTime);
    
    return () => clearInterval(intervalId);
  }, [fetchStockData, timeframe]);
  
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
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md text-xs">
          <p className="font-medium">{payload[0].payload.formattedDate}</p>
          <p className="text-primary">Price: ${payload[0].value.toFixed(2)}</p>
          <div className="text-gray-500 whitespace-pre-line text-[10px] mt-1">
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
    
    return null;
  };
  
  // Loading state for the chart
  const renderLoadingState = () => (
    <div className="flex flex-col space-y-3 p-4 h-[350px] items-center justify-center">
      <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      <p className="text-sm text-gray-500">Loading chart data...</p>
    </div>
  );
  
  // Error state for the chart
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center h-[350px] p-4">
      <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
      <h3 className="text-base font-medium mb-1">Failed to load chart</h3>
      <p className="text-sm text-gray-500 mb-3 text-center">{error}</p>
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
            <span className="text-xs text-gray-500 hidden sm:inline-block">
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
            <span className="text-xs text-gray-500 mr-2">Timeframe:</span>
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
            <span className="text-xs text-gray-500 mr-2">Chart:</span>
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
            </ToggleGroup>
          </div>
          
          {timeframe === 'intraday' && (
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Interval:</span>
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
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  );
}