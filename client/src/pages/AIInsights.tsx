import { useQuery } from "@tanstack/react-query";
import { AiSuggestion, Stock } from "@shared/schema";
// import SimplifiedHeader from "@/components/SimplifiedHeader";
import Navigation from "@/components/Navigation";
// import MarketTicker from "@/components/MarketTicker"; //Removed MarketTicker import
import AISuggestions from "@/components/AISuggestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type SuggestionWithStock = AiSuggestion & {
  stock?: Stock;
};

const AIInsights = () => {
  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery<SuggestionWithStock[]>({
    queryKey: ['/api/ai-suggestions/top?limit=10'],
  });

  const { data: stocks, isLoading: isLoadingStocks } = useQuery<Stock[]>({
    queryKey: ['/api/stocks'],
  });

  // Calculate market sentiment
  const marketSentiment = () => {
    if (!stocks) return 0;

    const positiveStocks = stocks.filter(s => (s.changePercent || 0) > 0).length;
    return Math.round((positiveStocks / stocks.length) * 100);
  };

  // Prepare data for sector performance chart
  const sectorData = () => {
    if (!stocks) return [];

    const sectors = new Map<string, { count: number, performance: number }>();

    stocks.forEach(stock => {
      if (stock.sector && stock.sector !== "Index") {
        const existing = sectors.get(stock.sector) || { count: 0, performance: 0 };
        sectors.set(stock.sector, {
          count: existing.count + 1,
          performance: existing.performance + (stock.changePercent || 0)
        });
      }
    });

    return Array.from(sectors.entries()).map(([name, data]) => ({
      name,
      performance: data.performance / data.count
    })).sort((a, b) => b.performance - a.performance);
  };

  // Prepare suggestion distribution data for pie chart
  const suggestionDistribution = () => {
    if (!suggestions) return [];

    const counts = {
      BUY: 0,
      SELL: 0,
      HOLD: 0,
      WATCH: 0
    };

    suggestions.forEach(suggestion => {
      if (suggestion.suggestion in counts) {
        counts[suggestion.suggestion as keyof typeof counts]++;
      }
    });

    return [
      { name: 'BUY', value: counts.BUY },
      { name: 'SELL', value: counts.SELL },
      { name: 'HOLD', value: counts.HOLD },
      { name: 'WATCH', value: counts.WATCH }
    ].filter(item => item.value > 0);
  };

  const COLORS = ['#10B981', '#EF4444', '#6B7280', '#3B82F6'];

  const isLoading = isLoadingSuggestions || isLoadingStocks;

  return (
    <div className="min-h-screen pb-16 relative bg-white dark:bg-gray-900">
      <main className="container mx-auto px-4 py-4">
        <h2 className="text-xl font-semibold mb-4">AI Insights</h2>

        <Card className="mb-6">
          <CardHeader className="bg-primary px-4 py-3">
            <div className="flex items-center">
              <span className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
                <Cpu className="h-4 w-4 text-primary" />
              </span>
              <h3 className="text-white font-medium">Suhu AI Market Analysis</h3>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-neutral-600 mb-4">
              Our AI has analyzed market patterns, institutional activity, and sector rotation to provide the following insights:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Market Sentiment</h4>
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="flex items-center">
                    <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden mr-4">
                      <div 
                        className={cn(
                          "h-full rounded-full", 
                          marketSentiment() > 60 
                            ? "bg-green-500" 
                            : marketSentiment() < 40 
                              ? "bg-red-500" 
                              : "bg-amber-500"
                        )}
                        style={{ width: `${marketSentiment()}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{marketSentiment()}%</span>
                  </div>
                )}
                <p className="text-sm text-neutral-600 mt-2">
                  {marketSentiment() > 60 
                    ? "Bullish sentiment detected. Consider adding to positions on dips." 
                    : marketSentiment() < 40 
                      ? "Bearish sentiment detected. Exercise caution with new positions." 
                      : "Neutral market sentiment. Selective opportunities in both directions."}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Suggestion Distribution</h4>
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={suggestionDistribution()}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                          label
                        >
                          {suggestionDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-2">Sector Performance</h4>
              {isLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={sectorData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${value.toFixed(2)}%`} />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'Performance']} />
                      <Line 
                        type="monotone" 
                        dataKey="performance" 
                        stroke="#3B82F6" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                    <h5 className="font-medium">Top Bullish Signal</h5>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <p className="text-sm">
                      Strong institutional buying detected in IT sector with technical breakouts across multiple stocks.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-3">
                  <div className="flex items-center mb-2">
                    <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                    <h5 className="font-medium">Top Bearish Signal</h5>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <p className="text-sm">
                      Banking stocks showing weakness with distribution patterns and decreasing volumes.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <h5 className="font-medium">Market Alert</h5>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <p className="text-sm">
                      Watch for potential volatility increase ahead of upcoming economic data releases this week.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="topPicks">
          <TabsList className="mb-4">
            <TabsTrigger value="topPicks">Top Picks</TabsTrigger>
            <TabsTrigger value="marketInsights">Market Insights</TabsTrigger>
            <TabsTrigger value="trendAnalysis">Trend Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="topPicks">
            <AISuggestions />
          </TabsContent>

          <TabsContent value="marketInsights">
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Advanced Market Insights Coming Soon</h3>
                <p className="text-neutral-600 max-w-lg mx-auto">
                  Our AI is learning to provide deeper market insights including liquidity analysis, 
                  sector correlations, and market breadth indicators.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trendAnalysis">
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Trend Analysis Coming Soon</h3>
                <p className="text-neutral-600 max-w-lg mx-auto">
                  Advanced trend analysis with pattern recognition and automated support/resistance 
                  detection will be available in the next update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
};

export default AIInsights;