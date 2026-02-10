
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
  }) => void;
}

const TradingPanel: React.FC<TradingPanelProps> = ({ stock, walletBalance, onPlaceOrder }) => {
  const [txnType, setTxnType] = useState<TransactionType>(TransactionType.BUY);
  const [productType, setProductType] = useState<ProductType>(ProductType.CNC);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState(stock.price);

  useEffect(() => {
    setLimitPrice(stock.price);
  }, [stock]);

  const totalCost = (orderType === OrderType.MARKET ? stock.price : limitPrice) * qty;
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
      price: orderType === OrderType.MARKET ? stock.price : limitPrice,
    });
  };

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
              value={orderType === OrderType.MARKET ? stock.price : limitPrice}
              onChange={(e) => setLimitPrice(Number(e.target.value))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                orderType === OrderType.MARKET ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
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
