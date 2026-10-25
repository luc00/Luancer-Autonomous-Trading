/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarketSession, UserCard } from './types.ts';

export const GLOBAL_MARKET_SESSIONS: MarketSession[] = [
  {
    id: 'eu_xetra',
    name: 'XETRA Francoforte & Milano',
    region: 'Europa (EUR)',
    timezone: 'CET (UTC+1)',
    isOpen: true,
    openTimeUtc: '08:00',
    closeTimeUtc: '16:30',
    primaryIndex: 'DAX 40',
    indexChange: 0.82,
  },
  {
    id: 'us_nyse',
    name: 'Wall Street (NYSE & NASDAQ)',
    region: 'Stati Uniti (USD)',
    timezone: 'EST (UTC-5)',
    isOpen: true,
    openTimeUtc: '13:30',
    closeTimeUtc: '20:00',
    primaryIndex: 'S&P 500',
    indexChange: 1.15,
  },
  {
    id: 'asia_tse',
    name: 'Tokyo Stock Exchange',
    region: 'Giappone (JPY)',
    timezone: 'JST (UTC+9)',
    isOpen: false,
    openTimeUtc: '00:00',
    closeTimeUtc: '06:00',
    primaryIndex: 'Nikkei 225',
    indexChange: 0.35,
  },
  {
    id: 'crypto_global',
    name: 'Global Crypto Spot 24/7',
    region: 'Decentralizzato Globale',
    timezone: 'UTC 24/7',
    isOpen: true,
    openTimeUtc: '00:00',
    closeTimeUtc: '24:00',
    primaryIndex: 'BTC / ETH Dominance',
    indexChange: 3.42,
  },
];

/**
 * Validates the 4-digit PIN for protected zone access
 */
export function validateAccessPin(enteredPin: string, correctPin: string = '2026'): boolean {
  return enteredPin === correctPin;
}

/**
 * Calculates 1% Trade Republic Saveback on card purchases and rounds up spare change
 */
export function calculateCardSaveback(
  purchaseAmount: number,
  card: UserCard,
): { savebackReward: number; roundUpAmount: number; totalInvested: number } {
  if (!card.isActive || purchaseAmount <= 0) {
    return { savebackReward: 0, roundUpAmount: 0, totalInvested: 0 };
  }

  // 1% standard Saveback reward (Trade Republic benefit)
  const savebackReward = Math.round(purchaseAmount * (card.savebackPercent / 100) * 100) / 100;

  // Round up: round up to nearest euro and invest difference
  let roundUpAmount = 0;
  if (card.roundUpActive) {
    const nextWhole = Math.ceil(purchaseAmount);
    roundUpAmount = Math.round((nextWhole - purchaseAmount) * 100) / 100;
  }

  const totalInvested = Math.round((savebackReward + roundUpAmount) * 100) / 100;

  return {
    savebackReward,
    roundUpAmount,
    totalInvested,
  };
}

/**
 * Checks if a market session is open based on given UTC hour
 */
export function isMarketSessionActive(session: MarketSession, currentUtcHour: number): boolean {
  if (session.id === 'crypto_global') return true;

  const [openH] = session.openTimeUtc.split(':').map(Number);
  const [closeH] = session.closeTimeUtc.split(':').map(Number);

  if (openH <= closeH) {
    return currentUtcHour >= openH && currentUtcHour < closeH;
  } else {
    // Over midnight session (e.g. Asia)
    return currentUtcHour >= openH || currentUtcHour < closeH;
  }
}
