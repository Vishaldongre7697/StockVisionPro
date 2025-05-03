import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, LineChart, CandlestickChart, BarChart3, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import LiveStockChart from '@/components/LiveStockChart';
import { useWebSocketContext } from '@/lib/websocketContext';
import StockAnalysis from '@/components/StockAnalysis';

const StockChartDemo = () => {
  const [selectedStock, setSelectedStock] = useState<string>('AAPL');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'candlestick'>('line');
  const [timeframe, setTimeframe] = useState<'intraday' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  // Get WebSocket connection status
  const { isConnected, isConnecting } = useWebSocketContext();
  
  // Update connection status when WebSocket state changes
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else if (isConnecting) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected, isConnecting]);
  
  // Sample stock list - for Indian/international market
  const indianStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.' },
    { symbol: 'INFY', name: 'Infosys Ltd.' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.' },
    { symbol: 'ITC', name: 'ITC Ltd.' },
    { symbol: 'SBIN', name: 'State Bank of India' }
  ];
  
  // Add some US stocks
  const usStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'META', name: 'Meta Platforms, Inc.' },
    { symbol: 'NFLX', name: 'Netflix, Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  ];
  
  const stockOptions = [...indianStocks, ...usStocks];
  const selectedStockInfo = stockOptions.find(stock => stock.symbol === selectedStock);
  
  // Handler for data updates
  const handleDataUpdate = () => {
    setLastUpdated(new Date());
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Live Stock Chart Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Test the real-time chart capabilities across different visualizations and timeframes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'connecting' ? 'outline' : 'destructive'}
            className="px-2 py-1">
            {connectionStatus === 'connected' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-green-500 mr-1 inline-block animate-pulse"></span>
                Live
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1 inline-block animate-pulse"></span>
                Connecting...
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-red-500 mr-1 inline-block"></span>
                Disconnected
              </>
            )}
          </Badge>
          
          <Select
            value={selectedStock}
            onValueChange={setSelectedStock}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a stock</SelectItem>
              
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Indian Stocks
              </div>
              {indianStocks.map(stock => (
                <SelectItem key={stock.symbol} value={stock.symbol}>
                  {stock.symbol} - {stock.name}
                </SelectItem>
              ))}
              
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                US Stocks
              </div>
              {usStocks.map(stock => (
                <SelectItem key={stock.symbol} value={stock.symbol}>
                  {stock.symbol} - {stock.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px] mb-4">
          <TabsTrigger value="chart">
            <CandlestickChart className="h-4 w-4 mr-2" /> Chart Visualization
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <TrendingUp className="h-4 w-4 mr-2" /> Stock Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Settings */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Chart Settings</CardTitle>
                <CardDescription>
                  Customize visualization and data options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium block">
                    Chart Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={chartType === 'line' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setChartType('line')}
                      className="flex items-center">
                      <LineChart className="h-4 w-4 mr-2" />
                      Line
                    </Button>
                    <Button 
                      variant={chartType === 'area' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setChartType('area')}
                      className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Area
                    </Button>
                    <Button 
                      variant={chartType === 'bar' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setChartType('bar')}
                      className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Bar
                    </Button>
                    <Button 
                      variant={chartType === 'candlestick' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setChartType('candlestick')}
                      className="flex items-center">
                      <CandlestickChart className="h-4 w-4 mr-2" />
                      Candlestick
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium block">
                    Timeframe
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={timeframe === 'intraday' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTimeframe('intraday')}
                      className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Intraday
                    </Button>
                    <Button 
                      variant={timeframe === 'daily' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTimeframe('daily')}
                      className="flex items-center">
                      Daily
                    </Button>
                    <Button 
                      variant={timeframe === 'weekly' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTimeframe('weekly')}
                      className="flex items-center">
                      Weekly
                    </Button>
                    <Button 
                      variant={timeframe === 'monthly' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTimeframe('monthly')}
                      className="flex items-center">
                      Monthly
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {connectionStatus === 'connected' ? (
                      <>Live updates are active. Last updated: {lastUpdated.toLocaleTimeString()}</>
                    ) : connectionStatus === 'connecting' ? (
                      <>Connecting to real-time data feed...</>
                    ) : (
                      <>Disconnected from real-time data feed. Using static data.</>
                    )}
                  </p>
                  
                  {selectedStockInfo && (
                    <div className="p-3 bg-muted rounded-md text-sm">
                      <div className="font-medium">{selectedStockInfo.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Symbol: {selectedStockInfo.symbol}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Main Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{selectedStockInfo?.name || selectedStock} Real-Time Chart</span>
                  {connectionStatus === 'connected' && (
                    <Badge variant="outline" className="ml-2 text-xs font-normal">
                      <Clock className="h-3 w-3 mr-1" />
                      Real-time
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {timeframe === 'intraday' ? 'Intraday prices with 15-minute intervals' :
                   timeframe === 'daily' ? 'Daily price movements' :
                   timeframe === 'weekly' ? 'Weekly price movements' : 'Monthly price trends'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedStock ? (
                  <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-md border border-dashed">
                    <div className="text-center">
                      <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <h3 className="text-lg font-medium">No Stock Selected</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Please select a stock from the dropdown above to view its chart.
                      </p>
                    </div>
                  </div>
                ) : (
                  <LiveStockChart 
                    symbol={selectedStock} 
                    companyName={selectedStockInfo?.name} 
                    defaultChartType={chartType}
                    defaultTimeframe={timeframe}
                    height={400}
                    showControls={false}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Technical Analysis for {selectedStockInfo?.name || selectedStock}</CardTitle>
              <CardDescription>
                Comprehensive market analysis and stock performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedStock ? (
                <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-md border border-dashed">
                  <div className="text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-lg font-medium">No Stock Selected</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please select a stock from the dropdown above to view its analysis.
                    </p>
                  </div>
                </div>
              ) : (
                <StockAnalysis stockSymbol={selectedStock} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockChartDemo;