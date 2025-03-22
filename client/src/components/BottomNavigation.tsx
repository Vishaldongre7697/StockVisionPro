import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Eye, LineChart, TrendingUp, Bot, MessageCircle } from 'lucide-react';

export function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/watchlist', label: 'Watchlist', icon: Eye },
    { path: '/ai-insights', label: 'AI Insights', icon: Bot },
    { path: '/predictions', label: 'Predictions', icon: LineChart },
    { path: '/algotrade', label: 'Algotrade', icon: TrendingUp },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link key={item.path} href={item.path}>
          <a className={`bottom-nav-item ${location === item.path ? 'active' : ''}`}>
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </a>
        </Link>
      ))}
    </nav>
  );
}

export function FloatingSuhuButton() {
  return (
    <Link href="/suhu-ai">
      <a className="floating-suhu-btn">
        <MessageCircle className="h-6 w-6" />
      </a>
    </Link>
  );
}