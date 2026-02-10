
import React, { useState } from 'react';
import { Instrument } from '../types';

interface WatchlistProps {
  stocks: Instrument[];
  onSelect: (stock: Instrument) => void;
  selectedSymbol?: string;
}

const Watchlist: React.FC<WatchlistProps> = ({ stocks, onSelect, selectedSymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="Search stocks (e.g. INFOSYS)"
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredStocks.map((stock) => (
          <div
            key={stock.id}
            onClick={() => onSelect(stock)}
            className={`flex items-center justify-between p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${
              selectedSymbol === stock.symbol ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{stock.symbol}</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded uppercase">{stock.exchange}</span>
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[120px]">{stock.name}</div>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${stock.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className={`text-xs ${stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
        <button className="text-xs text-blue-600 font-semibold hover:underline">
          <i className="fa-solid fa-plus mr-1"></i> Add more stocks
        </button>
      </div>
    </div>
  );
};

export default Watchlist;
