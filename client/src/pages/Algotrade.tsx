import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ArrowUpRight, TrendingDown, Play, Pause, Settings, Save, 
         AlertTriangle, CheckCircle, RefreshCcw, PieChart, BarChart4, LineChart, Brain, 
         Layers, Activity, DollarSign, Link, Laptop, Code, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const Algotrade = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('strategy');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedConditionSet, setSelectedConditionSet] = useState<string>('entry');
  const [selectedStrategyForBacktest, setSelectedStrategyForBacktest] = useState(1);
  const [riskLevel, setRiskLevel] = useState<string>('medium');
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed'>('open');
  const [activeStrategies, setActiveStrategies] = useState<number[]>([3]);
  const [backtestPeriod, setBacktestPeriod] = useState('3m');

  // Mock data for algotrade strategies
  const strategies = [
    {
      id: 1,
      name: 'Bollinger Breakout',
      performance: 68.2,
      profit: 12500,
      trades: 105,
      winRate: 62,
      description: 'Trades breakouts from Bollinger Bands with volume confirmation',
      riskLevel: 'medium',
      createdAt: '2023-12-01',
      indicators: ['Bollinger Bands', 'Volume'],
      timeframe: '1d'
    },
    {
      id: 2,
      name: 'MACD Crossover',
      performance: 54.7,
      profit: 8700,
      trades: 87,
      winRate: 58,
      description: 'Triggers on MACD signal line crossovers with trend confirmation',
      riskLevel: 'low',
      createdAt: '2024-01-15',
      indicators: ['MACD', 'EMA'],
      timeframe: '4h'
    },
    {
      id: 3,
      name: 'RSI Oversold',
      performance: 72.3,
      profit: 16400,
      trades: 112,
      winRate: 65,
      description: 'Buys when RSI indicates oversold conditions with support confirmation',
      riskLevel: 'medium',
      createdAt: '2024-02-22',
      indicators: ['RSI', 'Support/Resistance'],
      timeframe: '1d'
    },
    {
      id: 4,
      name: 'Volume Breakout',
      performance: 48.5,
      profit: -2100,
      trades: 63,
      winRate: 42,
      description: 'Trades unusual volume spikes with price action confirmation',
      riskLevel: 'high',
      createdAt: '2024-03-10',
      indicators: ['Volume', 'Price Action'],
      timeframe: '1h'
    }
  ];

  const indicators = [
    { id: 1, name: 'RSI', description: 'Relative Strength Index', category: 'Oscillator' },
    { id: 2, name: 'MACD', description: 'Moving Average Convergence Divergence', category: 'Momentum' },
    { id: 3, name: 'Bollinger Bands', description: 'Volatility bands around moving average', category: 'Volatility' },
    { id: 4, name: 'Volume', description: 'Trading volume analysis', category: 'Volume' },
    { id: 5, name: 'EMA', description: 'Exponential Moving Average', category: 'Trend' },
    { id: 6, name: 'Stochastic', description: 'Stochastic Oscillator', category: 'Oscillator' },
    { id: 7, name: 'ATR', description: 'Average True Range', category: 'Volatility' },
    { id: 8, name: 'OBV', description: 'On-Balance Volume', category: 'Volume' },
    { id: 9, name: 'Ichimoku Cloud', description: 'Comprehensive trend indicator', category: 'Trend' },
    { id: 10, name: 'Fibonacci Retracement', description: 'Key price levels based on Fibonacci', category: 'Support/Resistance' },
    { id: 11, name: 'Support/Resistance', description: 'Key price levels', category: 'Support/Resistance' },
    { id: 12, name: 'Price Action', description: 'Candlestick patterns and price formations', category: 'Pattern' }
  ];

  const marketData = [
    { id: 1, symbol: 'AAPL', name: 'Apple Inc', price: 178.72, change: 0.65, volume: 23456789 },
    { id: 2, symbol: 'MSFT', name: 'Microsoft Corp', price: 344.15, change: 1.23, volume: 15678234 },
    { id: 3, symbol: 'NFLX', name: 'Netflix Inc', price: 403.08, change: -2.14, volume: 7890123 },
    { id: 4, symbol: 'AMZN', name: 'Amazon.com Inc', price: 135.07, change: 0.87, volume: 12345678 },
    { id: 5, symbol: 'RELIANCE', name: 'Reliance Industries', price: 2567.85, change: 1.54, volume: 5432167 }
  ];

  const recentTrades = [
    { id: 1, symbol: 'MSFT', action: 'BUY', quantity: 5, price: 339.75, timestamp: '2024-04-06 10:23:45', strategy: 'RSI Oversold' },
    { id: 2, symbol: 'NFLX', action: 'SELL', quantity: 2, price: 412.30, timestamp: '2024-04-05 15:42:18', strategy: 'Bollinger Breakout' },
    { id: 3, symbol: 'RELIANCE', action: 'BUY', quantity: 10, price: 2530.45, timestamp: '2024-04-04 11:17:32', strategy: 'MACD Crossover' }
  ];

  const aiInsights = [
    { id: 1, type: 'pattern', description: 'Head and Shoulders pattern forming on NFLX daily chart', confidence: 78, action: 'Consider adding to watchlist' },
    { id: 2, type: 'sentiment', description: 'Unusual positive sentiment detected for AAPL in social media', confidence: 82, action: 'Monitor for trading opportunities' },
    { id: 3, type: 'risk', description: 'RSI Oversold strategy showing abnormal drawdown in current market', confidence: 65, action: 'Consider reducing position sizes temporarily' }
  ];

  const scenarioSettings = {
    marketCondition: 'bullish',
    volatility: 'normal',
    tradingHours: 'extended',
    simulatedLatency: 'low'
  };

  const handleStrategyAction = (action: string, strategyId?: number) => {
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
    } else if (action === 'toggle') {
      if (strategyId) {
        if (activeStrategies.includes(strategyId)) {
          setActiveStrategies(activeStrategies.filter(id => id !== strategyId));
          toast({
            title: "Strategy Deactivated",
            description: `${strategies.find(s => s.id === strategyId)?.name} has been deactivated`,
            variant: "default"
          });
        } else {
          setActiveStrategies([...activeStrategies, strategyId]);
          toast({
            title: "Strategy Activated",
            description: `${strategies.find(s => s.id === strategyId)?.name} has been activated`,
            variant: "default"
          });
        }
      }
    } else if (action === 'backtest') {
      toast({
        title: "Backtest Started",
        description: "Running backtest for the selected strategy...",
        variant: "default"
      });
      // In a real app, this would trigger the backtest process
    }
  };

  const handleConditionSetChange = (value: string) => {
    setSelectedConditionSet(value);
  };

  const riskLevelColor = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-red-500"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold">Algorithmic Trading</h1>
          <p className="text-muted-foreground">AI-powered trading with custom strategies and automated execution</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${marketStatus === 'open' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">Market {marketStatus === 'open' ? 'Open' : 'Closed'}</span>
          </div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5 min</SelectItem>
              <SelectItem value="15m">15 min</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="4h">4 hours</SelectItem>
              <SelectItem value="1d">1 day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="strategy" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="strategy">Strategy Builder</TabsTrigger>
              <TabsTrigger value="backtest">Backtest</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="execution">Trade Execution</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="strategy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Build Your Trading Strategy</span>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showAIInsights}
                        onCheckedChange={setShowAIInsights}
                        id="ai-insights"
                      />
                      <Label htmlFor="ai-insights" className="text-sm">AI Insights</Label>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Design a custom trading algorithm with technical indicators and AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4 mb-4">
                    <div className="space-y-2 flex-1">
                      <Label>Strategy Name</Label>
                      <Input placeholder="My Custom Strategy" />
                    </div>
                    <div className="space-y-2 w-32">
                      <Label>Risk Level</Label>
                      <Select value={riskLevel} onValueChange={setRiskLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Risk Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <TabsList className="flex-1">
                        <TabsTrigger 
                          value="entry" 
                          onClick={() => handleConditionSetChange('entry')}
                          className={selectedConditionSet === 'entry' ? 'flex-1' : 'flex-1'}
                        >
                          Entry Conditions
                        </TabsTrigger>
                        <TabsTrigger 
                          value="exit" 
                          onClick={() => handleConditionSetChange('exit')}
                          className={selectedConditionSet === 'exit' ? 'flex-1' : 'flex-1'}
                        >
                          Exit Conditions
                        </TabsTrigger>
                        <TabsTrigger 
                          value="risk" 
                          onClick={() => handleConditionSetChange('risk')}
                          className={selectedConditionSet === 'risk' ? 'flex-1' : 'flex-1'}
                        >
                          Risk Management
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {selectedConditionSet === 'entry' && "Define rules for entering trades. Drag indicators and set conditions below."}
                        {selectedConditionSet === 'exit' && "Define rules for exiting trades. Set profit targets and stop-loss conditions."}
                        {selectedConditionSet === 'risk' && "Set position sizing, max drawdown limits, and other risk parameters."}
                      </p>

                      <div className="mb-4">
                        {selectedConditionSet === 'entry' && (
                          <div className="flex flex-col space-y-2">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">AND</Badge>
                                <span>RSI &lt; 30 (1D timeframe)</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">×</Button>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">AND</Badge>
                                <span>MACD Crossover (Signal crosses MACD from below)</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">×</Button>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">AND</Badge>
                                <span>Volume &gt; 20-day average volume * 1.5</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">×</Button>
                            </div>
                          </div>
                        )}

                        {selectedConditionSet === 'exit' && (
                          <div className="flex flex-col space-y-2">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">OR</Badge>
                                <span>Profit target: Entry price + 5%</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">×</Button>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">OR</Badge>
                                <span>Stop loss: Entry price - 2%</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">×</Button>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">OR</Badge>
                                <span>RSI &gt; 70</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">×</Button>
                            </div>
                          </div>
                        )}

                        {selectedConditionSet === 'risk' && (
                          <div className="flex flex-col space-y-2">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">RULE</Badge>
                                <span>Position size: 2% of portfolio</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">×</Button>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">RULE</Badge>
                                <span>Max open positions: 5</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">×</Button>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">RULE</Badge>
                                <span>Max daily drawdown: 5%</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">×</Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <Button variant="outline" size="sm">
                          + Add Condition
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 justify-end mt-4">
                    <Button variant="outline" onClick={() => handleStrategyAction('save')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Strategy
                    </Button>
                    <Button 
                      variant={isRunning ? "destructive" : "default"}
                      onClick={() => handleStrategyAction('run')}
                    >
                      {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {isRunning ? 'Stop Strategy' : 'Run Strategy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {showAIInsights && (
                <Card className="border-t-4 border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      AI Strategy Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/5 rounded-md">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">Optimization Suggestion</span>
                          <Badge variant="outline" className="text-xs">95% confidence</Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground">Change RSI threshold from 30 to 35 to increase win rate by approximately 12% based on 6-month backtest</p>
                      </div>
                      <div className="p-3 bg-primary/5 rounded-md">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">Risk Assessment</span>
                          <Badge variant="outline" className="text-xs">87% confidence</Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground">Current strategy has 24% higher volatility than market benchmark. Consider adding ATR-based position sizing</p>
                      </div>
                      <div className="p-3 bg-primary/5 rounded-md">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">Pattern Recognition</span>
                          <Badge variant="outline" className="text-xs">82% confidence</Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground">Strategy performs 42% better in trending markets vs. ranging markets. Consider adding trend filter</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Indicator Library</CardTitle>
                  <CardDescription>
                    Select from a wide range of technical indicators to build your strategy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {indicators.map(indicator => (
                      <div key={indicator.id} className="border rounded-md p-2 hover:border-primary cursor-pointer transition-colors">
                        <div className="font-medium truncate">{indicator.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{indicator.description}</div>
                        <Badge variant="outline" className="mt-1 text-xs">{indicator.category}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backtest" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Backtest Results</CardTitle>
                      <CardDescription>
                        Performance metrics based on historical data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                          <p className="text-sm font-medium">Max Drawdown</p>
                          <div className="flex items-center">
                            <span className="text-2xl font-bold">8.2%</span>
                            <TrendingDown className="ml-2 h-4 w-4 text-red-500" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Sharpe Ratio</p>
                          <span className="text-2xl font-bold">1.73</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Win Rate</span>
                            <span className="font-medium">64.8%</span>
                          </div>
                          <Progress value={64.8} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Profit Factor</span>
                            <span className="font-medium">2.3</span>
                          </div>
                          <Progress value={76.7} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Avg Win/Loss Ratio</span>
                            <span className="font-medium">1.8</span>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Recovery Factor</span>
                            <span className="font-medium">3.4</span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                      </div>

                      <div className="h-64 border border-gray-200 dark:border-gray-700 rounded-md p-2 mb-6">
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <LineChart className="h-10 w-10 mx-auto mb-2 text-primary/60" />
                            <p className="text-muted-foreground">Performance chart comparing strategy returns to market benchmark</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Trade Distribution</h4>
                          <div className="border rounded-md overflow-hidden">
                            <div className="flex h-6">
                              <div className="bg-green-500 h-full" style={{ width: '64.8%' }}></div>
                              <div className="bg-red-500 h-full" style={{ width: '35.2%' }}></div>
                            </div>
                            <div className="flex justify-between text-xs p-1">
                              <span>Win: 64.8%</span>
                              <span>Loss: 35.2%</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Monthly Returns</h4>
                          <div className="grid grid-cols-6 gap-1 h-24">
                            <div className="bg-green-500/80 rounded-sm" style={{ height: '60%' }}></div>
                            <div className="bg-green-500/80 rounded-sm" style={{ height: '75%' }}></div>
                            <div className="bg-red-500/80 rounded-sm" style={{ height: '20%' }}></div>
                            <div className="bg-green-500/80 rounded-sm" style={{ height: '90%' }}></div>
                            <div className="bg-green-500/80 rounded-sm" style={{ height: '45%' }}></div>
                            <div className="bg-red-500/80 rounded-sm" style={{ height: '15%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Run New Backtest
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="mr-2 h-4 w-4" />
                          Adjust Parameters
                        </Button>
                        <Button variant="outline" size="sm">
                          <Activity className="mr-2 h-4 w-4" />
                          Monte Carlo Simulation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Backtest Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Strategy</Label>
                      <Select 
                        value={selectedStrategyForBacktest.toString()} 
                        onValueChange={(v) => setSelectedStrategyForBacktest(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          {strategies.map((strategy) => (
                            <SelectItem key={strategy.id} value={strategy.id.toString()}>
                              {strategy.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Time Period</Label>
                      <Select value={backtestPeriod} onValueChange={setBacktestPeriod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1m">1 Month</SelectItem>
                          <SelectItem value="3m">3 Months</SelectItem>
                          <SelectItem value="6m">6 Months</SelectItem>
                          <SelectItem value="1y">1 Year</SelectItem>
                          <SelectItem value="3y">3 Years</SelectItem>
                          <SelectItem value="5y">5 Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Initial Capital</Label>
                      <Input type="number" defaultValue="100000" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Position Size</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" defaultValue="5" className="w-20" />
                        <span>% of capital</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Include Trading Fees</Label>
                        <Switch defaultChecked id="include-fees" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Include Slippage</Label>
                        <Switch defaultChecked id="include-slippage" />
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handleStrategyAction('backtest')}
                    >
                      Run Backtest
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Trade Analysis</CardTitle>
                  <CardDescription>
                    Detailed breakdown of backtest trades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left p-2">Asset</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Entry</th>
                          <th className="text-left p-2">Exit</th>
                          <th className="text-left p-2">P&L</th>
                          <th className="text-left p-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2">AAPL</td>
                          <td className="p-2">Long</td>
                          <td className="p-2">$167.35</td>
                          <td className="p-2">$178.72</td>
                          <td className="p-2 text-green-500">+6.79%</td>
                          <td className="p-2">14 days</td>
                        </tr>
                        <tr className="border-t bg-muted/50">
                          <td className="p-2">MSFT</td>
                          <td className="p-2">Long</td>
                          <td className="p-2">$333.45</td>
                          <td className="p-2">$344.15</td>
                          <td className="p-2 text-green-500">+3.21%</td>
                          <td className="p-2">7 days</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">AMZN</td>
                          <td className="p-2">Long</td>
                          <td className="p-2">$142.83</td>
                          <td className="p-2">$135.07</td>
                          <td className="p-2 text-red-500">-5.43%</td>
                          <td className="p-2">5 days</td>
                        </tr>
                        <tr className="border-t bg-muted/50">
                          <td className="p-2">NFLX</td>
                          <td className="p-2">Long</td>
                          <td className="p-2">$386.50</td>
                          <td className="p-2">$412.30</td>
                          <td className="p-2 text-green-500">+6.68%</td>
                          <td className="p-2">11 days</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">RELIANCE</td>
                          <td className="p-2">Long</td>
                          <td className="p-2">₹2,492.15</td>
                          <td className="p-2">₹2,567.85</td>
                          <td className="p-2 text-green-500">+3.04%</td>
                          <td className="p-2">3 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Active Strategies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{activeStrategies.length}</div>
                    <p className="text-sm text-muted-foreground">of {strategies.length} total strategies</p>
                    <Progress value={(activeStrategies.length / strategies.length) * 100} className="h-2 mt-2" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Today's Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-500">+₹1,230</div>
                    <p className="text-sm text-muted-foreground">+0.68% from yesterday</p>
                    <div className="h-10 mt-2">
                      <div className="border-b border-green-500 relative h-5">
                        <div className="absolute left-0 bottom-0 w-1/3 border-r border-green-400 h-full"></div>
                        <div className="absolute left-1/3 bottom-0 w-1/3 border-r border-green-400 h-3/4"></div>
                        <div className="absolute left-2/3 bottom-0 w-1/3 border-r border-green-400 h-full"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pending Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">2</div>
                    <p className="text-sm text-muted-foreground">Waiting for execution</p>
                    <div className="flex justify-between mt-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Buy MSFT</Badge>
                      <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Sell AMZN</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {strategies.map((strategy) => (
                  <Card key={strategy.id} className={activeStrategies.includes(strategy.id) ? "border-l-4 border-l-green-500" : ""}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between">
                        <span className="flex items-center">
                          {strategy.name}
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${riskLevelColor[strategy.riskLevel as keyof typeof riskLevelColor]}`}
                          >
                            {strategy.riskLevel}
                          </Badge>
                        </span>
                        <span className="text-sm font-normal text-muted-foreground">
                          {strategy.trades} trades
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {strategy.description}
                      </CardDescription>
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
                          <p className="text-xl font-medium">
                            {strategy.profit >= 0 ? '₹' : '-₹'}
                            {Math.abs(strategy.profit).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Win Rate</span>
                          <span className="font-medium">{strategy.winRate}%</span>
                        </div>
                        <Progress value={strategy.winRate} />
                      </div>
                      
                      <div className="mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Activity className="h-3 w-3 mr-1" />
                            <span>{strategy.timeframe}</span>
                          </div>
                          <div>
                            {strategy.indicators.join(', ')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4 space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Details</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{strategy.name}</DialogTitle>
                              <DialogDescription>{strategy.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm font-medium mb-1">Performance</div>
                                  <div className="text-2xl font-bold">{strategy.performance}%</div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium mb-1">Win Rate</div>
                                  <div className="text-2xl font-bold">{strategy.winRate}%</div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium mb-1">Profit</div>
                                  <div className="text-2xl font-bold">₹{strategy.profit.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium mb-1">Total Trades</div>
                                  <div className="text-2xl font-bold">{strategy.trades}</div>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <div className="text-sm font-medium mb-2">Strategy Composition</div>
                                <div className="space-y-2">
                                  {strategy.indicators.map((indicator, i) => (
                                    <div key={i} className="flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                                      <span>{indicator}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-sm font-medium mb-2">Strategy Details</div>
                                <div className="text-sm">
                                  <div className="flex justify-between mb-1">
                                    <span>Created</span>
                                    <span>{strategy.createdAt}</span>
                                  </div>
                                  <div className="flex justify-between mb-1">
                                    <span>Timeframe</span>
                                    <span>{strategy.timeframe}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Risk Level</span>
                                    <span className={riskLevelColor[strategy.riskLevel as keyof typeof riskLevelColor]}>
                                      {strategy.riskLevel.charAt(0).toUpperCase() + strategy.riskLevel.slice(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline">Edit Strategy</Button>
                              <Button onClick={() => handleStrategyAction('backtest')}>Run Backtest</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant={activeStrategies.includes(strategy.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStrategyAction('toggle', strategy.id)}
                        >
                          {activeStrategies.includes(strategy.id) ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Create New Strategy</CardTitle>
                  <CardDescription>Start building a custom trading algorithm</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed"
                    onClick={() => setActiveTab('strategy')}
                  >
                    <span className="text-xl font-light mr-1">+</span> New Strategy
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="execution" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Automated Trade Execution</CardTitle>
                      <CardDescription>
                        Configure and monitor your automated trading settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-md flex flex-col items-center justify-center text-center">
                          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                          <h3 className="font-medium">Connected</h3>
                          <p className="text-sm text-muted-foreground">Broker API</p>
                        </div>
                        
                        <div className="p-4 border rounded-md flex flex-col items-center justify-center text-center">
                          <Activity className="h-8 w-8 text-green-500 mb-2" />
                          <h3 className="font-medium">Active</h3>
                          <p className="text-sm text-muted-foreground">Trading Status</p>
                        </div>
                        
                        <div className="p-4 border rounded-md flex flex-col items-center justify-center text-center">
                          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                          <h3 className="font-medium">30ms</h3>
                          <p className="text-sm text-muted-foreground">Average Latency</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-md font-medium mb-2">Execution Settings</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="cursor-pointer">Auto-Execute Trades</Label>
                            <Switch defaultChecked id="auto-execute" />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="cursor-pointer">Require Confirmation Above ₹50,000</Label>
                            <Switch defaultChecked id="confirm-large" />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="cursor-pointer">Use Market Orders</Label>
                            <Switch id="market-orders" />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="cursor-pointer">Follow AI Suggestions</Label>
                            <Switch defaultChecked id="ai-suggestions" />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-md font-medium mb-2">Recent Trade Executions</h3>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted">
                                <th className="text-left p-2">Symbol</th>
                                <th className="text-left p-2">Action</th>
                                <th className="text-left p-2">Quantity</th>
                                <th className="text-left p-2">Price</th>
                                <th className="text-left p-2">Time</th>
                                <th className="text-left p-2">Strategy</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentTrades.map(trade => (
                                <tr key={trade.id} className="border-t">
                                  <td className="p-2 font-medium">{trade.symbol}</td>
                                  <td className="p-2">
                                    <Badge variant={trade.action === 'BUY' ? 'default' : 'destructive'}>
                                      {trade.action}
                                    </Badge>
                                  </td>
                                  <td className="p-2">{trade.quantity}</td>
                                  <td className="p-2">
                                    {trade.symbol === 'RELIANCE' ? '₹' : '$'}{trade.price}
                                  </td>
                                  <td className="p-2 text-muted-foreground">{trade.timestamp.split(' ')[1]}</td>
                                  <td className="p-2 text-muted-foreground">{trade.strategy}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Market Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {marketData.map(stock => (
                          <div key={stock.id} className="flex items-center justify-between p-2 border-b">
                            <div>
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-xs text-muted-foreground">{stock.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {stock.symbol === 'RELIANCE' ? '₹' : '$'}{stock.price}
                              </div>
                              <div className={`text-xs ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {stock.change >= 0 ? '+' : ''}{stock.change}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>Broker Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 border rounded-md flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Link className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium">Connected</div>
                          <div className="text-sm text-muted-foreground">Interactive Brokers</div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Available Balance</Label>
                        <div className="text-2xl font-bold mt-1">₹124,500</div>
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Configure Broker Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI-Driven Market Insights
                  </CardTitle>
                  <CardDescription>
                    Real-time AI analysis to enhance your trading decisions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiInsights.map(insight => (
                      <div key={insight.id} className="p-4 border rounded-md">
                        <div className="flex justify-between mb-2">
                          <Badge variant="outline">
                            {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                          </Badge>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Confidence: </span>
                            <span className="font-medium">{insight.confidence}%</span>
                          </div>
                        </div>
                        <p className="mb-2">{insight.description}</p>
                        <div className="text-sm text-primary font-medium">
                          {insight.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure global algorithmic trading settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">Trading Hours</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input type="time" defaultValue="09:15" />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input type="time" defaultValue="15:30" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">Risk Management</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Max Daily Loss</Label>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue="5" className="w-20" />
                          <span>% of portfolio</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Max Position Size</Label>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue="10" className="w-20" />
                          <span>% of portfolio</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Default Stop Loss</Label>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue="2" className="w-20" />
                          <span>% from entry</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="cursor-pointer">Trade Executions</Label>
                        <Switch defaultChecked id="notify-trades" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="cursor-pointer">Strategy Alerts</Label>
                        <Switch defaultChecked id="notify-alerts" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="cursor-pointer">AI Insights</Label>
                        <Switch defaultChecked id="notify-insights" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">API Connections</h3>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-md flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium">Interactive Brokers</div>
                            <div className="text-xs text-muted-foreground">Last synced: Today, 10:23 AM</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      <div className="p-3 border rounded-md flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <div className="font-medium">Alpha Vantage</div>
                            <div className="text-xs text-muted-foreground">API key needs renewal</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Update</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button className="ml-auto">Save Settings</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">High-Frequency Trading</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="cursor-pointer">Enable HFT Mode</Label>
                        <Switch id="enable-hft" />
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Order Interval</Label>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue="500" className="w-20" disabled={true} />
                          <span>milliseconds</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">Scenario Modeling</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Market Condition</Label>
                        <Select defaultValue={scenarioSettings.marketCondition}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bullish">Bullish</SelectItem>
                            <SelectItem value="bearish">Bearish</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                            <SelectItem value="volatile">Volatile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Volatility</Label>
                        <Select defaultValue={scenarioSettings.volatility}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select volatility" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="extreme">Extreme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">System Resources</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Processing Power</Label>
                        <div className="space-y-1 w-2/3">
                          <div className="flex justify-between text-xs">
                            <span>Efficiency</span>
                            <span>Performance</span>
                          </div>
                          <Progress value={70} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">Developer Options</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="flex items-center justify-center">
                        <Code className="mr-2 h-4 w-4" />
                        Export Strategy Code
                      </Button>
                      <Button variant="outline" className="flex items-center justify-center">
                        <Laptop className="mr-2 h-4 w-4" />
                        View Debug Console
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Strategy Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-44 border border-gray-200 dark:border-gray-700 rounded-md p-2 mb-4">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <LineChart className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                    <p className="text-muted-foreground text-xs">Performance chart comparing all strategies</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {strategies.slice(0, 3).map((strategy) => (
                  <div key={strategy.id} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${strategy.performance > 60 ? 'bg-green-500' : strategy.performance > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <div className="flex-1 text-sm truncate">{strategy.name}</div>
                    <div className={`text-sm font-medium ${strategy.performance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {strategy.performance > 0 ? '+' : ''}{strategy.performance}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Market Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">AAPL</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500">Buy</Badge>
                </div>
                <div className="text-sm text-muted-foreground">RSI oversold condition detected</div>
              </div>
              
              <div className="p-3 border rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">NFLX</span>
                  <Badge variant="outline" className="bg-red-500/10 text-red-500">Sell</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Breaking below support level</div>
              </div>
              
              <div className="p-3 border rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">MSFT</span>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500">Watch</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Approaching key resistance level</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-primary/5 rounded-md">
                <p className="font-medium mb-1">Market Trend Analysis</p>
                <p className="text-muted-foreground">Current market conditions favor momentum strategies with stop-losses at 2.5%</p>
              </div>
              
              <div className="p-3 bg-primary/5 rounded-md">
                <p className="font-medium mb-1">Volatility Prediction</p>
                <p className="text-muted-foreground">Expect increased volatility in tech sector over next 48 hours</p>
              </div>
              
              <div className="p-3 bg-primary/5 rounded-md">
                <p className="font-medium mb-1">Strategy Recommendation</p>
                <p className="text-muted-foreground">Consider RSI Oversold strategy for current market conditions</p>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                View All AI Insights
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Algotrade;