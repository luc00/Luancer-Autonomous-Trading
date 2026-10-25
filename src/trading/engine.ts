/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, OpusStrategyConfig, Position, TradeLog } from './types.ts';

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) {
    const sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
  }

  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Analyzes market trend and momentum for Opus 5.5 decision matrix
 */
export function analyzeAssetTrend(asset: Asset) {
  const prices = asset.history.map((h) => h.close);
  if (prices.length < 3) {
    return {
      isUptrend: false,
      momentum: 50,
      emaFast: asset.price,
      emaSlow: asset.price,
      rsi: 50,
      confidence: 50,
    };
  }

  // Dynamically scale EMA periods to available history
  const fastPeriod = Math.max(2, Math.min(5, Math.floor(prices.length * 0.4)));
  const slowPeriod = Math.max(fastPeriod + 1, Math.min(13, prices.length));

  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  const rsi = calculateRSI(prices, Math.min(7, Math.max(2, prices.length - 1)));

  // Short-term rate of change over recent candles
  const lookback = Math.min(3, prices.length - 1);
  const pastPrice = prices[prices.length - 1 - lookback];
  const shortRateOfChange = (asset.price - pastPrice) / pastPrice;

  // Uptrend condition: fast EMA > slow EMA, price >= emaFast or strong shortRateOfChange
  const isUptrend = (emaFast >= emaSlow || asset.price > emaFast) && shortRateOfChange > 0.002;

  // Momentum score 0-100
  let score = 50;
  if (isUptrend) score += 25;
  if (shortRateOfChange > 0.005) score += 15;
  if (shortRateOfChange > 0.01) score += 10;
  if (rsi > 50 && rsi < 80) score += 10;
  if (rsi >= 80) score -= 5;

  return {
    isUptrend,
    momentum: Math.min(99, Math.max(5, Math.round(score))),
    emaFast,
    emaSlow,
    rsi,
    confidence: Math.min(99, Math.max(10, Math.round(score))),
  };
}

/**
 * Evaluates whether Opus 5.5 should buy an asset ("comprare quando sale")
 */
export function evaluateBuySignal(
  asset: Asset,
  availableCash: number,
  existingPositions: Position[],
  config: OpusStrategyConfig,
): { shouldBuy: boolean; reason: string; allocationAmount: number } {
  // Check if position already open for this asset
  const existing = existingPositions.find((p) => p.assetId === asset.id);
  if (existing) {
    return { shouldBuy: false, reason: 'Posizione già attiva su questo asset', allocationAmount: 0 };
  }

  // Reserve check: keep configured cash reserve in account to accrue Trade Republic 3.75% interest
  const minRequiredCash = 50; // Minimum €50 trade size
  const maxAvailableForTrading = availableCash * (1 - config.minReserveCashPercent / 100);

  if (maxAvailableForTrading < minRequiredCash) {
    return {
      shouldBuy: false,
      reason: 'Liquidità riservata per interessi Trade Republic (3.75% p.a.)',
      allocationAmount: 0,
    };
  }

  const analysis = analyzeAssetTrend(asset);

  // Thresholds based on selected strategy mode
  const minMomentum =
    config.mode === 'ZERO_LOSS_DEFENSIVE'
      ? 68
      : config.mode === 'BALANCED_GROWTH'
      ? 60
      : 55;

  if (analysis.isUptrend && analysis.momentum >= minMomentum) {
    // Determine allocation amount: percentage of usable cash
    const targetAllocation = maxAvailableForTrading * (config.maxAllocationPercent / 100);
    const allocationAmount = Math.max(minRequiredCash, Math.min(targetAllocation, maxAvailableForTrading));

    return {
      shouldBuy: true,
      reason: `Opus 5.5 Breakout Rialzista [Momentum ${analysis.momentum}/100, Trend +, RSI: ${Math.round(analysis.rsi)}]`,
      allocationAmount: Math.round(allocationAmount * 100) / 100,
    };
  }

  return {
    shouldBuy: false,
    reason: `In attesa di breakout rialzista (Momentum: ${analysis.momentum}/${minMomentum})`,
    allocationAmount: 0,
  };
}

