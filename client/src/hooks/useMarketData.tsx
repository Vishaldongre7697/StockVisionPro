import { useState, useEffect, useCallback } from 'react';
import { Stock } from '@shared/schema';
import { getStockDetails } from '../services/marketDataService';
import useWebSocket from './useWebSocket';

interface UseMarketDataProps {
  symbol: string;
  initialData?: Stock;
  pollingInterval?: number; // Optional polling interval in milliseconds
}

export default function useMarketData({ 
  symbol, 
  initialData,
  pollingInterval = 60000 // Default to 1 minute polling
}: UseMarketDataProps) {
  const [stock, setStock] = useState<Stock | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Initialize WebSocket connection
  const { registerHandler, connectionError } = useWebSocket();
  
  const fetchStockData = useCallback(async (showLoading = true) => {
    if (!symbol) return;
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // First try API route
      try {
        const apiResponse = await fetch(`/api/stocks/${symbol}`);
        if (apiResponse.ok) {
          const stockData = await apiResponse.json();
          setStock(stockData);
          setLastUpdated(new Date());
          return;
        }
      } catch (apiError) {
        console.warn('Error fetching from local API, trying direct stock service:', apiError);
      }
      
      // Fallback to direct service
      const stockData = await getStockDetails(symbol);
      setStock(stockData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setError('Failed to fetch stock data. Please try again later.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [symbol]);
  
  // Update stock with real-time data
  const updateRealTimeData = useCallback((data: any) => {
    if (!data) return;
    
    setStock(prevStock => {
      if (!prevStock) return null;
      
      return {
        ...prevStock,
        currentPrice: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        updatedAt: new Date()
      };
    });
    
    setLastUpdated(new Date());
  }, []);
  
  useEffect(() => {
    if (!initialData) {
      fetchStockData();
    }
    
    // Set up polling for regular updates
    const pollingTimer = setInterval(() => {
      fetchStockData(false); // Don't show loading state for regular updates
    }, pollingInterval);
    
    // Register for real-time updates via WebSocket
    const unsubscribe = registerHandler(symbol, updateRealTimeData);
    
    return () => {
      clearInterval(pollingTimer);
      unsubscribe();
    };
  }, [symbol, initialData, fetchStockData, pollingInterval, registerHandler, updateRealTimeData]);
  
  // Log WebSocket errors
  useEffect(() => {
    if (connectionError) {
      console.warn(`WebSocket connection error for ${symbol}:`, connectionError);
    }
  }, [connectionError, symbol]);
  
  return { 
    stock, 
    loading, 
    error, 
    fetchStockData,
    lastUpdated 
  };
}
