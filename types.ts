
export enum OrderStatus {
  PENDING = 'PENDING',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT'
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum ProductType {
  CNC = 'CNC', // Delivery
  MIS = 'MIS'  // Intraday
}

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  exchange: 'NSE' | 'BSE';
}

export interface Order {
  id: string;
  instrumentId: string;
  symbol: string;
  orderType: OrderType;
  productType: ProductType;
  transactionType: TransactionType;
  quantity: number;
  price: number; // Limit price or execution price
  status: OrderStatus;
  timestamp: number;
}

export interface Position {
  instrumentId: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  realizedPnl: number;
}

export interface Wallet {
  balance: number;
  initialBalance: number;
}

export interface AppState {
  wallet: Wallet;
  watchlist: Instrument[];
  orders: Order[];
  positions: Position[];
  holdings: Position[];
}
