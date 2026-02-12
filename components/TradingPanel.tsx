
import React, { useState, useEffect } from 'react';
import { Instrument, OrderType, ProductType, TransactionType } from '../types';

interface TradingPanelProps {
  stock: Instrument;
  walletBalance: number;
  onPlaceOrder: (order: {
    instrumentId: string;
    symbol: string;
    orderType: OrderType;
    productType: ProductType;
    transactionType: TransactionType;
    quantity: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => void;
}

const TradingPanel: React.FC<TradingPanelProps> = ({ stock, walletBalance, onPlaceOrder }) => {
  const [txnType, setTxnType] = useState<TransactionType>(TransactionType.BUY);
  const [productType, setProductType] = useState<ProductType>(ProductType.CNC);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState(stock.price);
  
  // Advanced Bracket Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableSL, setEnableSL] = useState(false);
  const [enableTP, setEnableTP] = useState(false);
  const [slPrice, setSlPrice] = useState(0);
  const [tpPrice, setTpPrice] = useState(0);

  useEffect(() => {
    setLimitPrice(stock.price);
    // Suggest default SL/TP values (e.g. 2% SL, 5% TP)
    if (!enableSL) setSlPrice(txnType === TransactionType.BUY ? stock.price * 0.98 : stock.price * 1.02);
    if (!enableTP) setTpPrice(txnType === TransactionType.BUY ? stock.price * 1.05 : stock.price * 0.95);
  }, [stock, txnType]);

  const executionPrice = orderType === OrderType.MARKET ? stock.price : limitPrice;
  const totalCost = executionPrice * qty;
  const isInsufficient = txnType === TransactionType.BUY && totalCost > walletBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficient) return;
    onPlaceOrder({
      instrumentId: stock.id,
      symbol: stock.symbol,
      orderType,
      productType,
      transactionType: txnType,
      quantity: qty,
      price: executionPrice,
      stopLoss: enableSL ? slPrice : undefined,
      takeProfit: enableTP ? tpPrice : undefined,
    });
  };

  // Profit/Loss estimates
  const estProfit = enableTP ? (txnType === TransactionType.BUY ? (tpPrice - executionPrice) * qty : (executionPrice - tpPrice) * qty) : 0;
  const estLoss = enableSL ? (txnType === TransactionType.BUY ? (executionPrice - slPrice) * qty : (slPrice - executionPrice) * qty) : 0;

  return (
    <div className={`rounded-xl shadow-lg border overflow-hidden ${
      txnType === TransactionType.BUY ? 'border-blue-100' : 'border-rose-100'
    } bg-white transition-all`}>
      <div className={`${txnType === TransactionType.BUY ? 'bg-blue-600' : 'bg-rose-600'} p-4 text-white flex justify-between items-center`}>
        <div className="flex items-center gap-3">
           <span className="font-bold text-lg">{txnType} {stock.symbol}</span>
           <span className="text-xs bg-white/20 px-2 py-0.5 rounded uppercase">{stock.exchange}</span>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setTxnType(TransactionType.BUY)}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${txnType === TransactionType.BUY ? 'bg-white text-blue-600 shadow-sm' : 'hover:bg-white/10'}`}
          >
            BUY
          </button>
          <button 
            onClick={() => setTxnType(TransactionType.SELL)}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${txnType === TransactionType.SELL ? 'bg-white text-rose-600 shadow-sm' : 'hover:bg-white/10'}`}
          >
            SELL
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Product</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProductType(ProductType.CNC)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  productType === ProductType.CNC ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-600'
                }`}
              >
                CNC <span className="text-[10px] block opacity-60">Delivery</span>
              </button>
              <button
                type="button"
                onClick={() => setProductType(ProductType.MIS)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  productType === ProductType.MIS ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-600'
                }`}
              >
                MIS <span className="text-[10px] block opacity-60">Intraday</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Order Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderType(OrderType.MARKET)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  orderType === OrderType.MARKET ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-600'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType(OrderType.LIMIT)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  orderType === OrderType.LIMIT ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-600'
                }`}
              >
                Limit
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Quantity</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Price</label>
            <input
              type="number"
              step="0.05"
              disabled={orderType === OrderType.MARKET}
              value={orderType === OrderType.MARKET ? stock.price.toFixed(2) : limitPrice}
              onChange={(e) => setLimitPrice(Number(e.target.value))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                orderType === OrderType.MARKET ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
        </div>

        {/* Bracket Orders / Advanced Section */}
        <div className="border-t border-slate-100 pt-4">
          <button 
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
          >
            <i className={`fa-solid fa-chevron-${showAdvanced ? 'down' : 'right'}`}></i>
            Advanced Options (Bracket Order)
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
               <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Stop Loss</label>
                      <input type="checkbox" checked={enableSL} onChange={e => setEnableSL(e.target.checked)} className="rounded" />
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      disabled={!enableSL}
                      value={slPrice}
                      onChange={e => setSlPrice(Number(e.target.value))}
                      className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none transition-all ${
                        !enableSL ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white border-rose-200 text-rose-600'
                      }`}
                      placeholder="SL Price"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Take Profit</label>
                      <input type="checkbox" checked={enableTP} onChange={e => setEnableTP(e.target.checked)} className="rounded" />
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      disabled={!enableTP}
                      value={tpPrice}
                      onChange={e => setTpPrice(Number(e.target.value))}
                      className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none transition-all ${
                        !enableTP ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white border-emerald-200 text-emerald-600'
                      }`}
                      placeholder="TP Price"
                    />
                  </div>
               </div>
               
               {(enableSL || enableTP) && (
                 <div className="flex gap-4 text-[10px] font-bold uppercase">
                   {enableSL && (
                     <div className="text-rose-500">Max Risk: ₹{estLoss.toLocaleString('en-IN')}</div>
                   )}
                   {enableTP && (
                     <div className="text-emerald-500">Target Profit: ₹{estProfit.toLocaleString('en-IN')}</div>
                   )}
                 </div>
               )}
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
           <div className="flex justify-between text-sm">
             <span className="text-slate-500">Margin required</span>
             <span className="font-bold text-slate-800">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
           </div>
           <div className="flex justify-between text-sm">
             <span className="text-slate-500">Available funds</span>
             <span className="font-bold text-slate-800">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
           </div>
           {isInsufficient && (
             <div className="text-xs text-rose-500 font-semibold mt-2">
               <i className="fa-solid fa-triangle-exclamation mr-1"></i> Insufficient funds
             </div>
           )}
        </div>

        <button
          disabled={isInsufficient}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
            isInsufficient 
            ? 'bg-slate-300 cursor-not-allowed' 
            : txnType === TransactionType.BUY ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200' : 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-200'
          }`}
        >
          {txnType} {qty} SHARE{qty > 1 ? 'S' : ''}
        </button>
      </form>
    </div>
  );
};

export default TradingPanel;
