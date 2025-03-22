import { Stock, StockSentiment } from "@shared/schema";

// Historical chart data generator
export const generateChartData = (
  basePrice: number,
  dataPoints: number,
  trend: "up" | "down" | "sideways" = "sideways",
  volatility = 0.01
): number[] => {
  let currentPrice = basePrice;
  const data: number[] = [currentPrice];
  
  // Trend factor
  const trendFactor = trend === "up" ? 0.002 : trend === "down" ? -0.002 : 0;
  
  for (let i = 1; i < dataPoints; i++) {
    // Random movement with trend bias
    const randomMove = (Math.random() - 0.5) * volatility * basePrice;
    const trendMove = trendFactor * basePrice;
    
    currentPrice = currentPrice + randomMove + trendMove;
    // Ensure price doesn't go below zero
    currentPrice = Math.max(currentPrice, 0.01);
    
    data.push(parseFloat(currentPrice.toFixed(2)));
  }
  
  return data;
};

// Generate time labels (hours for intraday)
export const generateTimeLabels = (points: number, interval: "1D" | "1W" | "1M" = "1D"): string[] => {
  const labels: string[] = [];
  
  if (interval === "1D") {
    // For intraday - 9:15 AM to 3:30 PM (market hours)
    const startHour = 9;
    const startMinute = 15;
    const totalMinutes = 375; // 6 hours and 15 minutes
    
    const minutesPerPoint = Math.floor(totalMinutes / (points - 1));
    
    for (let i = 0; i < points; i++) {
      const minutesFromStart = i * minutesPerPoint;
      const hour = Math.floor((startHour * 60 + startMinute + minutesFromStart) / 60);
      const minute = (startMinute + minutesFromStart) % 60;
      
      labels.push(`${hour}:${minute.toString().padStart(2, '0')}`);
    }
  } else if (interval === "1W") {
    // For weekly - Monday to Friday
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    for (let i = 0; i < points; i++) {
      labels.push(days[i % 5]);
    }
  } else {
    // For monthly - dates
    for (let i = 1; i <= points; i++) {
      labels.push(`${i}`);
    }
  }
  
  return labels;
};

// Calculate stock sentiment based on technical factors
export const calculateSentiment = (stock: Stock): StockSentiment => {
  // This is a simplified model
  const changePercent = stock.changePercent || 0;
  
  if (changePercent > 3) return StockSentiment.VERY_BULLISH;
  if (changePercent > 1) return StockSentiment.BULLISH;
  if (changePercent < -3) return StockSentiment.VERY_BEARISH;
  if (changePercent < -1) return StockSentiment.BEARISH;
  return StockSentiment.NEUTRAL;
};

// Format currency in Indian format
export const formatIndianCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

// Format large numbers in a readable format (K, M, B, T)
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T';
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toString();
};
