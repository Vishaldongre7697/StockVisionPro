import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ArrowUpRight, TrendingDown, Play, Pause, Settings, Save } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const Algotrade = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('strategy');
  const [isRunning, setIsRunning] = useState(false);

  // Mock data for algotrade strategies
  const strategies = [
    {
      id: 1,
      name: 'Bollinger Breakout',
      performance: 68.2,
      profit: 12500,
      trades: 105,
      winRate: 62
    },
    {
      id: 2,
      name: 'MACD Crossover',
      performance: 54.7,
      profit: 8700,
      trades: 87,
      winRate: 58
    },
    {
      id: 3,
      name: 'RSI Oversold',
      performance: 72.3,
      profit: 16400,
      trades: 112,
      winRate: 65
    }
  ];

  const handleStrategyAction = (action: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to use algorithmic trading features",
        variant: "destructive"
      });
      return;
    }

    if (action === 'run') {
      setIsRunning(!isRunning);
      toast({
        title: isRunning ? "Strategy Stopped" : "Strategy Started",
        description: isRunning ? "Your strategy is now paused" : "Your strategy is now running",
        variant: "default"
      });
    } else if (action === 'save') {
      toast({
        title: "Strategy Saved",
        description: "Your strategy has been saved successfully",
        variant: "default"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Algorithmic Trading</h1>
      </div>

      <Tabs defaultValue="strategy" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="strategy">Strategy Builder</TabsTrigger>
          <TabsTrigger value="backtest">Backtest</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Your Trading Strategy</CardTitle>
              <CardDescription>
                Drag and drop indicators to create a custom trading algorithm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center mb-4">
                <p className="text-gray-500 dark:text-gray-400">
                  Drag indicators, oscillators and other trading rules here to build your strategy
                </p>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm">RSI &lt; 30</Button>
                  <Button variant="outline" size="sm">MACD Crossover</Button>
                  <Button variant="outline" size="sm">Volume Spike</Button>
                  <Button variant="outline" size="sm">+</Button>
                </div>
              </div>
              
              <div className="flex space-x-2 justify-end">
                <Button variant="outline" onClick={() => handleStrategyAction('save')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button 
                  variant={isRunning ? "destructive" : "default"}
                  onClick={() => handleStrategyAction('run')}
                >
                  {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isRunning ? 'Stop' : 'Run'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indicator Library</CardTitle>
              <CardDescription>
                Select from a wide range of technical indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start">
                  RSI
                </Button>
                <Button variant="outline" className="justify-start">
                  MACD
                </Button>
                <Button variant="outline" className="justify-start">
                  Bollinger Bands
                </Button>
                <Button variant="outline" className="justify-start">
                  Volume
                </Button>
                <Button variant="outline" className="justify-start">
                  EMA
                </Button>
                <Button variant="outline" className="justify-start">
                  Stochastic
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backtest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backtest Results</CardTitle>
              <CardDescription>
                Performance metrics based on historical data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Win Rate</p>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">64.8%</span>
                    <ArrowUpRight className="ml-2 h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Return</p>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">₹13,450</span>
                    <ArrowUpRight className="ml-2 h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Drawdown</p>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">8.2%</span>
                    <TrendingDown className="ml-2 h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Trades</p>
                  <span className="text-2xl font-bold">87</span>
                </div>
              </div>

              <div className="h-64 border border-gray-200 dark:border-gray-700 rounded-md p-2 mb-4">
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-center">Chart visualization of backtest performance</p>
                </div>
              </div>

              <Button>
                <Settings className="mr-2 h-4 w-4" />
                Adjust Parameters
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between">
                    {strategy.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      {strategy.trades} trades
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Performance</p>
                      <div className="text-xl font-medium flex items-center">
                        {strategy.performance}%
                        {strategy.performance > 60 ? (
                          <ChevronUp className="h-4 w-4 text-green-500 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-red-500 ml-1" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-muted-foreground">Profit</p>
                      <p className="text-xl font-medium">₹{strategy.profit.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Win Rate</span>
                      <span className="font-medium">{strategy.winRate}%</span>
                    </div>
                    <Progress value={strategy.winRate} />
                  </div>
                  
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button size="sm">Run</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Create New Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-dashed">
                <span className="text-xl font-light mr-1">+</span> New Strategy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Algotrade;