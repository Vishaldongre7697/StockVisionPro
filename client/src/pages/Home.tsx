import { Search, TrendingUp, ArrowUpRight, ArrowDownRight, Home as HomeIcon, 
         ChartBar, Calendar, Zap, Award, Eye, Brain, BarChart4, LineChart, AreaChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Stock } from '@shared/schema';
import { cn } from '@/lib/utils';

const Home = () => {
  const { user } = useAuth();
  
  // Fetch top stocks
  const { data: topStocks } = useQuery({
    queryKey: ['/api/stocks/top'],
    queryFn: getQueryFn<Stock[]>({ on401: 'returnNull' })
  });

  // Fetch all stocks for search functionality
  const { data: allStocks } = useQuery({
    queryKey: ['/api/stocks'],
    queryFn: getQueryFn<Stock[]>({ on401: 'returnNull' })
  });

  // Market summary data
  const marketSummary = {
    text: "Nifty 50 is up 1.2% with strong FII inflows. IT and Banking sectors showing positive momentum. Global markets are mixed with US futures pointing higher.",
    indices: [
      { name: "NIFTY 50", value: 22875.50, change: 275.45, changePercent: 1.22 },
      { name: "SENSEX", value: 75245.35, change: 882.05, changePercent: 1.18 },
      { name: "BANKNIFTY", value: 48230.75, change: 615.80, changePercent: 1.29 },
      { name: "NIFTYIT", value: 35980.60, change: -125.40, changePercent: -0.35 }
    ]
  };

  const aiInsights = [
    {
      id: 1,
      title: "Market Trend Analysis",
      description: "Positive momentum in Nifty with potential for further upside. Support at 22,700.",
      confidence: 85,
      tags: ["Bullish", "Technical"]
    },
    {
      id: 2,
      title: "Sector Rotation Alert",
      description: "Capital rotation from IT to Banking sector expected in the coming week based on earnings outlook.",
      confidence: 78,
      tags: ["Sector", "Rotation"]
    },
    {
      id: 3,
      title: "Volatility Forecast",
      description: "Increased volatility expected around upcoming Fed meeting. Risk management advised.",
      confidence: 82,
      tags: ["Volatility", "Risk"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Mobile Search Bar - Visible only on small screens */}
      <div className="relative md:hidden">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search stocks, indices..." 
          className="pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      
      {/* Welcome Card */}
      <Card className="card-gradient card-hover overflow-hidden border-gray-200/50 dark:border-gray-700/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mb-12"></div>
        
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-xl md:text-2xl font-bold">
            <span className="text-gradient">Welcome back, {user?.fullName || user?.username || 'Trader'}</span>
          </CardTitle>
          <CardDescription className="text-base">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
            {marketSummary.text}
          </p>
          
          <div className="dashboard-grid">
            {marketSummary.indices.map((index) => (
              <Card key={index.name} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-medium">{index.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold">
                          {index.value.toLocaleString('en-IN', { 
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                          })}
                        </span>
                        <div className={cn(
                          "text-sm font-medium flex items-center",
                          index.changePercent > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {index.changePercent > 0 ? (
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                          )}
                          {(index.changePercent > 0 ? '+' : '') + index.change.toFixed(2)}
                          <span className="ml-1">({(index.changePercent > 0 ? '+' : '') + index.changePercent.toFixed(2)}%)</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      index.changePercent > 0 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    )}>
                      {index.changePercent > 0 ? (
                        <AreaChart className="h-5 w-5" />
                      ) : (
                        <BarChart4 className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs Section for Content Organization */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="trending" className="text-sm">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="text-sm">
            <Eye className="mr-2 h-4 w-4" />
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="text-sm">
            <Brain className="mr-2 h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trending" className="space-y-4 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Trending Stocks</span>
            </h2>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topStocks?.slice(0, 6).map((stock) => (
              <Card key={stock.id} className="border border-gray-100 dark:border-gray-700 card-hover">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        stock.change && stock.change > 0 
                          ? "bg-green-100 dark:bg-green-900/20" 
                          : "bg-red-100 dark:bg-red-900/20"
                      )}>
                        <span className="font-bold text-sm">
                          {stock.symbol.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{stock.symbol}</h3>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ₹{stock.currentPrice.toLocaleString('en-IN', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2
                        })}
                      </p>
                      <p className={stock.change && stock.change > 0 ? "stock-up text-xs" : "stock-down text-xs"}>
                        {stock.change ? (stock.change > 0 ? '+' : '') + stock.change.toFixed(2) : '0.00'} 
                        ({stock.changePercent ? (stock.changePercent > 0 ? '+' : '') + stock.changePercent.toFixed(2) : '0.00'}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="watchlist" className="space-y-4 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <span>Your Watchlist</span>
            </h2>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              Manage
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
          
          {user ? (
            <>
              {topStocks?.slice(0, 3).map((stock) => (
                <Card key={stock.id} className="border border-gray-100 dark:border-gray-700 card-hover">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          stock.change && stock.change > 0 
                            ? "bg-green-100 dark:bg-green-900/20" 
                            : "bg-red-100 dark:bg-red-900/20"
                        )}>
                          <span className="font-bold text-sm">
                            {stock.symbol.substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium">{stock.symbol}</h3>
                          <p className="text-xs text-muted-foreground">{stock.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ₹{stock.currentPrice.toLocaleString('en-IN', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2
                          })}
                        </p>
                        <p className={stock.change && stock.change > 0 ? "stock-up text-xs" : "stock-down text-xs"}>
                          {stock.change ? (stock.change > 0 ? '+' : '') + stock.change.toFixed(2) : '0.00'} 
                          ({stock.changePercent ? (stock.changePercent > 0 ? '+' : '') + stock.changePercent.toFixed(2) : '0.00'}%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Eye className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-medium mb-1">No Watchlist Items</h3>
                <p className="text-sm text-muted-foreground mb-4">Login to create and track your watchlist</p>
                <Button>Login to Continue</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="ai-insights" className="space-y-4 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>AI Market Insights</span>
            </h2>
            <Button variant="outline" size="sm" className="text-xs gap-1">
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
          
          <Card className="card-gradient-accent card-hover border-primary/10">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Market Analysis</CardTitle>
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Bullish
                </Badge>
              </div>
              <CardDescription>
                AI-generated market sentiment and analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiInsights.map((insight) => (
                <div key={insight.id} className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between mb-1 items-start">
                    <div className="flex gap-2 items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-medium text-sm">{insight.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{insight.description}</p>
                  <div className="flex gap-2 mt-2">
                    {insight.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full text-primary border-primary/20">
                <Brain className="mr-2 h-4 w-4" />
                View Detailed Analysis
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top AI Pick
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    RL
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">RELIANCE</h3>
                    <p className="text-sm text-muted-foreground">Reliance Industries Ltd</p>
                  </div>
                </div>
                <div className="text-center">
                  <span className="signal-buy px-3 py-1">BUY</span>
                  <p className="text-xs mt-1 font-medium">Target: ₹3,120</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">AI predicts a potential 8.3% upside over the next 30 days based on technical indicators, fundamental analysis, and market sentiment.</p>
                <Button variant="outline" size="sm" className="mt-2">
                  View Detailed Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-center gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
          <ChartBar className="h-5 w-5 text-primary mb-1" />
          <span className="text-sm font-medium">Portfolio</span>
        </Button>
        <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-center gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
          <LineChart className="h-5 w-5 text-primary mb-1" />
          <span className="text-sm font-medium">Trading</span>
        </Button>
        <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-center gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
          <Brain className="h-5 w-5 text-primary mb-1" />
          <span className="text-sm font-medium">SuhuAI</span>
        </Button>
        <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-center gap-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
          <Calendar className="h-5 w-5 text-primary mb-1" />
          <span className="text-sm font-medium">Events</span>
        </Button>
      </div>
    </div>
  );
};

export default Home;
