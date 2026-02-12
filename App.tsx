
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

  // Handle auto-exits for SL/TP
  const checkTriggers = useCallback((currentStocks: Instrument[]) => {
    setState(prev => {
      let balanceChange = 0;
      let newOrders = [...prev.orders];
      let newPositions = [...prev.positions];
      let changed = false;

      prev.positions.forEach((pos, idx) => {
        const stock = currentStocks.find(s => s.id === pos.instrumentId);
        if (!stock) return;

        const price = stock.price;
        let triggered = false;
        let triggerType = "";

        // Check Take Profit
        if (pos.takeProfit) {
          if ((pos.quantity > 0 && price >= pos.takeProfit) || (pos.quantity < 0 && price <= pos.takeProfit)) {
            triggered = true;
            triggerType = "Take Profit";
          }
        }
        // Check Stop Loss
        if (pos.stopLoss) {
          if ((pos.quantity > 0 && price <= pos.stopLoss) || (pos.quantity < 0 && price >= pos.stopLoss)) {
            triggered = true;
            triggerType = "Stop Loss";
          }
        }

        if (triggered) {
          changed = true;
          const exitValue = price * Math.abs(pos.quantity);
          balanceChange += pos.quantity > 0 ? exitValue : -exitValue;
          
          // Calculate Realized P&L
          const realizedPnl = pos.quantity > 0 
            ? (price - pos.avgPrice) * pos.quantity 
            : (pos.avgPrice - price) * Math.abs(pos.quantity);

          // Log the order
          newOrders.unshift({
            id: Math.random().toString(36).substr(2, 9),
            instrumentId: pos.instrumentId,
            symbol: pos.symbol,
            orderType: OrderType.MARKET,
            productType: ProductType.MIS,
            transactionType: pos.quantity > 0 ? TransactionType.SELL : TransactionType.BUY,
            quantity: Math.abs(pos.quantity),
            price: price,
            status: OrderStatus.EXECUTED,
            timestamp: Date.now(),
            realizedPnl: realizedPnl
          });

          // Remove position
          newPositions = newPositions.filter((p) => p.instrumentId !== pos.instrumentId || p.quantity !== pos.quantity);
        }
      });

      if (!changed) return prev;

      return {
        ...prev,
        wallet: { ...prev.wallet, balance: prev.wallet.balance + balanceChange },
        orders: newOrders,
        positions: newPositions
      };
    });
  }, []);

  // Simulate price updates every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prev => {
        const updatedStocks = prev.map(s => {
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
        });
        
        checkTriggers(updatedStocks);
        return updatedStocks;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [checkTriggers]);

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
    const formattedSymbol = symbol.toUpperCase().trim();
    if (stocks.some(s => s.symbol === formattedSymbol && s.exchange === exchange)) {
      alert("Stock already in watchlist.");
      return;
    }

    const newInstrument: Instrument = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: formattedSymbol,
      name: `${formattedSymbol} (Custom)`,
      price: Math.floor(Math.random() * 5000) + 100,
      change: 0,
      changePercent: 0,
      exchange
    };

    setStocks(prev => [newInstrument, ...prev]);
    setSelectedStock(newInstrument);
  };

  const handleExchangeChange = (exchange: 'NSE' | 'BSE') => {
    if (selectedStock.exchange === exchange) return;
    const existing = stocks.find(s => s.symbol === selectedStock.symbol && s.exchange === exchange);
    if (existing) {
      setSelectedStock(existing);
    } else {
      const updated: Instrument = {
        ...selectedStock,
        id: `${selectedStock.symbol}-${exchange}-${Math.random()}`,
        exchange
      };
      setSelectedStock(updated);
    }
  };

  const handlePlaceOrder = useCallback((orderDetails: {
    instrumentId: string;
    symbol: string;
    orderType: OrderType;
    productType: ProductType;
    transactionType: TransactionType;
    quantity: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => {
    setState(prev => {
      const isBuy = orderDetails.transactionType === TransactionType.BUY;
      const totalValue = orderDetails.price * orderDetails.quantity;
      const newBalance = isBuy 
        ? prev.wallet.balance - totalValue 
        : prev.wallet.balance + totalValue;

      let newPositions = [...prev.positions];
      const existingPosIdx = newPositions.findIndex(p => p.instrumentId === orderDetails.instrumentId);
      const qtyChange = isBuy ? orderDetails.quantity : -orderDetails.quantity;
      
      let realizedPnl: number | undefined = undefined;

      if (existingPosIdx > -1) {
        const p = newPositions[existingPosIdx];
        const isReducing = (p.quantity > 0 && !isBuy) || (p.quantity < 0 && isBuy);
        if (isReducing) {
          const qtyToRealize = Math.min(Math.abs(p.quantity), orderDetails.quantity);
          realizedPnl = isBuy 
            ? (p.avgPrice - orderDetails.price) * qtyToRealize 
            : (orderDetails.price - p.avgPrice) * qtyToRealize;
        }

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
            avgPrice: newAvgPrice,
            stopLoss: orderDetails.stopLoss || p.stopLoss,
            takeProfit: orderDetails.takeProfit || p.takeProfit
          };
        }
      } else {
        newPositions.push({
          instrumentId: orderDetails.instrumentId,
          symbol: orderDetails.symbol,
          quantity: qtyChange,
          avgPrice: orderDetails.price,
          currentPrice: orderDetails.price,
          realizedPnl: 0,
          stopLoss: orderDetails.stopLoss,
          takeProfit: orderDetails.takeProfit
        });
      }

      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        ...orderDetails,
        status: OrderStatus.EXECUTED,
        timestamp: Date.now(),
        realizedPnl: realizedPnl
      };

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

  // Grouping logic for "Datewise" history
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    state.orders.forEach(order => {
      const date = new Date(order.timestamp).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });
    return Object.entries(groups).sort((a, b) => {
      // Sort by date descending
      const dateA = new Date(a[1][0].timestamp).getTime();
      const dateB = new Date(b[1][0].timestamp).getTime();
      return dateB - dateA;
    });
  }, [state.orders]);

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
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[550px]">
                    <PriceChart stock={selectedStock} onExchangeChange={handleExchangeChange} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <i className="fa-solid fa-brain text-blue-500"></i> AI Analyst Insights
                        </h3>
                        {isLoadingInsight && <i className="fa-solid fa-circle-notch fa-spin text-blue-400 text-xs"></i>}
                      </div>
                      <div className={`text-slate-600 text-sm leading-relaxed flex-1 ${isLoadingInsight ? 'opacity-40' : 'opacity-100'}`}>
                        {aiInsight}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-newspaper text-orange-500"></i> Market Pulse
                      </h3>
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-40">
                        {news.map((item, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                            <p className="text-xs text-slate-600 font-medium">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <TradingPanel stock={selectedStock} walletBalance={state.wallet.balance} onPlaceOrder={handlePlaceOrder} />
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
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold text-slate-800">Datewise Order History</h2>
               <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setState(prev => ({ ...prev, orders: [] }))}
                   className="text-xs font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider"
                 >
                   Clear History
                 </button>
                 <span className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">Total: {state.orders.length}</span>
               </div>
             </div>

             <div className="space-y-10">
               {state.orders.length === 0 ? (
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400 italic">
                   No historical orders found.
                 </div>
               ) : groupedOrders.map(([date, orders]) => (
                 <div key={date} className="space-y-3">
                   <div className="flex items-center gap-4 px-2">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{date}</h3>
                     <div className="h-px flex-1 bg-slate-200"></div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
                   </div>
                   
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-100">
                         <tr>
                           <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Time</th>
                           <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Type</th>
                           <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Instrument</th>
                           <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Qty</th>
                           <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Avg. Price</th>
                           <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Realized P&L</th>
                           <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Status</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {orders.map(order => (
                           <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-4">
                               <span className="text-xs font-bold text-slate-500">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                             </td>
                             <td className="px-6 py-4">
                               <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${order.transactionType === TransactionType.BUY ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                                 {order.transactionType}
                               </span>
                             </td>
                             <td className="px-6 py-4">
                               <div className="font-bold text-slate-800 text-sm">{order.symbol}</div>
                               <div className="text-[9px] text-slate-400 uppercase font-black">{order.productType}</div>
                             </td>
                             <td className="px-6 py-4 text-xs font-bold text-slate-600">{order.quantity}</td>
                             <td className="px-6 py-4 text-xs font-bold text-slate-800">₹{order.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                             <td className={`px-6 py-4 text-xs font-black ${order.realizedPnl !== undefined ? (order.realizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-300'}`}>
                               {order.realizedPnl !== undefined ? (
                                 <>
                                   {order.realizedPnl >= 0 ? '+' : ''}₹{order.realizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                 </>
                               ) : '--'}
                             </td>
                             <td className="px-6 py-4 text-right">
                               <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[9px] font-black tracking-tighter uppercase">EXECUTED</span>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        );
      case 'positions':
        return (
          <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-800">Active Positions</h2>
               <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Unrealized P&L</p>
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
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Targets</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {state.positions.length === 0 ? (
                     <tr>
                       <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">No open positions. Select a stock to trade.</td>
                     </tr>
                   ) : state.positions.map(pos => {
                     const stock = stocks.find(s => s.id === pos.instrumentId);
                     const ltp = stock?.price || pos.avgPrice;
                     const pnl = (ltp - pos.avgPrice) * pos.quantity;
                     return (
                       <tr key={`${pos.instrumentId}-${pos.quantity}`} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-6 py-4">
                           <div className="font-bold text-slate-800">{pos.symbol}</div>
                           <div className="text-[10px] text-slate-400 uppercase font-black">Paper Trade</div>
                         </td>
                         <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded-md text-xs font-bold ${pos.quantity > 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                             {pos.quantity}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-600 font-bold">₹{pos.avgPrice.toFixed(2)}</td>
                         <td className="px-6 py-4 text-sm font-bold text-slate-800">
                           ₹{ltp.toFixed(2)}
                         </td>
                         <td className={`px-6 py-4 font-black text-sm ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {pnl >= 0 ? '+' : ''}{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                         </td>
                         <td className="px-6 py-4">
                            <div className="text-[10px] font-bold space-y-1 uppercase tracking-tighter">
                              <div className={pos.stopLoss ? 'text-rose-400' : 'text-slate-300'}>SL: {pos.stopLoss ? `₹${pos.stopLoss}` : 'NONE'}</div>
                              <div className={pos.takeProfit ? 'text-emerald-400' : 'text-slate-300'}>TP: {pos.takeProfit ? `₹${pos.takeProfit}` : 'NONE'}</div>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button className="px-4 py-1.5 text-xs font-black text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-all uppercase tracking-tighter" onClick={() => handleExitPosition(pos)}>Exit</button>
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
                  <div className="flex justify-between"><span className="text-slate-500 font-bold text-xs uppercase">Opening Balance</span><span className="font-black text-slate-800">₹{state.wallet.initialBalance.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold text-xs uppercase">Used Margin</span><span className="font-black text-rose-500">₹{ (state.wallet.initialBalance - state.wallet.balance > 0 ? state.wallet.initialBalance - state.wallet.balance : 0).toLocaleString('en-IN') }</span></div>
                </div>
                <div className="mt-10 flex gap-4">
                  <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Add Funds</button>
                  <button onClick={() => { if(confirm("Reset wallet to 10 Lakh?")) { setState(prev => ({ ...prev, wallet: { balance: INITIAL_BALANCE, initialBalance: INITIAL_BALANCE }, positions: [], orders: [] })); } }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black uppercase text-xs hover:bg-slate-200 transition-all">Reset Wallet</button>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Recent Ledger</h3>
                <div className="space-y-4">
                  {state.orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex justify-between items-center py-3 border-b border-slate-50">
                      <div><p className="font-bold text-sm text-slate-800">{order.transactionType === TransactionType.BUY ? 'Bought' : 'Sold'} {order.symbol}</p><p className="text-[10px] text-slate-400 font-bold">{new Date(order.timestamp).toLocaleString()}</p></div>
                      <p className={`font-black text-sm ${order.transactionType === TransactionType.BUY ? 'text-rose-500' : 'text-emerald-500'}`}>{order.transactionType === TransactionType.BUY ? '-' : '+'}₹{(order.price * order.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                  {state.orders.length === 0 && <p className="text-center text-slate-400 py-10 italic">No transactions yet.</p>}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'dashboard' && (
          <Watchlist stocks={stocks} onSelect={setSelectedStock} onAddStock={handleAddStock} selectedSymbol={selectedStock.symbol} />
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
