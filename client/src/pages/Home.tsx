import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import MarketTicker from "@/components/MarketTicker";
import MarketOverview from "@/components/MarketOverview";
import TrendingStocks from "@/components/TrendingStocks";
import AISuggestions from "@/components/AISuggestions";
import StockAnalysis from "@/components/StockAnalysis";

const Home = () => {
  return (
    <div className="min-h-screen pb-16 relative">
      <Header />
      <MarketTicker />
      
      <main className="container mx-auto px-4 py-4">
        <MarketOverview />
        <TrendingStocks />
        <AISuggestions />
        <StockAnalysis />
      </main>
      
      <Navigation />
    </div>
  );
};

export default Home;
