/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Percent,
  Play,
  Pause,
  PlusCircle,
  Eye,
  Info,
  Lock,
  CreditCard,
  Globe2,
} from 'lucide-react';
import { Portfolio, OpusStrategyConfig } from '../trading/types.ts';
import { CameraPreset } from './VirtualOfficeView.tsx';

interface TopBarProps {
  portfolio: Portfolio;
  strategyConfig: OpusStrategyConfig;
  onToggleAutoPilot: () => void;
  onDepositCash: (amount: number) => void;
  onOpenRiskModal: () => void;
  onOpenCardModal: () => void;
  onLockSession: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  cameraPreset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  portfolio,
  strategyConfig,
  onToggleAutoPilot,
  onDepositCash,
  onOpenRiskModal,
  onOpenCardModal,
  onLockSession,
  isZenMode,
  onToggleZenMode,
}) => {
  const isPnlPositive = portfolio.totalPnl >= 0;
  const isCardLinked = portfolio.userCard.isActive && portfolio.userCard.cardholderName !== 'TUO NOME';

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs text-gray-900">
      {/* Left: Brand & Financial Stats */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* Portfolio Balance & Cash Stats */}
        <div className="flex items-center gap-3 bg-gray-50/90 px-3.5 py-1.5 rounded-xl border border-gray-200">
          <div>
            <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">
              Portafoglio
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-bold text-gray-900 font-mono">
                €{portfolio.totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`text-[11px] font-semibold font-mono flex items-center ${
                  isPnlPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isPnlPositive ? '+' : ''}€{portfolio.totalPnl.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-gray-200 hidden md:block" />

          {/* Liquid Cash with 3.75% Interest */}
          <div className="hidden md:block">
            <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider flex items-center gap-1">
              Liquidità <span className="text-emerald-600 font-semibold">3.75%</span>
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-gray-800 font-mono">
                €{portfolio.availableCash.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-600 font-mono">
                +€{portfolio.accumulatedInterest.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: UPLOADED LUANCER AND CO. LOGO */}
      <div className="order-first md:order-none w-full md:w-auto flex items-center justify-center my-1 md:my-0">
        <div className="relative group">
          <img
            src="./assets/aistudio/logo_Luancer_per_trading_d71fa9bd.jpg"
            alt="Luancer and Co. - Quality You Can Trust"
            className="h-10 sm:h-12 w-auto object-contain rounded-xl border border-gray-200/90 shadow-xs bg-white transition-transform hover:scale-105"
          />
        </div>
      </div>

      {/* Right Controls: Auto-Pilot, Card, Deposit, Lock, Zen */}
      <div className="flex items-center gap-2">
        {/* Auto-Pilot Toggle */}
        <button
          onClick={onToggleAutoPilot}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all shadow-xs ${
            strategyConfig.autoPilot
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
          aria-label={strategyConfig.autoPilot ? 'Pausa Auto-Pilot Opus 5.5' : 'Avvia Auto-Pilot Opus 5.5'}
        >
          {strategyConfig.autoPilot ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <span>Opus 5.5: ATTIVO</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-gray-500" />
              <span>Avvia Auto-Pilot</span>
            </>
          )}
        </button>

        {/* Private User Card Trigger with accurate Network Icon */}
        <button
          onClick={onOpenCardModal}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          title="Collega o gestisci la tua carta in totale privacy e segretezza"
          aria-label="Gestione Carta Trade Republic"
        >
          {isCardLinked ? (
            <>
              {portfolio.userCard.cardNetwork === 'MASTERCARD' ? (
                <div className="flex items-center -space-x-1" title="Mastercard">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                </div>
              ) : portfolio.userCard.cardNetwork === 'AMEX' ? (
                <span className="px-1 py-0.2 bg-sky-600 text-white rounded text-[9px] font-mono font-bold" title="American Express">
                  AMEX
                </span>
              ) : (
                <span className="font-black italic text-[11px] text-blue-700 font-sans tracking-tight" title="Visa">
                  VISA
                </span>
              )}
              <span className="hidden sm:inline font-mono">
                •••• {portfolio.userCard.last4}
              </span>
            </>
          ) : (
            <>
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline font-mono">Collega Carta</span>
            </>
          )}
        </button>

        {/* Deposit Simulated Cash */}
        <button
          onClick={() => onDepositCash(1000)}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1 transition-colors"
          title="Deposita €1.000 simulati nel conto"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden lg:inline font-mono">+€1.000</span>
        </button>

        {/* Info & Risk Modal */}
        <button
          onClick={onOpenRiskModal}
          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs transition-colors"
          title="Dettagli Strategia Zero-Loss & Trasparenza"
          aria-label="Informazioni Strategia Zero-Loss"
        >
          <Info className="w-3.5 h-3.5 text-sky-600" />
        </button>

        {/* Protected Access Zone Lock */}
        <button
          onClick={onLockSession}
          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs transition-colors"
          title="Blocca sessione (Accesso Protetto)"
          aria-label="Blocca Sessione"
        >
          <Lock className="w-3.5 h-3.5 text-amber-600" />
        </button>

        {/* 3D Zen Mode */}
        <button
          onClick={onToggleZenMode}
          className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1 ${
            isZenMode
              ? 'bg-black text-white border-black'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
          title={isZenMode ? 'Mostra Pannello Trading' : 'Modalità Immersione 3D Zen'}
          aria-label="Modalità Immersione 3D"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden xl:inline">3D Zen</span>
        </button>
      </div>
    </header>
  );
};
