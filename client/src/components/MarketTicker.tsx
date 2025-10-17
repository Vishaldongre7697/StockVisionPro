import { useQuery } from "@tanstack/react-query";
import { Stock } from "@shared/schema";
import { cn } from "@/lib/utils";

const MarketTicker = () => {
  const { data: stocks, isLoading } = useQuery<Stock[]>({
    queryKey: ['/api/stocks'],
  });

  if (isLoading || !stocks) {
    return (
      <div className="bg-neutral-800 text-white py-2 overflow-hidden">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-neutral-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 text-white py-2 overflow-hidden ticker">
      <div className="ticker-content">
        {stocks.map((stock) => (
          <span key={stock.id} className="inline-flex items-center mx-3">
            <span className="font-semibold mr-1">{stock.symbol}</span> 
            {stock.currentPrice.toFixed(2)} 
            <span 
              className={cn(
                "ml-1", 
                (stock.changePercent || 0) >= 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {(stock.changePercent || 0) >= 0 ? "+" : ""}{stock.changePercent?.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>

      <style>{`
        .ticker {
          white-space: nowrap;
          overflow: hidden;
        }
        .ticker-content {
          display: inline-block;
          animation: ticker 30s linear infinite;
        }
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default MarketTicker;
