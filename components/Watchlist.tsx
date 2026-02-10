
import React, { useState } from 'react';
import { Instrument } from '../types';

interface WatchlistProps {
  stocks: Instrument[];
  onSelect: (stock: Instrument) => void;
  onAddStock: (symbol: string, exchange: 'NSE' | 'BSE') => void;
  selectedSymbol?: string;
}

const Watchlist: React.FC<WatchlistProps> = ({ stocks, onSelect, onAddStock, selectedSymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState<'ALL' | 'NSE' | 'BSE'>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newExchange, setNewExchange] = useState<'NSE' | 'BSE'>('NSE');

  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExchange = exchangeFilter === 'ALL' || s.exchange === exchangeFilter;
    return matchesSearch && matchesExchange;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      onAddStock(newSymbol.toUpperCase().trim(), newExchange);
      setNewSymbol('');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Search and Filters */}
      <div className="p-4 border-b border-slate-100 space-y-3 bg-white z-10">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="Search watchlist..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-lg">
          {(['ALL', 'NSE', 'BSE'] as const).map((ext) => (
            <button
              key={ext}
              onClick={() => setExchangeFilter(ext)}
              className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${
                exchangeFilter === ext ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {ext}
            </button>
          ))}
        </div>
      </div>

      {/* Stock List */}
      <div className="flex-1 overflow-y-auto">
        {filteredStocks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <i className="fa-solid fa-layer-group text-3xl mb-3 block opacity-20"></i>
            <p className="text-xs">No stocks found in {exchangeFilter} filter</p>
          </div>
        ) : (
          filteredStocks.map((stock) => (
            <div
              key={stock.id}
              onClick={() => onSelect(stock)}
              className={`flex items-center justify-between p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${
                selectedSymbol === stock.symbol && stocks.find(s => s.id === stock.id)?.exchange === stock.exchange 
                  ? 'bg-blue-50 border-r-4 border-r-blue-500' 
                  : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{stock.symbol}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-tighter uppercase ${
                    stock.exchange === 'BSE' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {stock.exchange}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{stock.name}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${stock.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className={`text-[10px] font-medium ${stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Add Stock Action */}
      <div className="p-3 bg-slate-50 border-t border-slate-200">
        {isAdding ? (
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="flex gap-2">
              <input 
                autoFocus
                type="text"
                placeholder="SYMBOL (e.g. RELIANCE)"
                className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
              />
              <select 
                className="text-[10px] font-bold bg-white border border-slate-200 rounded-lg px-2"
                value={newExchange}
                onChange={(e) => setNewExchange(e.target.value as 'NSE' | 'BSE')}
              >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-2 rounded-lg hover:bg-blue-700"
              >
                ADD TO WATCHLIST
              </button>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 text-slate-500 text-[10px] font-bold"
              >
                CANCEL
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full text-xs text-blue-600 font-bold hover:bg-blue-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-circle-plus"></i> ADD INSTRUMENT
          </button>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
