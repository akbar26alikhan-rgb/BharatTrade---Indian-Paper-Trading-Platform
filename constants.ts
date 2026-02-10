
import { Instrument } from './types';

export const INITIAL_STOCKS: Instrument[] = [
  { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2942.50, change: 12.45, changePercent: 0.42, exchange: 'NSE' },
  { id: '2', symbol: 'TCS', name: 'Tata Consultancy Services', price: 4125.80, change: -45.20, changePercent: -1.08, exchange: 'NSE' },
  { id: '3', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1642.15, change: 5.30, changePercent: 0.32, exchange: 'NSE' },
  { id: '4', symbol: 'INFY', name: 'Infosys Ltd.', price: 1622.40, change: -12.10, changePercent: -0.74, exchange: 'NSE' },
  { id: '5', symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1088.65, change: 18.25, changePercent: 1.70, exchange: 'NSE' },
  { id: '6', symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', price: 1215.30, change: 2.10, changePercent: 0.17, exchange: 'NSE' },
  { id: '7', symbol: 'SBIN', name: 'State Bank of India', price: 765.40, change: -4.20, changePercent: -0.55, exchange: 'NSE' },
  { id: '8', symbol: 'ITC', name: 'ITC Ltd.', price: 432.10, change: 1.05, changePercent: 0.24, exchange: 'NSE' },
  { id: '9', symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', price: 2388.50, change: -8.75, changePercent: -0.37, exchange: 'NSE' },
  { id: '10', symbol: 'LICI', name: 'LIC of India', price: 945.20, change: 15.60, changePercent: 1.68, exchange: 'NSE' }
];

export const INITIAL_BALANCE = 1000000; // 10 Lakh INR

export const INDICES = [
  { name: 'NIFTY 50', value: 23465.60, change: 112.30, percent: 0.48 },
  { name: 'SENSEX', value: 77209.90, change: 350.25, percent: 0.46 },
  { name: 'BANKNIFTY', value: 50435.15, change: -120.40, percent: -0.24 }
];
