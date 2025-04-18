import axios from 'axios';
import { Stock } from '@shared/schema';

// API Configuration - will be replaced with real API keys
const STOCK_API_KEY = import.meta.env.VITE_STOCK_API_KEY || '';

// Default API endpoint for Alpha Vantage - change this to your preferred provider
const BASE_URL = 'https://www.alphavantage.co/query';

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
      throw new Error('API key missing');
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
    throw error;
  }
};

/**
 * Search stocks by keywords
 */
export const searchStocks = async (keywords: string) => {
  try {
    if (!STOCK_API_KEY) {
      throw new Error('API key missing');
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
    throw error;
  }
};

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
      throw new Error('API key missing');
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
    throw error;
  }
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