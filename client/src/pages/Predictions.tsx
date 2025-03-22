import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stock, AiSuggestion } from "@shared/schema";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import MarketTicker from "@/components/MarketTicker";
import StockAnalysis from "@/components/StockAnalysis";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

const Predictions = () => {
  const [selectedStock, setSelectedStock] = useState<string>("RELIANCE");
  
  const { data: stocks, isLoading: isLoadingStocks } = useQuery<Stock[]>({
    queryKey: ['/api/stocks'],
  });

  return (
    <div className="min-h-screen pb-16 relative">
      <Header />
      <MarketTicker />
      
      <main className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI Predictions</h2>
          
          {isLoadingStocks ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <Select
              value={selectedStock}
              onValueChange={setSelectedStock}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a stock" />
              </SelectTrigger>
              <SelectContent>
                {stocks?.filter(s => s.symbol !== "NIFTY" && s.symbol !== "SENSEX").map(stock => (
                  <SelectItem key={stock.id} value={stock.symbol}>
                    {stock.symbol} - {stock.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <StockAnalysis stockSymbol={selectedStock} />
        
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Additional Prediction Tools</h3>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h4 className="text-xl font-medium mb-2">Advanced Prediction Tools Coming Soon</h4>
                <p className="text-neutral-600 max-w-lg">
                  Our AI team is working on implementing backtesting, custom strategy creation,
                  and options analytics. These features will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <Navigation />
    </div>
  );
};

export default Predictions;
