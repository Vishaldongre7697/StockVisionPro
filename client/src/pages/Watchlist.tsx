import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stock, SuggestionType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";

const Watchlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStockId, setExpandedStockId] = useState<number | null>(null);
  const [currentSort, setCurrentSort] = useState("name");
  const [currentFilter, setCurrentFilter] = useState("all");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(3); // Default notification count for demo

  // Fetch market indices
  const initialIndicesData = [
    { name: 'NIFTY 50', price: '22,403.44', change: '+120.35', percentChange: '+0.54%' },
    { name: 'SENSEX', price: '73,648.62', change: '+364.50', percentChange: '+0.49%' },
    { name: 'BANK NIFTY', price: '47,521.10', change: '-104.80', percentChange: '-0.22%' }
  ];

  // Fetch trending stocks
  const initialTrendingStocksData = [
    { id: 1, symbol: 'RELIANCE', name: 'Reliance Industries', price: '2,850.75', change: '+2.4%', volume: '1.2M' },
    { id: 2, symbol: 'TCS', name: 'Tata Consultancy', price: '3,905.20', change: '+1.6%', volume: '620K' },
    { id: 3, symbol: 'HDFC', name: 'HDFC Bank', price: '1,678.45', change: '-0.3%', volume: '856K' },
    { id: 4, symbol: 'INFOSYS', name: 'Infosys Limited', price: '1,456.30', change: '+0.8%', volume: '750K' },
    { id: 5, symbol: 'HCLTECH', name: 'HCL Technologies', price: '1,245.70', change: '+3.2%', volume: '435K' }
  ];

  // Mock notifications for demo
  const initialNotificationsData = [
    { id: 1, title: '🚀 RELIANCE breakout alert!', message: 'Stock has broken resistance at ₹2,850', time: '10 min ago' },
    { id: 2, title: '📊 Market Update', message: 'Nifty 50 hits new all-time high', time: '1 hour ago' },
    { id: 3, title: '🤖 AI Signal', message: 'Strong buy signal for TCS detected', time: '3 hours ago' }
  ];

  const [notifications, setNotifications] = useState(initialNotificationsData);

  // Sort options
  const sortOptions = [
    { id: 'name', label: '📝 Name' },
    { id: 'price', label: '💰 Price' },
    { id: 'change', label: '📈 Change %' },
    { id: 'volume', label: '📊 Volume' },
    { id: 'aiConfidence', label: '🤖 AI Confidence' }
  ];

  // Filter options
  const filterOptions = [
    { id: 'all', label: '🌟 All Stocks' },
    { id: 'gainers', label: '📈 Top Gainers' },
    { id: 'losers', label: '📉 Top Losers' },
    { id: 'highVolume', label: '📊 High Volume' },
    { id: 'highConfidence', label: '🎯 High AI Confidence' }
  ];

  // Apply theme class to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Fetch user's watchlist - allow even for non-authenticated users
  const { data: watchlistData, isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ['/api/watchlist', user?.id || 'guest'],
    queryFn: getQueryFn<Stock[]>({ on401: 'returnNull' }),
    enabled: true, // Always enabled
  });

  // Fetch all stocks for search
  const { data: allStocks, isLoading: isLoadingStocks } = useQuery({
    queryKey: ['/api/stocks'],
    queryFn: getQueryFn<Stock[]>({ on401: 'returnNull' }),
  });

  // Add stock to watchlist
  const addToWatchlist = useMutation({
    mutationFn: async (stockId: number) => {
      const userId = user?.id || 'guest';
      return apiRequest("POST", "/api/watchlist", {
        userId,
        stockId
      });
    },
    onSuccess: (_data, stockId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', user?.id || 'guest'] });
      const addedStock = allStocks?.find(s => s.id === stockId);
      toast({
        title: "Added to Watchlist",
        description: `${addedStock?.name || 'Stock'} has been added to your watchlist.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add to watchlist",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Remove from watchlist
  const removeFromWatchlist = useMutation({
    mutationFn: async (stockId: number) => {
      const userId = user?.id || 'guest';
      return apiRequest("DELETE", `/api/watchlist/${userId}/${stockId}`);
    },
    onSuccess: (_data, stockId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist', user?.id || 'guest'] });
      const removedStock = allStocks?.find(s => s.id === stockId);
      toast({
        title: "Removed from Watchlist",
        description: `${removedStock?.name || 'Stock'} has been removed from your watchlist.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove from watchlist",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Helper function to parse number strings for sorting
  const formatNumberString = (numStr: string | undefined) => {
    if (typeof numStr !== 'string') return 0;
    return parseFloat(numStr.replace(/[^0-9.-]+/g, '')) || 0;
  };

  // Get stock data for rendering with fallbacks
  const getEnhancedWatchlistData = useMemo(() => {
    if (!watchlistData || watchlistData.length === 0) return [];
    
    return watchlistData.map(stock => {
      // Generate sample AI confidence, support, resistance
      const aiConfidence = 65 + Math.floor(Math.random() * 25);
      const supportPrice = (stock.currentPrice * 0.95).toFixed(2);
      const resistancePrice = (stock.currentPrice * 1.05).toFixed(2);
      
      // Map changePercent to signal type
      let signal: SuggestionType = SuggestionType.HOLD;
      if ((stock.changePercent || 0) > 1.5) {
        signal = SuggestionType.BUY;
      } else if ((stock.changePercent || 0) < -1.5) {
        signal = SuggestionType.SELL;
      }
      
      // Generate mock news
      const news = [
        {
          id: `news-${stock.id}-1`,
          title: (stock.changePercent || 0) > 0 
            ? `${stock.name} reports positive quarterly results` 
            : `${stock.name} faces market pressure`,
          impact: (stock.changePercent || 0) > 0 ? 'positive' : 'negative',
          date: '2 days ago'
        },
        {
          id: `news-${stock.id}-2`,
          title: `Analyst updates on ${stock.name}`,
          impact: 'neutral',
          date: '4 days ago'
        }
      ];
      
      return {
        ...stock,
        aiConfidence,
        signal,
        support: `₹${supportPrice}`,
        resistance: `₹${resistancePrice}`,
        fiiActivity: (stock.changePercent || 0) > 0 ? `+₹${(Math.random() * 200).toFixed(0)}Cr` : `-₹${(Math.random() * 200).toFixed(0)}Cr`,
        diiActivity: (Math.random() > 0.5) ? `+₹${(Math.random() * 200).toFixed(0)}Cr` : `-₹${(Math.random() * 200).toFixed(0)}Cr`,
        weekLow: `₹${(stock.currentPrice * 0.8).toFixed(2)}`,
        weekHigh: `₹${(stock.currentPrice * 1.2).toFixed(2)}`,
        news,
        volume: `${(Math.random() * 5).toFixed(1)}M`,
        marketCap: `₹${(stock.currentPrice * 1000000000 / 1000000000000).toFixed(2)}T`,
        sector: stock.sector || (
          stock.symbol.includes('BANK') ? 'Banking' :
          stock.symbol.includes('TECH') ? 'Technology' :
          stock.symbol.includes('AUTO') ? 'Automobile' : 'Other'
        )
      };
    });
  }, [watchlistData]);

  // Filter stocks based on search query
  const filteredStocks = useMemo(() => {
    if (!searchQuery || !allStocks) return [];
    
    return allStocks.filter(stock => {
      return (
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery, allStocks]);

  // Apply filters and sorting to watchlist data
  const filteredAndSortedWatchlist = useMemo(() => {
    if (!getEnhancedWatchlistData.length) return [];
    
    let displayStocks = [...getEnhancedWatchlistData];
    
    // Apply filters
    if (currentFilter !== 'all') {
      switch (currentFilter) {
        case 'gainers':
          displayStocks = displayStocks.filter(stock => (stock.changePercent || 0) > 0);
          break;
        case 'losers':
          displayStocks = displayStocks.filter(stock => (stock.changePercent || 0) < 0);
          break;
        case 'highVolume':
          displayStocks = displayStocks.filter(stock => formatNumberString(stock.volume?.replace('M', '')) > 1);
          break;
        case 'highConfidence':
          displayStocks = displayStocks.filter(stock => (stock.aiConfidence || 0) > 80);
          break;
      }
    }
    
    // Apply sorting
    displayStocks.sort((a, b) => {
      switch (currentSort) {
        case 'price':
          return b.currentPrice - a.currentPrice;
        case 'change':
          return (b.changePercent || 0) - (a.changePercent || 0);
        case 'volume':
          return formatNumberString(b.volume) - formatNumberString(a.volume);
        case 'aiConfidence':
          return (b.aiConfidence || 0) - (a.aiConfidence || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return displayStocks;
  }, [getEnhancedWatchlistData, currentFilter, currentSort]);

  // Event handlers
  const handleToggleTheme = useCallback(() => setIsDarkMode(prev => !prev), []);
  const handleToggleSearch = useCallback(() => setIsSearchVisible(prev => !prev), []);
  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);
  const handleClearSearch = useCallback(() => setSearchQuery(''), []);
  const handleToggleStockExpansion = useCallback((id: number) => {
    setExpandedStockId(prevId => (prevId === id ? null : id));
  }, []);
  const handleShowModal = useCallback((modalType: string) => setActiveModal(modalType), []);
  const handleCloseModal = useCallback(() => setActiveModal(null), []);
  const handleAddStock = useCallback((symbol: string, name: string) => {
    // Find stock by symbol
    const stockToAdd = allStocks?.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (stockToAdd) {
      addToWatchlist.mutate(stockToAdd.id);
    } else {
      toast({
        title: "Stock not found",
        description: "Please enter a valid stock symbol",
        variant: "destructive",
      });
    }
    handleCloseModal();
  }, [allStocks, addToWatchlist, toast]);
  const handleClearNotifications = useCallback(() => {
    setNotifications([]);
    setNotificationCount(0);
  }, []);

  // Get CSS class based on signal for styling
  const getSignalClass = (signal: string) => {
    const lowerSignal = signal?.toLowerCase() || '';
    if (lowerSignal.includes('buy')) return 'signal-buy';
    if (lowerSignal.includes('sell')) return 'signal-sell';
    return 'signal-hold';
  };

  // Get CSS class for news impact
  const getNewsImpactClass = (impact: string) => {
    if (impact === 'positive') return 'news-positive';
    if (impact === 'negative') return 'news-negative';
    return 'news-neutral';
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <Header title="📈 Market Watchlist" />
      
      {/* Search icon */}
      <div className="search-icon-container">
        <button className="icon-button" aria-label="Toggle Search" onClick={handleToggleSearch}>
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>

      {/* Search Bar */}
      <div className={cn("search-bar-container", isSearchVisible && "show")}>
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            id="search-input"
            className="search-input"
            placeholder="Search stocks by name or symbol..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="clear-search-button" aria-label="Clear Search">
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Indices Section */}
      <div className="indices-container">
        {initialIndicesData.map((item, index) => (
          <div className="index-card" key={item.name || index}>
            <div className="index-name">{item.name}</div>
            <div className="index-price">₹{item.price}</div>
            <div className={cn("index-change", item.percentChange?.startsWith('+') ? 'positive' : 'negative')}>
              {item.change} ({item.percentChange})
            </div>
          </div>
        ))}
      </div>

      {/* Trending Section */}
      <div className="section-container">
        <div className="section-header">
          <i className="fa-solid fa-arrow-trend-up section-icon"></i>
          <h2 className="section-title">🔥 Trending Now</h2>
        </div>
        <div className="trending-container">
          {initialTrendingStocksData.map(item => (
            <div className="trending-card" key={item.id || item.symbol}>
              <div className="trending-name">{item.name}</div>
              <div className="trending-symbol">{item.symbol}</div>
              <div className={cn("trending-change", item.change?.startsWith('+') ? 'positive' : 'negative')}>
                {item.change}
              </div>
              <div className="trending-volume">Vol: {item.volume}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-container">
        <div className="filter-buttons-group">
          <button className="filter-button" onClick={() => handleShowModal('filter')}>
            <i className="fa-solid fa-filter filter-icon"></i>
            <span className="filter-button-text">Filter</span>
          </button>
          <button className="filter-button" onClick={() => handleShowModal('sort')}>
            <i className="fa-solid fa-sort filter-icon"></i>
            <span className="filter-button-text">Sort</span>
          </button>
        </div>
        <button className="add-button" onClick={() => handleShowModal('add')}>
          <i className="fa-solid fa-plus add-icon"></i>
          Add Stock
        </button>
      </div>

      {/* Watchlist */}
      <div className="watchlist-container" id="watchlist-container">
        {isLoadingWatchlist ? (
          // Loading state
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="stock-card animate-pulse">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-md mt-2"></div>
                    <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-md mt-2"></div>
                    <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded-md mt-2"></div>
                  </div>
                  <div>
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded-md mt-2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedWatchlist.length > 0 ? (
          // Watchlist items
          filteredAndSortedWatchlist.map(stock => (
            <div 
              key={stock.id} 
              className={cn("stock-card", stock.id === expandedStockId && "expanded")}
              id={`stock-${stock.id}`}
            >
              <div 
                className="stock-card-clickable-area" 
                onClick={() => handleToggleStockExpansion(stock.id)} 
                role="button" 
                tabIndex={0} 
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleToggleStockExpansion(stock.id)}
              >
                <div className="stock-card-header">
                  <div>
                    <div className="stock-title-row">
                      <span className="stock-name">{stock.name}</span>
                      <span className="stock-symbol">{stock.symbol}</span>
                    </div>
                    <div className="stock-price">₹{stock.currentPrice.toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2
                    })}</div>
                    <div className={cn("stock-change", (stock.changePercent || 0) > 0 ? "positive" : "negative")}>
                      {(stock.changePercent || 0) > 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                    </div>
                    <div className="stock-volume">
                      Volume: {stock.volume} | Mkt Cap: {stock.marketCap}
                    </div>
                  </div>
                  <div className="stock-right-side">
                    <span className={cn("signal-badge", getSignalClass(stock.signal))}>
                      {stock.signal || 'N/A'}
                    </span>
                    <div className="sector-text">{stock.sector || 'N/A'}</div>
                    <button 
                      className="mt-2 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist.mutate(stock.id);
                      }}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
                <div className="expand-button-container">
                  <i className={cn("fa-solid", stock.id === expandedStockId ? "fa-chevron-up" : "fa-chevron-down")}></i>
                </div>
              </div>

              {stock.id === expandedStockId && (
                <div className="expanded-section">
                  {/* AI Confidence */}
                  <div className="expanded-section-item">
                    <div className="expanded-label">🤖 AI Confidence</div>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${stock.aiConfidence || 0}%` }}
                             aria-valuenow={stock.aiConfidence || 0} aria-valuemin={0} aria-valuemax={100} role="progressbar" aria-label={`AI Confidence ${stock.aiConfidence || 0}%`}></div>
                      </div>
                      <span className="confidence-text">{stock.aiConfidence || 0}%</span>
                    </div>
                  </div>

                  {/* Tech Levels */}
                  <div className="tech-levels-container">
                    <div className="level-item">
                      <div className="expanded-label">📊 Support</div>
                      <div className="level-value">{stock.support || 'N/A'}</div>
                    </div>
                    <div className="level-item">
                      <div className="expanded-label">📈 Resistance</div>
                      <div className="level-value">{stock.resistance || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Institutional Activity */}
                  <div className="institutional-container">
                    <div className="institutional-item">
                      <div className="expanded-label">🏢 FII Activity</div>
                      <div className={cn("activity-value", stock.fiiActivity?.startsWith('+') ? "positive" : "negative")}>
                        {stock.fiiActivity || 'N/A'}
                      </div>
                    </div>
                    <div className="institutional-item">
                      <div className="expanded-label">🏛 DII Activity</div>
                      <div className={cn("activity-value", stock.diiActivity?.startsWith('+') ? "positive" : "negative")}>
                        {stock.diiActivity || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* 52 Week Range */}
                  <div className="week-range-container">
                    <div className="expanded-label">📅 52 Week Range</div>
                    <div className="range-bar-container">
                      <span className="range-value low">{stock.weekLow || 'N/A'}</span>
                      <div className="range-bar"></div>
                      <span className="range-value high">{stock.weekHigh || 'N/A'}</span>
                    </div>
                  </div>

                  {/* News */}
                  <div className="news-container">
                    <div className="expanded-label">📰 Recent News</div>
                    {(stock.news && stock.news.length > 0) ? (
                      stock.news.map(newsItem => (
                        <div className="news-item" key={newsItem.id || newsItem.title}>
                          <div className={cn("news-title", getNewsImpactClass(newsItem.impact))}>
                            {newsItem.title}
                          </div>
                          <div className="news-date">{newsItem.date}</div>
                        </div>
                      ))
                    ) : (
                      <div className="news-date">No recent news available.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          // Empty state
          <div className="text-center py-8">
            <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-list text-blue-600 dark:text-blue-400 text-2xl"></i>
            </div>
            <h3 className="font-medium text-lg mb-2">Your watchlist is empty</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
              Add stocks to your watchlist to track their performance and receive AI-powered insights.
            </p>
            <button 
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
              onClick={() => handleShowModal('add')}
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Add Stocks to Watchlist
            </button>
          </div>
        )}
      </div>

      {/* Sort Modal */}
      <div id="sort-modal" className={cn("modal-overlay", activeModal === 'sort' && "show")} onClick={() => handleCloseModal()}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2 className="modal-title">Sort By</h2>
          <div id="sort-options-container">
            {sortOptions.map(option => (
              <div
                key={option.id}
                className={cn("modal-option", currentSort === option.id && "selected")}
                onClick={() => {
                  setCurrentSort(option.id);
                  handleCloseModal();
                }}
                role="button" 
                tabIndex={0} 
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (setCurrentSort(option.id), handleCloseModal())}
              >
                <span className="checkmark">✓</span>
                <span className="modal-option-text">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <div id="filter-modal" className={cn("modal-overlay", activeModal === 'filter' && "show")} onClick={() => handleCloseModal()}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2 className="modal-title">Filter</h2>
          <div id="filter-options-container">
            {filterOptions.map(option => (
              <div
                key={option.id}
                className={cn("modal-option", currentFilter === option.id && "selected")}
                onClick={() => {
                  setCurrentFilter(option.id);
                  handleCloseModal();
                }}
                role="button" 
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (setCurrentFilter(option.id), handleCloseModal())}
              >
                <span className="checkmark">✓</span>
                <span className="modal-option-text">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      <div id="add-stock-modal" className={cn("modal-overlay", activeModal === 'add' && "show")} onClick={() => handleCloseModal()}>
        <div className="add-stock-content" onClick={e => e.stopPropagation()}>
          <div className="add-stock-header">
            <h2 className="add-stock-title">📌 Add New Stock</h2>
            <button onClick={() => handleCloseModal()} className="close-modal-button" aria-label="Close Add Stock Modal">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          {/* Stock search results */}
          {searchQuery && filteredStocks.length > 0 ? (
            <div className="py-2">
              <h3 className="text-sm font-medium mb-2">Search Results</h3>
              <div className="max-h-60 overflow-y-auto">
                {filteredStocks.map(stock => (
                  <div 
                    key={stock.id}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      addToWatchlist.mutate(stock.id);
                      handleCloseModal();
                    }}
                  >
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{stock.name}</div>
                    </div>
                    <i className="fa-solid fa-plus text-blue-600 dark:text-blue-400"></i>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="add-stock-form">
              <div className="input-group">
                <label className="input-label" htmlFor="stock-symbol-input">Search for Stocks</label>
                <input 
                  type="text" 
                  className="input" 
                  id="stock-symbol-input" 
                  placeholder="Enter stock name or symbol..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="modal-buttons">
                <button className="cancel-button" onClick={() => handleCloseModal()}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Modal */}
      <div id="notifications-modal" className={cn("modal-overlay", activeModal === 'notifications' && "show")} onClick={() => handleCloseModal()}>
        <div className="notifications-content" onClick={e => e.stopPropagation()}>
          <div className="notifications-header">
            <h2 className="notifications-title">🔔 Notifications</h2>
            {notifications.length > 0 && (
              <button className="clear-button" onClick={handleClearNotifications}>Mark all as read</button>
            )}
            <button onClick={() => handleCloseModal()} className="close-modal-button" aria-label="Close Notifications Modal">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map(item => (
                <div className="notification-item" key={item.id}>
                  <div className="notification-title">{item.title}</div>
                  <div className="notification-message">{item.message}</div>
                  <div className="notification-time">{item.time}</div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                No new notifications.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watchlist;