
import { Instrument } from './types';

export const INITIAL_STOCKS: Instrument[] = [
  { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 1268.45, change: 4.20, changePercent: 0.33, exchange: 'NSE' },
  { id: '2', symbol: 'TCS', name: 'Tata Consultancy Services', price: 3942.80, change: -12.20, changePercent: -0.31, exchange: 'NSE' },
  { id: 'bse-sensex', symbol: 'SENSEX', name: 'S&P BSE SENSEX', price: 77209.90, change: 350.25, changePercent: 0.46, exchange: 'BSE' },
  { id: '3', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1728.15, change: 8.30, changePercent: 0.48, exchange: 'NSE' },
  { id: '4', symbol: 'INFY', name: 'Infosys Ltd.', price: 1882.40, change: -5.10, changePercent: -0.27, exchange: 'NSE' },
  { id: '5', symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1242.65, change: 12.25, changePercent: 1.00, exchange: 'NSE' },
  { id: 'bse-reliance', symbol: 'RELIANCE', name: 'Reliance (BSE)', price: 1268.60, change: 4.35, changePercent: 0.34, exchange: 'BSE' },
  { id: '7', symbol: 'SBIN', name: 'State Bank of India', price: 782.40, change: -2.20, changePercent: -0.28, exchange: 'NSE' },
  { id: 'bse-sbi', symbol: 'SBIN', name: 'SBI (BSE)', price: 782.55, change: -2.10, changePercent: -0.27, exchange: 'BSE' },
  { id: '8', symbol: 'ITC', name: 'ITC Ltd.', price: 492.10, change: 2.05, changePercent: 0.42, exchange: 'NSE' },
  { id: 'bse-itc', symbol: 'ITC', name: 'ITC (BSE)', price: 492.25, change: 2.15, changePercent: 0.44, exchange: 'BSE' },
  { id: '10', symbol: 'LICI', name: 'LIC of India', price: 1045.20, change: 5.60, changePercent: 0.54, exchange: 'NSE' }
];

export const INITIAL_BALANCE = 1000000; // 10 Lakh INR

export const INDICES = [
  { name: 'NIFTY 50', value: 23465.60, change: 112.30, percent: 0.48 },
  { name: 'SENSEX', value: 77209.90, change: 350.25, percent: 0.46 },
  { name: 'BANKNIFTY', value: 50435.15, change: -120.40, percent: -0.24 }
];
