import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  AreaChart,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { useHistoricalData } from '@/hooks/useMarketData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveStockChartProps {
  symbol: string;
  title?: string;
  showControls?: boolean;
  height?: number;
  chartType?: 'area' | 'candlestick' | 'line';
  className?: string;
}

const LiveStockChart = ({
  symbol,
  title,
  showControls = true,
  height = 300,
  chartType = 'area',
  className
}: LiveStockChartProps) => {
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data, loading, error, refresh, lastUpdated } = useHistoricalData(symbol, interval);
  
  // Format data for the chart
  const formatChartData = (data: any[]) => {
    if (!data) return [];
    
    return data.map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      // Add moving averages
      ma20: calculateMA(20, data, data.indexOf(item)),
      ma50: calculateMA(50, data, data.indexOf(item)),
    }));
  };
  
  // Calculate Moving Average
  const calculateMA = (days: number, data: any[], index: number) => {
    if (index < days - 1) return undefined;
    let sum = 0;
    for (let i = 0; i < days; i++) {
      sum += data[index - i].close;
    }
    return sum / days;
  };
  
  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Not updated yet';
    return `Last updated: ${lastUpdated.toLocaleTimeString()}`;
  };

  const handleRefresh = () => {
    refresh();
  };
  
  // Render chart based on type
  const renderChart = () => {
    const chartData = formatChartData(data || []);
    
    // If no data or loading, show skeleton
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="space-y-2 w-full">
            <Skeleton className="h-[250px] w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        </div>
      );
    }
    
    // If error, show error message
    if (error) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-destructive">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        </div>
      );
    }
    
    // If no data, show message
    if (!data || data.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-muted-foreground">No data available for {symbol}</p>
        </div>
      );
    }
    
    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              minTickGap={30}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="hsl(var(--primary))" 
              fillOpacity={1}
              fill="url(#colorClose)"
              name="Close"
            />
            <Line 
              type="monotone" 
              dataKey="ma20" 
              stroke="#ff7300" 
              dot={false}
              strokeWidth={1.5}
              name="MA20"
            />
            <Line 
              type="monotone" 
              dataKey="ma50" 
              stroke="#387908" 
              dot={false}
              strokeWidth={1.5}
              name="MA50"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    // Default line chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            minTickGap={30}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="hsl(var(--primary))" 
            activeDot={{ r: 8 }}
            name="Close Price"
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="ma20" 
            stroke="#ff7300" 
            dot={false}
            strokeWidth={1.5}
            name="MA20"
          />
          <Line 
            type="monotone" 
            dataKey="ma50" 
            stroke="#387908" 
            dot={false}
            strokeWidth={1.5}
            name="MA50"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">
            {title || `${symbol} Stock Chart`}
          </CardTitle>
          {showControls && (
            <div className="flex space-x-2 items-center">
              <span className="text-xs text-muted-foreground">
                {formatLastUpdated()}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {showControls && (
          <Tabs defaultValue={interval} className="w-full" onValueChange={(value) => setInterval(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div style={{ height: `${height}px` }}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStockChart;