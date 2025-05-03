import axios from 'axios';
import { Stock } from '@shared/schema';

// API Configuration - will be replaced with real API keys
const STOCK_API_KEY = import.meta.env.VITE_STOCK_API_KEY || '';

// Default API endpoint for Alpha Vantage - change this to your preferred provider
const BASE_URL = 'https://www.alphavantage.co/query';

// WebSocket for real-time data
let socket: WebSocket | null = null;
let isConnecting = false;
const subscribers = new Map<string, Set<(data: any) => void>>();

/**
 * Initialize WebSocket connection
 */
const initializeWebSocket = () => {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return Promise.resolve(socket);
  }
  
  if (isConnecting) {
    // Return a promise that resolves when the socket is connected
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          clearInterval(checkInterval);
          resolve(socket);
        }
      }, 100);
    });
  }
  
  isConnecting = true;
  
  return new Promise((resolve, reject) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        isConnecting = false;
        resolve(socket);
        
        // Resubscribe to all symbols
        Array.from(subscribers.keys()).forEach(symbol => {
          subscribeToSymbol(symbol);
        });
      };
      
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        socket = null;
        isConnecting = false;
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          initializeWebSocket();
        }, 5000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnecting = false;
        reject(error);
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'stock_update' && message.symbol) {
            const callbacks = subscribers.get(message.symbol);
            if (callbacks) {
              Array.from(callbacks).forEach(callback => {
                callback(message.data);
              });
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      isConnecting = false;
      reject(error);
    }
  });
};

/**
 * Subscribe to real-time updates for a symbol
 */
export const subscribeToSymbol = async (symbol: string) => {
  await initializeWebSocket();
  
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'subscribe',
      symbol
    }));
  }
};

/**
 * Unsubscribe from real-time updates for a symbol
 */
export const unsubscribeFromSymbol = (symbol: string) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'unsubscribe',
      symbol
    }));
  }
};

/**
 * Register a callback for real-time updates for a symbol
 */
export const registerForUpdates = (symbol: string, callback: (data: any) => void) => {
  if (!subscribers.has(symbol)) {
    subscribers.set(symbol, new Set());
    subscribeToSymbol(symbol);
  }
  
  const callbacks = subscribers.get(symbol);
  callbacks?.add(callback);
  
  // Return a function to unregister
  return () => {
    const callbacks = subscribers.get(symbol);
    if (callbacks) {
      callbacks.delete(callback);
      
      if (callbacks.size === 0) {
        subscribers.delete(symbol);
        unsubscribeFromSymbol(symbol);
      }
    }
  };
};

/**
 * Get market summary - major indices
 */
