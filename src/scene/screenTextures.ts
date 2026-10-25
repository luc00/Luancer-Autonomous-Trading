/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Asset, Portfolio, OpusStrategyConfig } from '../trading/types.ts';

export class ScreenTextureManager {
  public chartCanvas: HTMLCanvasElement;
  public chartCtx: CanvasRenderingContext2D;
  public chartTexture: THREE.CanvasTexture;

  public opusCanvas: HTMLCanvasElement;
  public opusCtx: CanvasRenderingContext2D;
  public opusTexture: THREE.CanvasTexture;

  public portfolioCanvas: HTMLCanvasElement;
  public portfolioCtx: CanvasRenderingContext2D;
  public portfolioTexture: THREE.CanvasTexture;

  constructor() {
    // 1. Center Monitor: Live Candlestick & Price Action Chart (1024x512)
    this.chartCanvas = document.createElement('canvas');
    this.chartCanvas.width = 1024;
    this.chartCanvas.height = 512;
    this.chartCtx = this.chartCanvas.getContext('2d')!;
    this.chartTexture = new THREE.CanvasTexture(this.chartCanvas);
    this.chartTexture.colorSpace = THREE.SRGBColorSpace;
    this.chartTexture.generateMipmaps = true;

    // 2. Left Monitor: Opus 5.5 Neural Strategy Matrix (680x540)
    this.opusCanvas = document.createElement('canvas');
    this.opusCanvas.width = 680;
    this.opusCanvas.height = 540;
    this.opusCtx = this.opusCanvas.getContext('2d')!;
    this.opusTexture = new THREE.CanvasTexture(this.opusCanvas);
    this.opusTexture.colorSpace = THREE.SRGBColorSpace;
    this.opusTexture.generateMipmaps = true;

    // 3. Right Monitor: Trade Republic Portfolio & Order Tape (680x540)
    this.portfolioCanvas = document.createElement('canvas');
    this.portfolioCanvas.width = 680;
    this.portfolioCanvas.height = 540;
    this.portfolioCtx = this.portfolioCanvas.getContext('2d')!;
    this.portfolioTexture = new THREE.CanvasTexture(this.portfolioCanvas);
    this.portfolioTexture.colorSpace = THREE.SRGBColorSpace;
    this.portfolioTexture.generateMipmaps = true;
  }

