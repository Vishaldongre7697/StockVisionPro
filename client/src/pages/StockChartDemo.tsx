import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import LiveStockChart from '@/components/LiveStockChart';

const StockChartDemo = () => {
  const [selectedStock, setSelectedStock] = useState<string>('AAPL');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'candlestick'>('line');
  
  // Sample stock list
  const stockOptions = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'META', name: 'Meta Platforms, Inc.' },
    { symbol: 'NFLX', name: 'Netflix, Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  ];

  const selectedStockInfo = stockOptions.find(stock => stock.symbol === selectedStock);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Live Stock Chart Demo</h1>
        
        <Select
          value={selectedStock}
          onValueChange={setSelectedStock}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a stock" />
          </SelectTrigger>
          <SelectContent>
            {stockOptions.map(stock => (
              <SelectItem key={stock.symbol} value={stock.symbol}>
                {stock.symbol} - {stock.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Chart Options</CardTitle>
          <CardDescription>
            Test different visualization and real-time data options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium w-32">Chart Type:</label>
            <Select
              value={chartType}
              onValueChange={(value) => setChartType(value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="candlestick">Candlestick Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Separator className="my-6" />
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Stock Data for {selectedStockInfo?.name || selectedStock}</CardTitle>
            <CardDescription>
              Showing real-time updates via WebSocket connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LiveStockChart 
              symbol={selectedStock} 
              companyName={selectedStockInfo?.name} 
              defaultChartType={chartType}
              height={400}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockChartDemo;