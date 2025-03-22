import { useQuery } from "@tanstack/react-query";
import { Stock } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { generateChartData } from "@/lib/stockData";
import { Skeleton } from "@/components/ui/skeleton";

const MarketOverview = () => {
  const { data: stocks, isLoading } = useQuery<Stock[]>({
    queryKey: ['/api/stocks'],
  });

  const nifty = stocks?.find(s => s.symbol === "NIFTY");
  const sensex = stocks?.find(s => s.symbol === "SENSEX");

  // Generate chart data for visualization
  const niftyChartData = nifty 
    ? generateChartData(nifty.currentPrice, 7, "up").map(price => ({ price }))
    : [];

  const sensexChartData = sensex 
    ? generateChartData(sensex.currentPrice, 7, "up").map(price => ({ price }))
    : [];

  if (isLoading) {
    return <MarketOverviewSkeleton />;
  }

  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-neutral-900">Market Overview</h2>
        <button className="text-blue-500 text-sm font-medium">View All</button>
      </div>
      
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-blue-500 bg-opacity-10 p-2 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 mb-1">AI Market Insight</h3>
              <p className="text-sm text-neutral-600">
                Indian markets showing bullish momentum with FII buying, tech sectors leading gains. Resistance levels at Nifty 22,100.
              </p>
              <div className="flex items-center mt-2">
                <span className="text-xs bg-blue-500 bg-opacity-10 text-blue-500 px-2 py-1 rounded-full mr-2">
                  AI Confidence: 87%
                </span>
                <span className="text-xs text-neutral-500">Updated 10 min ago</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {nifty && (
          <IndexCard 
            title="Nifty 50"
            value={nifty.currentPrice}
            change={nifty.change || 0}
            changePercent={nifty.changePercent || 0}
            chartData={niftyChartData}
          />
        )}
        
        {sensex && (
          <IndexCard 
            title="Sensex"
            value={sensex.currentPrice}
            change={sensex.change || 0}
            changePercent={sensex.changePercent || 0}
            chartData={sensexChartData}
          />
        )}
      </div>
    </section>
  );
};

interface IndexCardProps {
  title: string;
  value: number;
  change: number;
  changePercent: number;
  chartData: { price: number }[];
}

const IndexCard = ({ title, value, change, changePercent, chartData }: IndexCardProps) => {
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm text-neutral-500 mb-1">{title}</h3>
        <div className="flex items-baseline">
          <span className="text-xl font-semibold font-mono">{value.toFixed(2)}</span>
          <span className={`ml-2 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
        </div>
        <div className="h-24 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? "#10B981" : "#EF4444"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const MarketOverviewSkeleton = () => {
  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="w-full">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <div className="flex items-center mt-2 gap-2">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default MarketOverview;
