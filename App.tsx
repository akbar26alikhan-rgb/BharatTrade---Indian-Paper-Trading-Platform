
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Watchlist from './components/Watchlist';
import TradingPanel from './components/TradingPanel';
import PriceChart from './components/PriceChart';
import { Instrument, AppState, Order, OrderStatus, TransactionType, ProductType, OrderType, Position } from './types';
import { INITIAL_STOCKS, INITIAL_BALANCE, INDICES } from './constants';
import { getMarketInsights, getMarketNews } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stocks, setStocks] = useState<Instrument[]>(INITIAL_STOCKS);
  const [selectedStock, setSelectedStock] = useState<Instrument>(INITIAL_STOCKS[0]);
  const [news, setNews] = useState<string[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('Select a stock to see AI analysis...');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // App State with Persistence
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('bharattrade_state');
    if (saved) return JSON.parse(saved);
    return {
      wallet: { balance: INITIAL_BALANCE, initialBalance: INITIAL_BALANCE },
      watchlist: INITIAL_STOCKS,
      orders: [],
      positions: [],
      holdings: [],
    };
  });

  useEffect(() => {
    localStorage.setItem('bharattrade_state', JSON.stringify(state));
  }, [state]);

  // Simulate price updates every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const volatility = 0.0015;
        const changeAmount = (Math.random() - 0.5) * s.price * volatility;
        const newPrice = Math.max(1, s.price + changeAmount);
        const originalPrice = s.price / (1 + (s.changePercent / 100));
        const totalChange = newPrice - originalPrice;
        const totalChangePercent = (totalChange / originalPrice) * 100;
        
        return {
          ...s,
          price: newPrice,
          change: totalChange,
          changePercent: totalChangePercent
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Sync selected stock price and data
  useEffect(() => {
    const updated = stocks.find(s => s.symbol === selectedStock.symbol && s.exchange === selectedStock.exchange);
    if (updated) setSelectedStock(updated);
  }, [stocks]);

  // Fetch AI Data
  useEffect(() => {
    getMarketNews().then(setNews);
  }, []);

  useEffect(() => {
    setIsLoadingInsight(true);
    getMarketInsights(selectedStock.symbol).then(insight => {
      setAiInsight(insight);
      setIsLoadingInsight(false);
    });
  }, [selectedStock.symbol]);

  const handleAddStock = (symbol: string, exchange: 'NSE' | 'BSE') => {
    if (stocks.some(s => s.symbol === symbol && s.exchange === exchange)) {
      alert("Stock already in watchlist.");
      return;
    }

    const newInstrument: Instrument = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      name: `${symbol} (Custom)`,
      price: Math.floor(Math.random() * 5000) + 100, // Random starting price for demo
      change: 0,
      changePercent: 0,
      exchange
    };

    setStocks(prev => [newInstrument, ...prev]);
    setSelectedStock(newInstrument);
  };

  const handlePlaceOrder = useCallback((orderDetails: {
    instrumentId: string;
    symbol: string;
    orderType: OrderType;
    productType: ProductType;
    transactionType: TransactionType;
    quantity: number;
    price: number;
  }) => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      ...orderDetails,
      status: OrderStatus.EXECUTED,
      timestamp: Date.now(),
    };

    setState(prev => {
      const isBuy = orderDetails.transactionType === TransactionType.BUY;
      const totalValue = orderDetails.price * orderDetails.quantity;
      const newBalance = isBuy 
        ? prev.wallet.balance - totalValue 
        : prev.wallet.balance + totalValue;

      let newPositions = [...prev.positions];
      const existingPosIdx = newPositions.findIndex(p => p.instrumentId === orderDetails.instrumentId);
      const qtyChange = isBuy ? orderDetails.quantity : -orderDetails.quantity;

      if (existingPosIdx > -1) {
        const p = newPositions[existingPosIdx];
        const newQty = p.quantity + qtyChange;
        
        if (newQty === 0) {
          newPositions.splice(existingPosIdx, 1);
        } else {
          const isAddingToPosition = (p.quantity > 0 && isBuy) || (p.quantity < 0 && !isBuy);
          const newAvgPrice = isAddingToPosition
            ? ((Math.abs(p.avgPrice * p.quantity)) + (orderDetails.price * orderDetails.quantity)) / Math.abs(newQty)
            : p.avgPrice;
          
          newPositions[existingPosIdx] = { 
            ...p, 
            quantity: newQty, 
            avgPrice: newAvgPrice
          };
        }
      } else {
        newPositions.push({
          instrumentId: orderDetails.instrumentId,
          symbol: orderDetails.symbol,
          quantity: qtyChange,
          avgPrice: orderDetails.price,
          currentPrice: orderDetails.price,
          realizedPnl: 0
        });
      }

      return {
        ...prev,
        wallet: { ...prev.wallet, balance: newBalance },
        orders: [newOrder, ...prev.orders],
        positions: newPositions
      };
    });
  }, []);

  const handleExitPosition = (pos: Position) => {
    const stock = stocks.find(s => s.id === pos.instrumentId);
    const ltp = stock?.price || pos.avgPrice;
    
    if (window.confirm(`Are you sure you want to exit ${pos.symbol} position of ${pos.quantity} units at ₹${ltp.toFixed(2)}?`)) {
      handlePlaceOrder({
        instrumentId: pos.instrumentId,
        symbol: pos.symbol,
        orderType: OrderType.MARKET,
        productType: ProductType.CNC,
        transactionType: pos.quantity > 0 ? TransactionType.SELL : TransactionType.BUY,
        quantity: Math.abs(pos.quantity),
        price: ltp
      });
    }
  };

  const handleSquareOffAll = () => {
    if (state.positions.length === 0) return;
    
    if (window.confirm(`Are you sure you want to close all ${state.positions.length} open positions at market price?`)) {
      state.positions.forEach(pos => {
        const stock = stocks.find(s => s.id === pos.instrumentId);
        const ltp = stock?.price || pos.avgPrice;
        handlePlaceOrder({
          instrumentId: pos.instrumentId,
          symbol: pos.symbol,
          orderType: OrderType.MARKET,
          productType: ProductType.CNC,
          transactionType: pos.quantity > 0 ? TransactionType.SELL : TransactionType.BUY,
          quantity: Math.abs(pos.quantity),
          price: ltp
        });
      });
    }
  };

  const portfolioStats = useMemo(() => {
    const totalPnl = state.positions.reduce((acc, pos) => {
      const ltp = stocks.find(s => s.id === pos.instrumentId)?.price || pos.avgPrice;
      return acc + (ltp - pos.avgPrice) * pos.quantity;
    }, 0);
    return { totalPnl };
  }, [state.positions, stocks]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {INDICES.map(idx => (
                  <div key={idx.name} className="flex-shrink-0">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{idx.name}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-800">{idx.value.toLocaleString('en-IN')}</span>
                      <span className={`text-xs font-bold ${idx.percent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {idx.percent >= 0 ? '+' : ''}{idx.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right ml-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equity Wallet</div>
                <div className="text-xl font-bold text-blue-600">₹{state.wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-white p-0 rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[600px]">
                    <PriceChart stock={selectedStock} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-brain text-blue-500"></i> AI Insight: {selectedStock.symbol}
                      </h3>
                      <div className={`text-sm text-slate-600 leading-relaxed ${isLoadingInsight ? 'animate-pulse' : ''}`}>
                        {aiInsight}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-newspaper text-orange-500"></i> Market News
                      </h3>
                      <ul className="space-y-3">
                        {news.map((item, i) => (
                          <li key={i} className="text-sm text-slate-600 border-l-4 border-blue-500 pl-3 py-1">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <TradingPanel 
                    stock={selectedStock} 
                    walletBalance={state.wallet.balance}
                    onPlaceOrder={handlePlaceOrder}
                  />

                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl text-white">
                    <h3 className="font-bold text-white/80 text-xs uppercase tracking-widest mb-4">Portfolio Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 text-sm">Invested Value</span>
                        <span className="font-bold">₹{ (state.wallet.initialBalance - state.wallet.balance).toLocaleString('en-IN') }</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 text-sm">M2M P&L</span>
                        <span className={`font-bold ${portfolioStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {portfolioStats.totalPnl >= 0 ? '+' : ''}₹{portfolioStats.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-blue-100 text-sm">Estimated Total Equity</span>
                        <span className="text-xl font-black text-white">
                          ₹{ (state.wallet.balance + portfolioStats.totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 }) }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-800">Order History</h2>
               <span className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">Total: {state.orders.length}</span>
             </div>
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                   <tr>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Time</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Type</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Instrument</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Qty</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Price</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {state.orders.length === 0 ? (
                     <tr>
                       <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No orders placed yet.</td>
                     </tr>
                   ) : state.orders.map(order => (
                     <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.timestamp).toLocaleTimeString()}</td>
                       <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${order.transactionType === TransactionType.BUY ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                           {order.transactionType}
                         </span>
                       </td>
                       <td className="px-6 py-4 font-bold text-slate-800">{order.symbol}</td>
                       <td className="px-6 py-4 text-sm text-slate-600">{order.quantity}</td>
                       <td className="px-6 py-4 text-sm font-semibold text-slate-800">₹{order.price.toFixed(2)}</td>
                       <td className="px-6 py-4">
                         <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-md text-[10px] font-bold">EXECUTED</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );
      case 'positions':
        return (
          <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-800">Positions</h2>
               <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Unrealized P&L</p>
                    <p className={`text-xl font-black ${portfolioStats.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {portfolioStats.totalPnl >= 0 ? '+' : ''}₹{portfolioStats.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                 </div>
                 <button 
                  onClick={handleSquareOffAll}
                  disabled={state.positions.length === 0}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md ${state.positions.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                 >
                   Square Off All
                 </button>
               </div>
             </div>
             
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                   <tr>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Instrument</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Qty</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Avg Price</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">LTP</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">P&L</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Chg%</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {state.positions.length === 0 ? (
                     <tr>
                       <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">No open positions. Start trading from the dashboard!</td>
                     </tr>
                   ) : state.positions.map(pos => {
                     const stock = stocks.find(s => s.id === pos.instrumentId);
                     const ltp = stock?.price || pos.avgPrice;
                     const pnl = (ltp - pos.avgPrice) * pos.quantity;
                     const pnlPercent = (pnl / (Math.abs(pos.avgPrice * Math.abs(pos.quantity)))) * 100;

                     return (
                       <tr key={pos.instrumentId} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="font-bold text-slate-800">{pos.symbol}</div>
                           <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Paper Trade</div>
                         </td>
                         <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded-md text-xs font-bold ${pos.quantity > 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                             {pos.quantity}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-600">₹{pos.avgPrice.toFixed(2)}</td>
                         <td className="px-6 py-4 text-sm font-medium text-slate-800">
                           ₹{ltp.toFixed(2)}
                           <div className={`text-[10px] ${stock && stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {stock ? `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}` : '0.00'}
                           </div>
                         </td>
                         <td className={`px-6 py-4 font-black ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {pnl >= 0 ? '+' : ''}{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                         </td>
                         <td className={`px-6 py-4 text-xs font-bold ${pnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button 
                             className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-all shadow-sm active:scale-95"
                             onClick={() => handleExitPosition(pos)}
                           >
                             Exit
                           </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          </div>
        );
      case 'funds':
        return (
          <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Funds & Wallet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-400 font-bold uppercase mb-2">Available Margin</p>
                <p className="text-5xl font-black text-blue-600 mb-8">₹{state.wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                
                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Opening Balance</span>
                    <span className="font-semibold text-slate-800">₹{state.wallet.initialBalance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Used Margin</span>
                    <span className="font-semibold text-rose-500">₹{ (state.wallet.initialBalance - state.wallet.balance > 0 ? state.wallet.initialBalance - state.wallet.balance : 0).toLocaleString('en-IN') }</span>
                  </div>
                </div>
                
                <div className="mt-10 flex gap-4">
                  <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Add Funds</button>
                  <button 
                    onClick={() => {
                      if(confirm("Reset wallet to 10 Lakh?")) {
                        setState(prev => ({ ...prev, wallet: { balance: INITIAL_BALANCE, initialBalance: INITIAL_BALANCE }, positions: [], orders: [] }));
                      }
                    }}
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Reset Wallet
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-6">Recent Ledger Entries</h3>
                <div className="space-y-4">
                  {state.orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex justify-between items-center py-3 border-b border-slate-50">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{order.transactionType === TransactionType.BUY ? 'Purchase' : 'Sale'} of {order.symbol}</p>
                        <p className="text-[10px] text-slate-400">{new Date(order.timestamp).toLocaleString()}</p>
                      </div>
                      <p className={`font-bold ${order.transactionType === TransactionType.BUY ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {order.transactionType === TransactionType.BUY ? '-' : '+'}₹{(order.price * order.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                  {state.orders.length === 0 && <p className="text-center text-slate-400 py-10 italic">No transactions yet.</p>}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-slate-400 italic">
            Component for "{activeTab}" under development.
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'dashboard' && (
          <Watchlist 
            stocks={stocks} 
            onSelect={setSelectedStock} 
            onAddStock={handleAddStock}
            selectedSymbol={selectedStock.symbol} 
          />
        )}
        
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