/**
 * Evaluates whether Opus 5.5 should exit or update trailing stop
 * ("ritirare prima di scendere e perdere")
 */
export function evaluatePositionManagement(
  position: Position,
  currentPrice: number,
  config: OpusStrategyConfig,
): {
  shouldSell: boolean;
  reason: string;
  updatedPosition: Position;
} {
  const updated = { ...position, currentPrice };
  const invested = updated.investedAmount;
  const currentValue = updated.quantity * currentPrice;
  const pnl = currentValue - invested;
  const pnlPercent = (pnl / invested) * 100;

  updated.currentValue = currentValue;
  updated.pnl = pnl;
  updated.pnlPercent = pnlPercent;

  // Update peak price if new high reached
  if (currentPrice > updated.peakPrice) {
    updated.peakPrice = currentPrice;
  }

  // Zero-Loss Defensive Rule: As soon as gain reaches threshold (e.g., +0.4%),
  // ratchet stop-loss above entry price to lock in zero risk of capital loss
  if (pnlPercent >= config.breakEvenThresholdPercent && !updated.breakEvenLocked) {
    updated.breakEvenLocked = true;
    // Guaranteed break-even stop: slight positive offset to cover simulation spread
    updated.stopLossPrice = Math.max(updated.stopLossPrice, updated.buyPrice * 1.001);
  }

  // Trailing stop loss: trails peak price by offset percentage
  const trailingDistance = updated.peakPrice * (config.trailingOffsetPercent / 100);
  const potentialNewStop = updated.peakPrice - trailingDistance;

  // Stop loss only ratchets UP, never down
  if (potentialNewStop > updated.stopLossPrice) {
    updated.stopLossPrice = potentialNewStop;
  }

  // SELL TRIGGER 1: Price fell to or below the trailing stop loss
  if (currentPrice <= updated.stopLossPrice) {
    const isGain = pnl >= 0;
    return {
      shouldSell: true,
      reason: isGain
        ? `Presa di profitto Opus 5.5: Trailing Stop scattato a €${currentPrice.toFixed(2)} (+${pnlPercent.toFixed(2)}%)`
        : `Protezione Capitale Zero-Loss: Stop-Loss preventivo scattato a €${currentPrice.toFixed(2)} (${pnlPercent.toFixed(2)}%)`,
      updatedPosition: updated,
    };
  }

  // SELL TRIGGER 2: Aggressive reversal detection (fast sharp drop from recent peak)
  const dropFromPeakPercent = ((updated.peakPrice - currentPrice) / updated.peakPrice) * 100;
  if (pnlPercent > 1.2 && dropFromPeakPercent >= config.trailingOffsetPercent) {
    return {
      shouldSell: true,
      reason: `Ritirata Rapida Opus 5.5: Inversione rilevata prima del ritracciamento (+${pnlPercent.toFixed(2)}%)`,
      updatedPosition: updated,
    };
  }

  return {
    shouldSell: false,
    reason: `Posizione in Trend [Stop-Loss Dinamico: €${updated.stopLossPrice.toFixed(2)} | PnL: ${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%]`,
    updatedPosition: updated,
  };
}

/**
 * Calculates daily Trade Republic cash interest accrual (e.g. 3.75% p.a.)
 */
export function calculateCashInterest(
  availableCash: number,
  annualRate: number = 0.0375,
  secondsElapsed: number = 1,
): number {
  if (availableCash <= 0) return 0;
  const secondsInYear = 365 * 24 * 3600;
  return (availableCash * annualRate * secondsElapsed) / secondsInYear;
}

/**
 * Simulates real-time price fluctuation with trend drift
 */
export function simulatePriceTick(currentPrice: number, volatility: number, marketBias: number = 0.0002): number {
  // Random walk with slight realistic volatility and micro-trends
  const randomFactor = (Math.random() - 0.485) * volatility;
  const change = currentPrice * (randomFactor + marketBias);
  const newPrice = Math.max(0.1, currentPrice + change);
  return Math.round(newPrice * 100) / 100;
}
