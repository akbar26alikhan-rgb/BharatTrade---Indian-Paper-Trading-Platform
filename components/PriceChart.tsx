
import React, { useEffect, useRef } from 'react';
import { Instrument } from '../types';

interface PriceChartProps {
  stock: Instrument;
}

const PriceChart: React.FC<PriceChartProps> = ({ stock }) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
          "interval": "1", // 1-minute interval for real-time feel
          "timezone": "Asia/Kolkata",
          "theme": "light",
          "style": "1", // Candlesticks
          "locale": "en",
          "toolbar_bg": "#f8fafc",
          "enable_publishing": false,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "save_image": true,
          "container_id": containerId,
          "withdateranges": true,
          "hide_side_toolbar": false, // Show drawing tools
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
      <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 leading-none">{stock.symbol}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                stock.exchange === 'BSE' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-blue-100 text-blue-600 border border-blue-200'
              }`}>
                {stock.exchange} LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[150px] md:max-w-none">{stock.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:block text-right">
             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Market Price</div>
             <div className="text-xl font-black text-slate-900 leading-none">
              ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
             </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center justify-end gap-1 font-bold text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
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
        <span className="flex items-center gap-1"><i className="fa-solid fa-clock"></i> REAL-TIME FEED</span>
        <span className="h-3 w-px bg-slate-200"></span>
        <span className="flex items-center gap-1 text-slate-500 uppercase tracking-tighter">Interval: 1m</span>
        <span className="h-3 w-px bg-slate-200"></span>
        <span className="flex items-center gap-1 text-slate-500 uppercase tracking-tighter">Exchange: {stock.exchange}</span>
        <span className="h-3 w-px bg-slate-200"></span>
        <span className="flex items-center gap-1 text-slate-500 uppercase tracking-tighter">Timezone: IST</span>
      </div>
    </div>
  );
};

export default PriceChart;
