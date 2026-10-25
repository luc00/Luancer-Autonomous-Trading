/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEMA,
  calculateRSI,
  analyzeAssetTrend,
  evaluateBuySignal,
  evaluatePositionManagement,
  calculateCashInterest,
} from './engine.ts';
import { Asset, OpusStrategyConfig, Position } from './types.ts';

test('calculateEMA computes expected average for series', () => {
  const prices = [100, 102, 104, 106, 108];
  const ema = calculateEMA(prices, 3);
  assert.ok(ema > 103 && ema < 108, `EMA was ${ema}`);
});

test('calculateRSI reflects high RSI for strongly increasing series', () => {
  const prices = [100, 102, 105, 108, 112, 116, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165];
  const rsi = calculateRSI(prices, 7);
  assert.ok(rsi > 70, `RSI was ${rsi}, expected > 70`);
});

test('analyzeAssetTrend detects uptrend when price and short EMA rise', () => {
  const asset: Asset = {
    id: 'nvda',
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    category: 'STOCKS',
    price: 135,
    previousClose: 130,
    change24h: 5,
    changePercent24h: 3.84,
    volatility: 0.015,
    momentumScore: 80,
    isUptrend: true,
    history: [
      { time: 1, open: 125, high: 126, low: 124, close: 125, price: 125, volume: 1000 },
      { time: 2, open: 126, high: 128, low: 125, close: 127, price: 127, volume: 1000 },
      { time: 3, open: 127, high: 130, low: 126, close: 129, price: 129, volume: 1000 },
      { time: 4, open: 129, high: 133, low: 128, close: 132, price: 132, volume: 1000 },
      { time: 5, open: 132, high: 136, low: 131, close: 135, price: 135, volume: 1000 },
    ],
  };

  const trend = analyzeAssetTrend(asset);
  assert.equal(trend.isUptrend, true);
  assert.ok(trend.momentum >= 65);
});

test('evaluateBuySignal triggers buy when trend is bullish and cash is available', () => {
  const asset: Asset = {
    id: 'asml',
    symbol: 'ASML',
    name: 'ASML Holding',
    category: 'STOCKS',
    price: 750,
    previousClose: 730,
    change24h: 20,
    changePercent24h: 2.7,
    volatility: 0.01,
    momentumScore: 78,
    isUptrend: true,
    history: [
      { time: 1, open: 710, high: 715, low: 708, close: 712, price: 712, volume: 500 },
      { time: 2, open: 712, high: 725, low: 710, close: 720, price: 720, volume: 500 },
      { time: 3, open: 720, high: 732, low: 718, close: 728, price: 728, volume: 500 },
      { time: 4, open: 728, high: 742, low: 725, close: 738, price: 738, volume: 500 },
      { time: 5, open: 738, high: 755, low: 735, close: 750, price: 750, volume: 500 },
    ],
  };

  const config: OpusStrategyConfig = {
    autoPilot: true,
    mode: 'ZERO_LOSS_DEFENSIVE',
    maxAllocationPercent: 20,
    breakEvenThresholdPercent: 0.5,
    trailingOffsetPercent: 0.8,
    minReserveCashPercent: 20,
    trendLookback: 10,
    executionSpeedMs: 1500,
    globalMarketSync: true,
    realMoneyMode: true,
  };

  const signal = evaluateBuySignal(asset, 5000, [], config);
  assert.equal(signal.shouldBuy, true);
  assert.ok(signal.allocationAmount > 0);
});

test('evaluatePositionManagement ratchets stop-loss above entry price to lock in zero risk', () => {
  const initialPosition: Position = {
    id: 'pos-1',
    assetId: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'CRYPTO',
    buyPrice: 65000,
    currentPrice: 65000,
    quantity: 0.1,
    investedAmount: 6500,
    currentValue: 6500,
    pnl: 0,
    pnlPercent: 0,
    peakPrice: 65000,
    stopLossPrice: 64500,
    breakEvenLocked: false,
    openedAt: Date.now(),
  };

  const config: OpusStrategyConfig = {
    autoPilot: true,
    mode: 'ZERO_LOSS_DEFENSIVE',
    maxAllocationPercent: 20,
    breakEvenThresholdPercent: 0.5,
    trailingOffsetPercent: 0.8,
    minReserveCashPercent: 20,
    trendLookback: 10,
    executionSpeedMs: 1500,
    globalMarketSync: true,
    realMoneyMode: true,
  };

  // Price rises by 2% to 66300
  const step1 = evaluatePositionManagement(initialPosition, 66300, config);
  assert.equal(step1.shouldSell, false);
  assert.equal(step1.updatedPosition.breakEvenLocked, true);
  assert.ok(step1.updatedPosition.stopLossPrice >= 65000, 'Stop loss must ratchet above entry');

  // Price peaks at 68000
  const step2 = evaluatePositionManagement(step1.updatedPosition, 68000, config);
  assert.equal(step2.shouldSell, false);
  const trailingExpected = 68000 * (1 - 0.008);
  assert.ok(step2.updatedPosition.stopLossPrice >= trailingExpected - 1);

  // Price drops below trailing stop
  const step3 = evaluatePositionManagement(step2.updatedPosition, 67000, config);
  assert.equal(step3.shouldSell, true);
  assert.ok(step3.updatedPosition.pnl > 0, 'Must exit with locked-in profit');
});

test('calculateCashInterest generates Trade Republic daily yield accurately', () => {
  const cash = 10000;
  const annualRate = 0.0375; // 3.75%
  // 1 full year in seconds
  const oneYearSeconds = 365 * 24 * 3600;
  const annualEarned = calculateCashInterest(cash, annualRate, oneYearSeconds);
  assert.ok(Math.abs(annualEarned - 375) < 0.01, `Annual earned was ${annualEarned}, expected 375`);
});

test('validateAccessPin validates default demo PIN correctly', async () => {
  const { validateAccessPin } = await import('./marketSync.ts');
  assert.equal(validateAccessPin('2026', '2026'), true);
  assert.equal(validateAccessPin('0000', '2026'), false);
});

test('calculateCardSaveback computes 1% reward and round up correctly', async () => {
  const { calculateCardSaveback } = await import('./marketSync.ts');
  const card = {
    id: 'test-card',
    cardholderName: 'LUCAS QUIXADA',
    cardType: 'MIRROR' as const,
    last4: '4092',
    expiry: '09/29',
    isActive: true,
    savebackPercent: 1.0,
    savebackAssetSymbol: 'NVDA',
    roundUpActive: true,
    dailySpendingLimit: 2500,
    monthlyLimit: 10000,
    totalSavebackEarned: 0,
  };

  const res = calculateCardSaveback(14.20, card);
  // 1% of 14.20 is 0.14
  assert.equal(res.savebackReward, 0.14);
  // Round up from 14.20 to 15.00 is 0.80
  assert.equal(res.roundUpAmount, 0.80);
  assert.equal(res.totalInvested, 0.94);
});

test('isMarketSessionActive identifies 24/7 crypto and hour intervals', async () => {
  const { isMarketSessionActive, GLOBAL_MARKET_SESSIONS } = await import('./marketSync.ts');
  const cryptoSession = GLOBAL_MARKET_SESSIONS.find((s) => s.id === 'crypto_global')!;
  assert.equal(isMarketSessionActive(cryptoSession, 3), true);
  assert.equal(isMarketSessionActive(cryptoSession, 15), true);
});