export const getMarketSummary = async () => {
  try {
    // If we don't have an API key, we'll return an error
    if (!STOCK_API_KEY) {
      throw new Error('API key missing');
    }
    
    // This is using Alpha Vantage to get major indices
    const indices = ['SPY', 'DIA', 'QQQ', 'IWM']; // S&P 500, Dow Jones, NASDAQ, Russell 2000
    const requests = indices.map(symbol => 
      axios.get(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${STOCK_API_KEY}`)
    );
    
    const responses = await Promise.all(requests);
    
    return responses.map((response, index) => {
      const data = response.data['Global Quote'];
      return {
        symbol: indices[index],
        name: getFullIndexName(indices[index]),
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', '')),
        volume: parseInt(data['06. volume']),
        date: data['07. latest trading day']
      };
    });
  } catch (error) {
    console.error('Error fetching market summary:', error);
    throw error;
  }
};

/**
 * Get top stocks - most active, biggest gainers, biggest losers
 */
export const getTopStocks = async (category: 'active' | 'gainers' | 'losers' = 'active', limit = 5) => {
  try {
    if (!STOCK_API_KEY) {
      throw new Error('API key missing');
    }
    
    // Alpha Vantage doesn't have a direct API for top movers
    // We'd use a different API like IEX Cloud or Polygon for this data
    // This is a placeholder implementation
    
    // For now, we'll make a request to get a list of stocks and sort them
    const response = await axios.get(
      `${BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${STOCK_API_KEY}`
    );
    
    let stocks;
    if (category === 'active') {
      stocks = response.data.most_actively_traded;
    } else if (category === 'gainers') {
      stocks = response.data.top_gainers;
    } else {
      stocks = response.data.top_losers;
    }
    
    return stocks.slice(0, limit).map((stock: any) => ({
      symbol: stock.ticker,
      name: stock.name,
      price: parseFloat(stock.price),
      change: parseFloat(stock.change),
      changePercent: parseFloat(stock.change_percentage.replace('%', '')),
      volume: parseInt(stock.volume)
    }));
  } catch (error) {
    console.error(`Error fetching top ${category} stocks:`, error);
    throw error;
  }
};

/**
 * Get stock details by symbol
 */
export const getStockDetails = async (symbol: string): Promise<Stock> => {
  try {
    if (!STOCK_API_KEY) {
      throw new Error('API key missing');
    }
    
    // Get overview and quote data
    const [overviewRes, quoteRes] = await Promise.all([
      axios.get(`${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${STOCK_API_KEY}`),
      axios.get(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${STOCK_API_KEY}`)
    ]);
    
    const overview = overviewRes.data;
    const quote = quoteRes.data['Global Quote'];
    
    // Format data to match our Stock model
    return {
      id: 0, // This would be filled by the database
      symbol: symbol,
      name: overview.Name,
      exchange: overview.Exchange,
      currentPrice: parseFloat(quote['05. price']),
      previousClose: parseFloat(quote['08. previous close']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      marketCap: parseInt(overview.MarketCapitalization),
      sector: overview.Sector,
      high52Week: parseFloat(overview['52WeekHigh']),
      low52Week: parseFloat(overview['52WeekLow']),
      eps: parseFloat(overview.EPS),
      pe: parseFloat(overview.PERatio),
      dividend: parseFloat(overview.DividendPerShare),
      dividendYield: parseFloat(overview.DividendYield) * 100,
      beta: parseFloat(overview.Beta),
      description: overview.Description,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error(`Error fetching details for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Get historical data for a stock
 */
export const getHistoricalData = async (
  symbol: string, 
  interval: 'daily' | 'weekly' | 'monthly' = 'daily',
  outputSize: 'compact' | 'full' = 'compact'
) => {
  try {
    if (!STOCK_API_KEY) {
      console.warn('STOCK_API_KEY is missing. Using simulated data for development.');
      return generateSimulatedHistoricalData(symbol, interval);
    }
    
    let timeSeriesFunction;
    switch (interval) {
      case 'weekly':
        timeSeriesFunction = 'TIME_SERIES_WEEKLY';
        break;
      case 'monthly':
        timeSeriesFunction = 'TIME_SERIES_MONTHLY';
        break;
      default:
        timeSeriesFunction = 'TIME_SERIES_DAILY';
        break;
    }
    
    const response = await axios.get(
      `${BASE_URL}?function=${timeSeriesFunction}&symbol=${symbol}&outputsize=${outputSize}&apikey=${STOCK_API_KEY}`
    );
    
    // Parse the response data
    const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey) {
      throw new Error('Invalid response format');
    }
    
    const timeSeries = response.data[timeSeriesKey];
    
    // Transform the data to an array format suitable for charts
    return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    })).reverse(); // Reverse to get chronological order
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    // Return simulated data for development purposes when the API fails
    return generateSimulatedHistoricalData(symbol, interval);
  }
};

// Helper function to generate simulated historical data
function generateSimulatedHistoricalData(symbol: string, interval: 'daily' | 'weekly' | 'monthly') {
  // Generate appropriate number of data points based on interval
  const dataPointCount = interval === 'daily' ? 30 : interval === 'weekly' ? 52 : 24;
  
  // Calculate dates for the data points
  const data = [];
  const now = new Date();
  const basePrice = 100 + Math.random() * 200; // Random base price between 100 and 300
  let currentPrice = basePrice;
  
  for (let i = 0; i < dataPointCount; i++) {
    const date = new Date(now);
    
    // Adjust date based on interval
    if (interval === 'daily') {
      date.setDate(date.getDate() - (dataPointCount - i));
    } else if (interval === 'weekly') {
      date.setDate(date.getDate() - ((dataPointCount - i) * 7));
    } else {
      date.setMonth(date.getMonth() - (dataPointCount - i));
    }
    
    // Simulate price movement with some randomness but also a trend
    // This creates more realistic-looking charts
    const change = (Math.random() - 0.48) * 5; // Slight upward bias
    currentPrice = Math.max(currentPrice + change, 10); // Ensure price doesn't go below 10
    
    // Daily volatility range
    const volatility = currentPrice * 0.03; // 3% volatility
    
    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility / 2;
    const low = Math.min(open, close) - Math.random() * volatility / 2;
    
    // Add the data point
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000000) + 100000
    });
  }
  
  return data;
};

/**
 * Search stocks by keywords
 */
export const searchStocks = async (keywords: string) => {
  try {
    if (!STOCK_API_KEY) {
      console.warn('STOCK_API_KEY is missing. Using simulated search results.');
      return generateSimulatedSearchResults(keywords);
    }
    
    const response = await axios.get(
      `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${STOCK_API_KEY}`
    );
    
    return response.data.bestMatches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      currency: match['8. currency'],
    }));
  } catch (error) {
    console.error(`Error searching for stocks with keywords ${keywords}:`, error);
    // Return simulated search results when API fails
    return generateSimulatedSearchResults(keywords);
  }
};

// Helper function to generate simulated search results
function generateSimulatedSearchResults(keywords: string) {
  const lowerKeywords = keywords.toLowerCase();
  
  // Common stock symbols and names to search through
  const commonStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'V', name: 'Visa Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'HD', name: 'Home Depot Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'MA', name: 'Mastercard Inc.', type: 'Equity', region: 'United States', currency: 'USD' },
    { symbol: 'DIS', name: 'Walt Disney Co.', type: 'Equity', region: 'United States', currency: 'USD' },
  ];
  
  // Filter stocks based on keywords in symbol or name
  return commonStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(lowerKeywords) || 
    stock.name.toLowerCase().includes(lowerKeywords)
  ).slice(0, 10); // Return up to 10 matches
}

/**
 * Get intraday data for a stock
 */
export const getIntradayData = async (
  symbol: string,
  interval: '1min' | '5min' | '15min' | '30min' | '60min' = '15min',
  outputSize: 'compact' | 'full' = 'compact'
) => {
  try {
    if (!STOCK_API_KEY) {
      console.warn('STOCK_API_KEY is missing. Using simulated data for development.');
      return generateSimulatedIntradayData(symbol, interval);
    }
    
    const response = await axios.get(
      `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=${outputSize}&apikey=${STOCK_API_KEY}`
    );
    
    // Parse the response data
    const timeSeriesKey = `Time Series (${interval})`;
    const timeSeries = response.data[timeSeriesKey];
    
    // Transform the data to an array format suitable for charts
    return Object.entries(timeSeries).map(([datetime, values]: [string, any]) => ({
      datetime,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'])
    })).reverse(); // Reverse to get chronological order
  } catch (error) {
    console.error(`Error fetching intraday data for ${symbol}:`, error);
    // Return simulated data when API fails
    return generateSimulatedIntradayData(symbol, interval);
  }
};

// Helper function to generate simulated intraday data
function generateSimulatedIntradayData(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min') {
  // Determine how many data points to generate based on interval
  const minutesInDay = 6.5 * 60; // 6.5 hours in trading day
  let dataPointCount;
  
  switch(interval) {
    case '1min':
      dataPointCount = minutesInDay;
      break;
    case '5min':
      dataPointCount = Math.floor(minutesInDay / 5);
      break;
    case '15min':
      dataPointCount = Math.floor(minutesInDay / 15);
      break;
    case '30min':
      dataPointCount = Math.floor(minutesInDay / 30);
      break;
    case '60min':
      dataPointCount = Math.floor(minutesInDay / 60);
      break;
    default:
      dataPointCount = 30;
  }
  
  // Generate time-based data points for today
  const data = [];
  const now = new Date();
  const basePrice = 100 + Math.random() * 200; // Random price between 100 and 300
  let currentPrice = basePrice;
  
  // Set to market open (9:30 AM)
  const marketOpen = new Date(now);
  marketOpen.setHours(9, 30, 0, 0);
  
  // Generate data points at appropriate intervals
  for (let i = 0; i < dataPointCount; i++) {
    const timePoint = new Date(marketOpen);
    const intervalMinutes = parseInt(interval.replace('min', ''));
    timePoint.setMinutes(timePoint.getMinutes() + (i * intervalMinutes));
    
    // Stop if we exceed 4:00 PM (market close)
    if (timePoint.getHours() >= 16) {
      break;
    }
    
    // Simulate price movement
    const change = (Math.random() - 0.48) * 1; // Small random change with slight upward bias
    currentPrice = Math.max(currentPrice + change, 10);
    
    const volatility = currentPrice * 0.01; // 1% volatility
    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility / 2;
    const low = Math.min(open, close) - Math.random() * volatility / 2;
    
    data.push({
      datetime: timePoint.toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 100000) + 10000
    });
  }
  
  return data;
};

// Utility function to get full name of indices
function getFullIndexName(symbol: string): string {
  const indices = {
    'SPY': 'S&P 500',
    'DIA': 'Dow Jones',
    'QQQ': 'NASDAQ',
    'IWM': 'Russell 2000',
    'VTI': 'Total Market',
    'NIFTYBEES': 'Nifty 50',
    'BANKBEES': 'Bank Nifty',
    'SETFNIF50': 'Nifty 50'
  };
  
  return indices[symbol as keyof typeof indices] || symbol;
}