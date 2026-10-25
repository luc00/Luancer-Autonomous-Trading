/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AssetCategory = 'STOCKS' | 'CRYPTO' | 'ETF';

export interface PricePoint {
  time: number;
  price: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  previousClose: number;
  change24h: number;
  changePercent24h: number;
  history: PricePoint[];
  volatility: number;
  momentumScore: number;
  isUptrend: boolean;
}

export interface Position {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  buyPrice: number;
  currentPrice: number;
  quantity: number;
  investedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  peakPrice: number;
  stopLossPrice: number;
  breakEvenLocked: boolean;
  openedAt: number;
}

export interface TradeLog {
  id: string;
  timestamp: number;
  type: 'BUY' | 'SELL';
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  totalAmount: number;
  pnl?: number;
  pnlPercent?: number;
  reason: string;
}

export type StrategyMode = 'ZERO_LOSS_DEFENSIVE' | 'BALANCED_GROWTH' | 'AGGRESSIVE_MOMENTUM';

export interface UserCard {
  id: string;
  cardholderName: string;
  cardType: 'MIRROR' | 'CLASSIC' | 'VIRTUAL';
  cardNetwork?: 'VISA' | 'MASTERCARD' | 'AMEX';
  last4: string;
  expiry: string;
  isActive: boolean;
  savebackPercent: number; // 1%
  savebackAssetSymbol: string; // e.g. NVDA or Core MSCI World
  roundUpActive: boolean;
  dailySpendingLimit: number;
  monthlyLimit: number;
  totalSavebackEarned: number;
}

export interface MarketSession {
  id: string;
  name: string;
  region: string;
  timezone: string;
  isOpen: boolean;
  openTimeUtc: string;
  closeTimeUtc: string;
  primaryIndex: string;
  indexChange: number;
}

export interface OpusStrategyConfig {
  autoPilot: boolean;
  mode: StrategyMode;
  maxAllocationPercent: number; // e.g., 20% of available cash per trade
  breakEvenThresholdPercent: number; // profit at which stop ratchets to entry + fees (e.g. +0.5%)
  trailingOffsetPercent: number; // distance behind peak price (e.g. 0.8%)
  minReserveCashPercent: number; // reserve cash untouched to earn Trade Republic interest (e.g. 20%)
  trendLookback: number;
  executionSpeedMs: number;
  globalMarketSync: boolean;
  realMoneyMode: boolean; // Real market data & account integration mode
}

export interface Portfolio {
  initialCash: number;
  availableCash: number;
  investedValue: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  interestRateAnnual: number; // 3.75%
  accumulatedInterest: number;
  totalTrades: number;
  winningTrades: number;
  positions: Position[];
  tradeHistory: TradeLog[];
  userCard: UserCard;
}