  public updateChartScreen(asset: Asset, activeSignal: string) {
    const ctx = this.chartCtx;
    const w = this.chartCanvas.width;
    const h = this.chartCanvas.height;

    // Background: Deep dark fintech slate
    ctx.fillStyle = '#08090C';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#181C24';
    ctx.lineWidth = 1;
    for (let x = 60; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, h - 40);
      ctx.stroke();
    }
    for (let y = 60; y < h - 40; y += 60) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 40, y);
      ctx.stroke();
    }

    // Header bar
    ctx.fillStyle = '#10141D';
    ctx.fillRect(0, 0, w, 44);

    // Trade Republic & Asset Header
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`TRADE REPUBLIC  |  ${asset.symbol}  •  ${asset.name.toUpperCase()}`, 20, 28);

    const isPositive = asset.changePercent24h >= 0;
    const accentColor = isPositive ? '#00D09C' : '#FF4560';

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`€${asset.price.toFixed(2)}`, w - 280, 29);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = accentColor;
    ctx.fillText(`${isPositive ? '+' : ''}${asset.changePercent24h.toFixed(2)}%`, w - 130, 28);

    // Draw Candlesticks
    const candles = asset.history;
    if (candles.length > 0) {
      const minPrice = Math.min(...candles.map((c) => c.low)) * 0.998;
      const maxPrice = Math.max(...candles.map((c) => c.high)) * 1.002;
      const range = Math.max(0.01, maxPrice - minPrice);

      const chartLeft = 50;
      const chartRight = w - 60;
      const chartTop = 70;
      const chartBottom = h - 60;
      const chartHeight = chartBottom - chartTop;
      const candleWidth = Math.max(12, (chartRight - chartLeft) / (candles.length * 2.2));

      candles.forEach((candle, idx) => {
        const x = chartLeft + idx * (candleWidth * 2.1) + candleWidth;
        const openY = chartBottom - ((candle.open - minPrice) / range) * chartHeight;
        const closeY = chartBottom - ((candle.close - minPrice) / range) * chartHeight;
        const highY = chartBottom - ((candle.high - minPrice) / range) * chartHeight;
        const lowY = chartBottom - ((candle.low - minPrice) / range) * chartHeight;

        const isGreen = candle.close >= candle.open;
        const color = isGreen ? '#00D09C' : '#FF4560';

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        ctx.fillStyle = color;
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(3, Math.abs(closeY - openY));
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      });

      // Price indicator line
      const currentY = chartBottom - ((asset.price - minPrice) / range) * chartHeight;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(chartLeft, currentY);
      ctx.lineTo(chartRight, currentY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Footer Status Bar
    ctx.fillStyle = '#10141D';
    ctx.fillRect(0, h - 42, w, 42);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#00D09C';
    ctx.fillText(`● OPUS 5.5 STATUS: ${activeSignal.slice(0, 95)}`, 20, h - 16);

    ctx.fillStyle = '#7E8B9B';
    ctx.fillText(`ZERO-LOSS TRAILING ACTIVE  |  3.75% P.A. YIELD`, w - 380, h - 16);

    this.chartTexture.needsUpdate = true;
  }

  public updateOpusScreen(config: OpusStrategyConfig, latestDecision: string, winRate: number) {
    const ctx = this.opusCtx;
    const w = this.opusCanvas.width;
    const h = this.opusCanvas.height;

    ctx.fillStyle = '#090B10';
    ctx.fillRect(0, 0, w, h);

    // Decorative matrix header
    ctx.fillStyle = '#121722';
    ctx.fillRect(0, 0, w, 40);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#00D09C';
    ctx.fillText('OPUS 5.5 // NEURAL TRADING CORE', 18, 26);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#8290A2';
    ctx.fillText(`WIN RATE: ${(winRate * 100).toFixed(0)}%`, w - 120, 26);

    // Strategy Mode Card
    ctx.fillStyle = '#141A26';
    ctx.fillRect(20, 55, w - 40, 75);
    ctx.strokeStyle = '#00D09C44';
    ctx.strokeRect(20, 55, w - 40, 75);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#7E8B9B';
    ctx.fillText('STRATEGY ALGORITHM', 34, 75);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(config.mode.replace(/_/g, ' '), 34, 98);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#00D09C';
    ctx.fillText(`STOP OFFSET: ${config.trailingOffsetPercent}% | CASH BUFFER: ${config.minReserveCashPercent}%`, 34, 118);

    // Neural Weights / Momentum visualization
    ctx.fillStyle = '#141A26';
    ctx.fillRect(20, 145, w - 40, 160);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#7E8B9B';
    ctx.fillText('AI DECISION MATRIX & RISK PROTECTION', 34, 168);

    const metrics = [
      { name: 'TREND MOMENTUM (EMA9/21)', val: 86, color: '#00D09C' },
      { name: 'BREAK-EVEN RATCHET GUARD', val: 98, color: '#38BDF8' },
      { name: 'TRAILING VOLATILITY EXIT', val: 92, color: '#A78BFA' },
      { name: 'CAPITAL PRESERVATION BUFFER', val: 99, color: '#34D399' },
    ];

    metrics.forEach((m, idx) => {
      const y = 195 + idx * 26;
      ctx.font = '10px monospace';
      ctx.fillStyle = '#CCCCCC';
      ctx.fillText(m.name, 34, y);

      // Bar track
      ctx.fillStyle = '#222838';
      ctx.fillRect(220, y - 9, 210, 8);

      // Fill bar
      ctx.fillStyle = m.color;
      ctx.fillRect(220, y - 9, (210 * m.val) / 100, 8);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${m.val}%`, 440, y);
    });

    // Execution Terminal Log
    ctx.fillStyle = '#0D1118';
    ctx.fillRect(20, 320, w - 40, 170);
    ctx.strokeStyle = '#1F2636';
    ctx.strokeRect(20, 320, w - 40, 170);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#5A677A';
    ctx.fillText('// LIVE AUTONOMOUS EXECUTION LOG', 32, 340);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#00D09C';
    ctx.fillText(`> ${latestDecision.slice(0, 48)}`, 32, 365);
    ctx.fillStyle = '#A0AEC0';
    ctx.fillText(`> [SCAN] Scanning 8 Trade Republic instruments...`, 32, 390);
    ctx.fillText(`> [GUARD] Zero-Loss ratchet active on all fills`, 32, 415);
    ctx.fillText(`> [YIELD] Cash reserve compounding @ 3.75% p.a.`, 32, 440);

    ctx.fillStyle = config.autoPilot ? '#00D09C' : '#F59E0B';
    ctx.fillText(config.autoPilot ? '● AUTONOMOUS ENGINE RUNNING' : '❚❚ AUTONOMOUS PAUSED', 32, 472);

    this.opusTexture.needsUpdate = true;
  }

  public updatePortfolioScreen(portfolio: Portfolio) {
    const ctx = this.portfolioCtx;
    const w = this.portfolioCanvas.width;
    const h = this.portfolioCanvas.height;

    ctx.fillStyle = '#080A0E';
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = '#10141D';
    ctx.fillRect(0, 0, w, 40);

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('TRADE REPUBLIC // PORTAFOGLIO', 18, 25);

    // Total Portfolio Card
    ctx.fillStyle = '#121722';
    ctx.fillRect(20, 52, w - 40, 95);
    ctx.strokeStyle = '#222938';
    ctx.strokeRect(20, 52, w - 40, 95);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#7E8B9B';
    ctx.fillText('VALORE TOTALE PORTAFOGLIO', 34, 72);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`€${portfolio.totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 34, 102);

    const isPositive = portfolio.totalPnl >= 0;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = isPositive ? '#00D09C' : '#FF4560';
    ctx.fillText(`${isPositive ? '+' : ''}€${portfolio.totalPnl.toFixed(2)} (${isPositive ? '+' : ''}${portfolio.totalPnlPercent.toFixed(2)}%)`, 34, 130);

    // Cash & Interest Row
    ctx.fillStyle = '#121722';
    ctx.fillRect(20, 160, (w - 50) / 2, 75);
    ctx.fillRect(25 + (w - 50) / 2, 160, (w - 50) / 2, 75);

    // Cash Card
    ctx.font = '10px monospace';
    ctx.fillStyle = '#7E8B9B';
    ctx.fillText('LIQUIDITÀ DISPONIBILE', 32, 178);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`€${portfolio.availableCash.toFixed(2)}`, 32, 202);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#00D09C';
    ctx.fillText('INTERESSE: 3.75% P.A.', 32, 222);

    // Interest Earned Card
    const rightCol = 35 + (w - 50) / 2;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#7E8B9B';
    ctx.fillText('INTERESSI GENERATI', rightCol, 178);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#00D09C';
    ctx.fillText(`+€${portfolio.accumulatedInterest.toFixed(2)}`, rightCol, 202);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#7E8B9B';
    ctx.fillText('MERCATI MONDIALI: SYNC', rightCol, 222);

    // Trade Republic Card Visual Display on Monitor
    const card = portfolio.userCard;
    const cardY = 248;
    const cardH = 150;
    const isMirror = card.cardType === 'MIRROR';

    // Card background
    ctx.fillStyle = isMirror ? '#1C2230' : '#0B0D12';
    ctx.fillRect(20, cardY, w - 40, cardH);
    ctx.strokeStyle = isMirror ? '#475569' : '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, cardY, w - 40, cardH);

    // Card Header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('TRADE REPUBLIC', 36, cardY + 28);

    ctx.font = '10px monospace';
    ctx.fillStyle = isMirror ? '#00D09C' : '#94A3B8';
    ctx.fillText(`${card.cardType} CARD • VISA`, w - 170, cardY + 28);

    // Chip & Wave
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(36, cardY + 44, 32, 22);
    ctx.fillStyle = '#00000033';
    ctx.fillRect(48, cardY + 44, 2, 22);

    // Card Number Mask
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(`•••• •••• •••• ${card.last4}`, 36, cardY + 95);

    // Cardholder & Saveback
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(card.cardholderName, 36, cardY + 124);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#00D09C';
    ctx.fillText(`1% SAVEBACK (${card.savebackAssetSymbol}) | LIMITE: €${card.dailySpendingLimit}`, 36, cardY + 140);

    // Global Market Status Strip at Bottom
    ctx.fillStyle = '#0D111A';
    ctx.fillRect(20, 412, w - 40, 110);
    ctx.strokeStyle = '#20283A';
    ctx.strokeRect(20, 412, w - 40, 110);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#7E8B9B';
    ctx.fillText('SINCRONIZZAZIONE MERCATI MONDIALI', 32, 432);

    const markets = [
      { name: 'XETRA (EUR)', status: 'APERTO', chg: '+0.8%' },
      { name: 'WALL ST (USD)', status: 'APERTO', chg: '+1.2%' },
      { name: 'CRYPTO 24/7', status: 'ATTIVO', chg: '+3.4%' },
    ];

    markets.forEach((m, idx) => {
      const my = 458 + idx * 24;
      ctx.font = '10px monospace';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText(m.name, 32, my);

      ctx.fillStyle = '#00D09C';
      ctx.fillText(`● ${m.status}`, 240, my);

      ctx.fillStyle = '#00D09C';
      ctx.fillText(m.chg, w - 120, my);
    });

    this.portfolioTexture.needsUpdate = true;
  }

  public dispose() {
    this.chartTexture.dispose();
    this.opusTexture.dispose();
    this.portfolioTexture.dispose();
  }
}
