
import React, { useEffect, useRef, useState } from 'react';
import { Instrument } from '../types';

interface PriceChartProps {
  stock: Instrument;
  onExchangeChange?: (exchange: 'NSE' | 'BSE') => void;
}

const PriceChart: React.FC<PriceChartProps> = ({ stock, onExchangeChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [marketClock, setMarketClock] = useState('');

  // Local effect for market timestamp display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (3600000 * 5.5));
      setMarketClock(ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = `tradingview_${stock.id}_${Math.floor(Math.random() * 1000)}`;
    containerRef.current.id = containerId;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      const win = window as any;
      if (typeof win.TradingView !== 'undefined' && containerRef.current) {
        new win.TradingView.widget({
          "autosize": true,
          "symbol": `${stock.exchange}:${stock.symbol}`,
          "interval": "1",
          "timezone": "Asia/Kolkata",
          "theme": "light",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f8fafc",
          "enable_publishing": false,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "save_image": true,
          "container_id": containerId,
          "withdateranges": true,
          "hide_side_toolbar": false,
          "allow_symbol_change": false,
          "details": true,
          "hotlist": false,
          "calendar": true,
          "show_popup_button": true,
          "popup_width": "1000",
          "popup_height": "650",
          "studies": [
            "Volume@tv-basicstudies",
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies"
          ],
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [stock.symbol, stock.exchange, stock.id]);

  const isPositive = stock.change >= 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-slate-100 bg-white gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 leading-none tracking-tight">{stock.symbol}</h2>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['NSE', 'BSE'] as const).map(ext => (
                  <button
                    key={ext}
                    onClick={() => onExchangeChange?.(ext)}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all uppercase tracking-tighter ${
                      stock.exchange === ext 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {ext}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[150px] md:max-w-none mt-1">{stock.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
             <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">
               MARKET PRICE (IST: {marketClock})
             </div>
             <div className="text-xl font-black text-slate-900 leading-none">
              ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
             </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center justify-end gap-1 font-black text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              <i className={`fa-solid ${isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
              {isPositive ? '+' : ''}{stock.change.toFixed(2)}
            </div>
            <div className={`text-[11px] font-bold ${isPositive ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
              ({stock.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>
      
      {/* Widget Container */}
      <div className="flex-1 relative bg-slate-50">
        <div 
          ref={containerRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Quick Stats Footer */}
      <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-4 text-[10px] font-bold text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <span className="flex items-center gap-1 text-emerald-500"><i className="fa-solid fa-circle text-[6px]"></i> LIVE {stock.exchange}</span>
        <span className="h-3 w-px bg-slate-200"></span>
        <span className="flex items-center gap-1 text-slate-500 uppercase tracking-tighter">DATA SYNC: ACTIVE</span>
        <span className="h-3 w-px bg-slate-200"></span>
        <span className="flex items-center gap-1 text-slate-500 uppercase tracking-tighter">TZ: ASIA/KOLKATA (IST)</span>
      </div>
    </div>
  );
};

export default PriceChart;
