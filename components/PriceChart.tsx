
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Instrument } from '../types';

interface PriceChartProps {
  stock: Instrument;
}

const PriceChart: React.FC<PriceChartProps> = ({ stock }) => {
  // Generate mock historical data
  const data = Array.from({ length: 30 }).map((_, i) => {
    const base = stock.price;
    const offset = (Math.random() - 0.5) * (base * 0.05);
    return {
      time: i,
      price: base + offset,
    };
  });

  const isPositive = stock.change >= 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{stock.symbol}</h2>
          <p className="text-sm text-slate-500">{stock.name}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-800">₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className={`font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full bg-white rounded-xl">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" hide />
            <YAxis 
              domain={['auto', 'auto']} 
              orientation="right" 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              labelStyle={{ display: 'none' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isPositive ? '#10b981' : '#f43f5e'} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-4 text-xs font-bold text-slate-400">
        <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md">1D</button>
        <button className="px-3 py-1 hover:text-slate-600">5D</button>
        <button className="px-3 py-1 hover:text-slate-600">1M</button>
        <button className="px-3 py-1 hover:text-slate-600">6M</button>
        <button className="px-3 py-1 hover:text-slate-600">1Y</button>
      </div>
    </div>
  );
};

export default PriceChart;
