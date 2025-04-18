import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as marketDataService from '../services/marketDataService';

export interface UseMarketDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMarketSummaryReturn {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

interface UseStockDetailsReturn {
  data: any | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

interface UseHistoricalDataReturn {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

interface UseTopStocksReturn {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Custom hook for fetching market summary data
 */
export const useMarketSummary = (
  options: UseMarketDataOptions = {}
): UseMarketSummaryReturn => {
  const { autoRefresh = true, refreshInterval = 60000 } = options;
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const marketData = await marketDataService.getMarketSummary();
      setData(marketData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      if (err.message.includes('API key missing')) {
        setError('API key is required for live data');
        toast({
          title: 'API Key Required',
          description: 'A stock market API key is needed for live data',
          variant: 'destructive',
        });
      } else {
        setError('Failed to fetch market data');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  return { data, loading, error, refresh: fetchData, lastUpdated };
};

/**
 * Custom hook for fetching top stocks
 */
export const useTopStocks = (
  category: 'active' | 'gainers' | 'losers' = 'active',
  limit = 5,
  options: UseMarketDataOptions = {}
): UseTopStocksReturn => {
  const { autoRefresh = true, refreshInterval = 60000 } = options;
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const stocks = await marketDataService.getTopStocks(category, limit);
      setData(stocks);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      if (err.message.includes('API key missing')) {
        setError('API key is required for live data');
        toast({
          title: 'API Key Required',
          description: 'A stock market API key is needed for live data',
          variant: 'destructive',
        });
      } else {
        setError(`Failed to fetch top ${category} stocks`);
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [category, limit, toast]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  return { data, loading, error, refresh: fetchData, lastUpdated };
};

/**
 * Custom hook for fetching stock details
 */
export const useStockDetails = (
  symbol: string,
  options: UseMarketDataOptions = {}
): UseStockDetailsReturn => {
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setError('Stock symbol is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const stockData = await marketDataService.getStockDetails(symbol);
      setData(stockData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      if (err.message.includes('API key missing')) {
        setError('API key is required for live data');
        toast({
          title: 'API Key Required',
          description: 'A stock market API key is needed for live data',
          variant: 'destructive',
        });
      } else {
        setError(`Failed to fetch details for ${symbol}`);
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, toast]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  return { data, loading, error, refresh: fetchData, lastUpdated };
};

/**
 * Custom hook for fetching historical data
 */
export const useHistoricalData = (
  symbol: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily',
  options: UseMarketDataOptions = {}
): UseHistoricalDataReturn => {
  const { autoRefresh = false, refreshInterval = 3600000 } = options; // Default: 1 hour
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setError('Stock symbol is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const historicalData = await marketDataService.getHistoricalData(symbol, interval);
      setData(historicalData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      if (err.message.includes('API key missing')) {
        setError('API key is required for live data');
        toast({
          title: 'API Key Required',
          description: 'A stock market API key is needed for live data',
          variant: 'destructive',
        });
      } else {
        setError(`Failed to fetch historical data for ${symbol}`);
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, toast]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  return { data, loading, error, refresh: fetchData, lastUpdated };
};

/**
 * Custom hook for searching stocks
 */
export const useStockSearch = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchStocks = useCallback(async (keywords: string) => {
    if (!keywords || keywords.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const searchResults = await marketDataService.searchStocks(keywords);
      setResults(searchResults);
      setError(null);
    } catch (err: any) {
      if (err.message.includes('API key missing')) {
        setError('API key is required for search');
        toast({
          title: 'API Key Required',
          description: 'A stock market API key is needed for search functionality',
          variant: 'destructive',
        });
      } else {
        setError('Failed to search for stocks');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { results, loading, error, searchStocks };
};