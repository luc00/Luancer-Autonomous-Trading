/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sliders,
  Briefcase,
  CreditCard,
  Camera,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  LockKeyhole,
  Globe2,
} from 'lucide-react';
import { Asset, Portfolio, OpusStrategyConfig, StrategyMode, Position } from '../trading/types.ts';
import { CameraPreset } from './VirtualOfficeView.tsx';

interface ControlDockProps {
  assets: Asset[];
  activeAsset: Asset;
  onSelectAsset: (asset: Asset) => void;
  portfolio: Portfolio;
  strategyConfig: OpusStrategyConfig;
  onUpdateStrategy: (updated: Partial<OpusStrategyConfig>) => void;
  latestDecision: string;
  onManualClosePosition: (positionId: string) => void;
  onManualBuyAsset: (asset: Asset) => void;
  onOpenCardModal: () => void;
  onSimulateCardSpend: (amount: number) => void;
  cameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type DockTab = 'OPUS_AI' | 'PORTFOLIO' | 'CARD_YIELD' | 'OFFICE_3D';

export const ControlDock: React.FC<ControlDockProps> = ({
  assets,
  activeAsset,
  onSelectAsset,
  portfolio,
  strategyConfig,
  onUpdateStrategy,
  latestDecision,
  onManualClosePosition,
  onManualBuyAsset,
  onOpenCardModal,
  onSimulateCardSpend,
  cameraPreset,
  onSelectCameraPreset,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('OPUS_AI');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'STOCKS' | 'CRYPTO' | 'ETF'>('ALL');

  const filteredAssets = assets.filter((a) => {
    if (assetFilter === 'ALL') return true;
    return a.category === assetFilter;
  });

  const isCardConfigured = portfolio.userCard.isActive && portfolio.userCard.cardholderName !== 'TUO NOME';

  return (
    <div
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 w-[95vw] max-w-[1020px] z-30 transition-all duration-300 pointer-events-auto ${
        isCollapsed ? 'translate-y-[calc(100%-42px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center -mb-[1px]">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-t-xl bg-white hover:bg-gray-50 text-gray-700 hover:text-black border-t border-x border-gray-200 text-xs font-medium shadow-md transition-colors"
          aria-label={isCollapsed ? 'Espandi pannello di controllo' : 'Riduci pannello di controllo'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Espandi Trading Desk</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Riduci Pannello (Vista 3D)</span>
            </>
          )}
        </button>
      </div>

      {/* Main White Minimalist Dock Container */}
      <div className="bg-white/95 border border-gray-200 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl text-gray-900">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 px-3 pt-2 bg-gray-50/80 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('OPUS_AI')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'OPUS_AI'
                  ? 'bg-white text-gray-900 border-b-2 border-black shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Opus 5.5 Auto-Trader</span>
            </button>

            <button
              onClick={() => setActiveTab('PORTFOLIO')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'PORTFOLIO'
                  ? 'bg-white text-gray-900 border-b-2 border-black shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="w-4 h-4 text-sky-600" />
              <span>Portafoglio & Ordini ({portfolio.positions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CARD_YIELD')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'CARD_YIELD'
                  ? 'bg-white text-gray-900 border-b-2 border-black shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Carta Personale & Interessi</span>
            </button>

            <button
              onClick={() => setActiveTab('OFFICE_3D')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'OFFICE_3D'
                  ? 'bg-white text-gray-900 border-b-2 border-black shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Ufficio 3D & Cam</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-500 font-mono pr-2">
            <span className="text-emerald-600 font-medium">● SYNC MONDIALE</span>
            <span>•</span>
            <span>WIN RATE: {((portfolio.winningTrades / Math.max(1, portfolio.totalTrades)) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 max-h-[290px] overflow-y-auto">
          {/* TAB 1: OPUS 5.5 STRATEGY */}
          {activeTab === 'OPUS_AI' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
              {/* Left Column: Strategy Modes & Protection */}
              <div className="md:col-span-7 space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">
                    Modalità Algoritmo Opus 5.5
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onUpdateStrategy({ mode: 'ZERO_LOSS_DEFENSIVE', breakEvenThresholdPercent: 0.4, trailingOffsetPercent: 0.7 })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        strategyConfig.mode === 'ZERO_LOSS_DEFENSIVE'
                          ? 'bg-emerald-50 border-emerald-500 text-gray-900 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center gap-1 text-emerald-700">
                        <Shield className="w-3.5 h-3.5" />
                        Zero-Loss
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Break-even lock al +0.4%
                      </div>
                    </button>

                    <button
                      onClick={() => onUpdateStrategy({ mode: 'BALANCED_GROWTH', breakEvenThresholdPercent: 0.8, trailingOffsetPercent: 1.0 })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        strategyConfig.mode === 'BALANCED_GROWTH'
                          ? 'bg-sky-50 border-sky-500 text-gray-900 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center gap-1 text-sky-700">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Bilanciato
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Trailing Stop 1.0%
                      </div>
                    </button>

                    <button
                      onClick={() => onUpdateStrategy({ mode: 'AGGRESSIVE_MOMENTUM', breakEvenThresholdPercent: 1.2, trailingOffsetPercent: 1.4 })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        strategyConfig.mode === 'AGGRESSIVE_MOMENTUM'
                          ? 'bg-purple-50 border-purple-500 text-gray-900 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center gap-1 text-purple-700">
                        <Sparkles className="w-3.5 h-3.5" />
                        Aggressivo
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Trailing Stop 1.4%
                      </div>
                    </button>
                  </div>
                </div>

                {/* Fine Tuning Sliders */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-700 mb-1 font-medium">
                      <span>Sensibilità Trailing Stop</span>
                      <span className="font-mono text-emerald-600 font-bold">{strategyConfig.trailingOffsetPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.0"
                      step="0.1"
                      value={strategyConfig.trailingOffsetPercent}
                      onChange={(e) => onUpdateStrategy({ trailingOffsetPercent: parseFloat(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      Vende immediatamente se il prezzo ritraccia di questa % dal massimo.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-gray-700 mb-1 font-medium">
                      <span>Max Allocazione / Trade</span>
                      <span className="font-mono text-emerald-600 font-bold">{strategyConfig.maxAllocationPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={strategyConfig.maxAllocationPercent}
                      onChange={(e) => onUpdateStrategy({ maxAllocationPercent: parseInt(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      Frazione della liquidità disponibile impegnata per ogni operazione.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Decision Log & Active Status */}
              <div className="md:col-span-5 flex flex-col justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">
                      Decision Feed Autonomo
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-medium">
                      ACTIVE AI
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200 font-mono text-[11px] leading-relaxed text-gray-800 shadow-2xs">
                    <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      {latestDecision}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-1.5">
                      • Regola Zero-Loss: Stop-loss ratcheted sopra l'ingresso al +0.4%.
                    </p>
                    <p className="text-gray-500 text-[10px]">
                      • Liquidità libera accreditata al tasso BCE Trade Republic (3.75%).
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Posizioni Aperte:</span>
                  <span className="font-bold text-gray-900 font-mono">{portfolio.positions.length} asset in gestione</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PORTFOLIO & ORDERS */}
          {activeTab === 'PORTFOLIO' && (
            <div className="space-y-4 text-xs">
              {/* Asset Filters & List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {(['ALL', 'STOCKS', 'CRYPTO', 'ETF'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setAssetFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          assetFilter === cat
                            ? 'bg-black text-white font-semibold shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:text-black'
                        }`}
                      >
                        {cat === 'ALL' ? 'Tutti' : cat === 'STOCKS' ? 'Azioni' : cat === 'CRYPTO' ? 'Crypto' : 'ETF'}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    Clicca su un asset per visualizzarlo sul monitor 3D
                  </span>
                </div>

                {/* Horizontal Asset Selector Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {filteredAssets.map((asset) => {
                    const isSelected = activeAsset.id === asset.id;
                    const isPos = asset.changePercent24h >= 0;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => onSelectAsset(asset)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-gray-900">{asset.symbol}</span>
                          <span
                            className={`text-[11px] font-mono font-semibold flex items-center ${
                              isPos ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {isPos ? '+' : ''}{asset.changePercent24h.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-xs font-mono font-semibold text-gray-800">
                            €{asset.price.toFixed(2)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onManualBuyAsset(asset);
                            }}
                            className="px-2 py-0.5 rounded bg-gray-200 hover:bg-black hover:text-white text-[10px] text-gray-800 font-mono transition-colors"
                            title="Compra subito con Opus 5.5"
                          >
                            +Compra
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Open Positions Table */}
              <div>
                <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                  <span>Posizioni Attive con Stop-Loss Dinamico ({portfolio.positions.length})</span>
                  <span className="text-gray-500 font-normal">Chiusura automatica prima della discesa</span>
                </h4>
                {portfolio.positions.length === 0 ? (
                  <div className="text-center py-5 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-xs">
                    Nessuna posizione aperta. L'auto-pilot Opus 5.5 aprirà posizioni non appena rileva un breakout rialzista.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {portfolio.positions.map((pos) => {
                      const isGain = pos.pnl >= 0;
                      return (
                        <div
                          key={pos.id}
                          className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 font-mono">{pos.symbol}</span>
                            <span className="text-gray-500 text-[11px]">{pos.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-mono">
                              Carico: €{pos.buyPrice.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 font-mono">
                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 block">Stop-Loss Trailing</span>
                              <span className="text-emerald-700 font-semibold text-xs">
                                €{pos.stopLossPrice.toFixed(2)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 block">PnL Attuale</span>
                              <span className={`font-bold text-xs ${isGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isGain ? '+' : ''}€{pos.pnl.toFixed(2)} ({isGain ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                              </span>
                            </div>

                            <button
                              onClick={() => onManualClosePosition(pos.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-medium transition-colors"
                              title="Chiudi manualmente questa posizione a mercato"
                            >
                              Chiudi
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CARD & YIELD */}
          {activeTab === 'CARD_YIELD' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
              {/* Virtual Trade Republic Mirror Card */}
              <div className="md:col-span-5 space-y-3">
                <div
                  className={`relative w-full aspect-[1.58/1] max-w-[320px] mx-auto rounded-2xl p-4 border shadow-xl flex flex-col justify-between overflow-hidden transition-all ${
                    portfolio.userCard.cardType === 'MIRROR'
                      ? 'bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 border-slate-700 text-white'
                      : 'bg-[#141416] border-gray-800 text-white'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs tracking-widest text-white">TRADE REPUBLIC</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 uppercase">
                      {portfolio.userCard.cardType}
                    </span>
                  </div>

                  <div className="my-1">
                    <p className="text-[9px] text-gray-400 uppercase font-mono">Disponibile su Carta</p>
                    <p className="text-base font-bold font-mono text-white">
                      €{portfolio.availableCash.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] font-mono text-gray-300">
                      •••• •••• •••• {portfolio.userCard.last4}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-300 font-mono">
                    <span className="text-white font-medium">{portfolio.userCard.cardholderName}</span>
                    <span className="text-emerald-400 font-semibold">1% SAVEBACK</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenCardModal}
                    className="flex-1 py-2 px-3 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-medium transition-colors shadow-xs"
                  >
                    {isCardConfigured ? 'Modifica Carta Personale' : 'Collega la Tua Carta in Privacy'}
                  </button>
                  <button
                    onClick={() => onSimulateCardSpend(100)}
                    className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-mono font-medium transition-colors"
                    title="Simula un acquisto con carta di €100 con 1% Saveback (€1.00) investito in tempo reale"
                  >
                    Spesa €100 (+1% Saveback)
                  </button>
                </div>
              </div>

              {/* Yield & Global Market Sessions */}
              <div className="md:col-span-7 space-y-3">
                {/* Global Markets Sync Card */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Sincronizzazione Mercati Mondiali (Global Sync)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                      LIVE GLOBAL SYNC
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-2xs">
                      <span className="text-[9px] text-gray-500 block font-mono">XETRA / MILANO</span>
                      <span className="text-gray-900 font-semibold text-xs block">DAX +0.82%</span>
                      <span className="text-[9px] text-emerald-600 font-mono font-medium">● APERTO</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-2xs">
                      <span className="text-[9px] text-gray-500 block font-mono">WALL STREET</span>
                      <span className="text-gray-900 font-semibold text-xs block">S&P 500 +1.15%</span>
                      <span className="text-[9px] text-emerald-600 font-mono font-medium">● APERTO</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-2xs">
                      <span className="text-[9px] text-gray-500 block font-mono">TOKYO TSE</span>
                      <span className="text-gray-900 font-semibold text-xs block">NIKKEI +0.35%</span>
                      <span className="text-[9px] text-gray-400 font-mono font-medium">○ CHIUSO</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-gray-200 shadow-2xs">
                      <span className="text-[9px] text-gray-500 block font-mono">CRYPTO SPOT</span>
                      <span className="text-gray-900 font-semibold text-xs block">BTC +3.42%</span>
                      <span className="text-[9px] text-emerald-600 font-mono font-medium">● 24/7 ATTIVO</span>
                    </div>
                  </div>
                </div>

                {/* 3.75% Interest & Saveback Rewards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[10px] text-gray-500 block font-mono">INTERESSE BCE</span>
                    <span className="font-bold font-mono text-emerald-700">3.75% p.a.</span>
                    <span className="text-[9px] text-gray-500 block mt-0.5">+€{portfolio.accumulatedInterest.toFixed(2)} cumulati</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[10px] text-gray-500 block font-mono">SAVEBACK MATURATO</span>
                    <span className="font-bold font-mono text-gray-900">€{portfolio.userCard.totalSavebackEarned.toFixed(2)}</span>
                    <span className="text-[9px] text-gray-500 block mt-0.5">Asset: {portfolio.userCard.savebackAssetSymbol}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-[10px] text-gray-500 block font-mono">PRIVACY & SEGRETEZZA</span>
                    <span className="font-bold font-mono text-sky-700">100% LOCALE</span>
                    <span className="text-[9px] text-gray-500 block mt-0.5">Nessun dato su server</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 3D OFFICE & CAMERA */}
          {activeTab === 'OFFICE_3D' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-wider mb-2">
                  Prospettive Telecamera Ufficio Virtuale 3D Minimalista
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'DESK', label: 'Scrivania Trading', desc: 'Vista panoramica desk' },
                    { id: 'OPUS_AI', label: 'Schermo AI Opus', desc: 'Zoom su matrice neurale' },
                    { id: 'CHART', label: 'Grafico Candele', desc: 'Focus monitor centrale' },
                    { id: 'PORTFOLIO', label: 'Monitor Portafoglio', desc: 'Depth & carta utente' },
                    { id: 'SKYLINE', label: 'Skyline Notturna', desc: 'Finestra panoramica' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectCameraPreset(p.id as CameraPreset)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        cameraPreset === p.id
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-semibold text-xs block">{p.label}</span>
                      <span className="text-[10px] opacity-75 block mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-[11px] flex items-center justify-between">
                <span>
                  💡 <strong>Interazione 3D libera:</strong> Trascina con il mouse per ruotare a 360°, usa la rotella per zoomare.
                </span>
                <span className="text-gray-900 font-mono font-semibold">THREE.JS PBR SCENE</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
