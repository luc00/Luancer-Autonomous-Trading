/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CreditCard,
  Sparkles,
  Check,
  X,
  Trash2,
  LockKeyhole,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { UserCard } from '../trading/types.ts';

interface CardManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCard: UserCard;
  onUpdateCard: (updated: UserCard) => void;
  availableCash?: number;
  onDepositFromCard?: (amount: number) => void;
  onWithdrawToCard?: (amount: number) => void;
}

export const CardManagerModal: React.FC<CardManagerModalProps> = ({
  isOpen,
  onClose,
  userCard,
  onUpdateCard,
  availableCash = 4850,
  onDepositFromCard,
  onWithdrawToCard,
}) => {
  const [cardholderName, setCardholderName] = useState(
    userCard.cardholderName === 'TUO NOME' ? '' : userCard.cardholderName
  );
  const [cardType, setCardType] = useState<UserCard['cardType']>(userCard.cardType);
  const [cardNetwork, setCardNetwork] = useState<NonNullable<UserCard['cardNetwork']>>(
    userCard.cardNetwork || 'VISA'
  );
  const [last4, setLast4] = useState(userCard.last4 === '••••' ? '' : userCard.last4);
  const [expiry, setExpiry] = useState(userCard.expiry || '12/29');
  const [roundUpActive, setRoundUpActive] = useState(userCard.roundUpActive);
  const [savebackAsset, setSavebackAsset] = useState(userCard.savebackAssetSymbol);
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    const formattedName = cardholderName.trim().toUpperCase() || 'TITOLARE CARTA';
    const formattedDigits = last4.replace(/\D/g, '').slice(-4) || '8842';

    onUpdateCard({
      ...userCard,
      cardholderName: formattedName,
      cardType,
      cardNetwork,
      last4: formattedDigits,
      expiry,
      isActive: true,
      roundUpActive,
      savebackAssetSymbol: savebackAsset,
    });
    onClose();
  };

  const handleClearCard = () => {
    onUpdateCard({
      ...userCard,
      cardholderName: 'TUO NOME',
      cardType: 'MIRROR',
      cardNetwork: 'VISA',
      last4: '••••',
      expiry: '12/29',
      isActive: false,
      totalSavebackEarned: 0,
    });
    onClose();
  };

  const handleExecuteDeposit = (amount: number) => {
    if (onDepositFromCard) {
      onDepositFromCard(amount);
      setFeedbackMsg(`✓ €${amount.toLocaleString('de-DE')} addebitati dalla carta e accreditati sul conto trading!`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleExecuteWithdraw = (amount: number) => {
    if (onWithdrawToCard) {
      onWithdrawToCard(amount);
      setFeedbackMsg(`✓ €${amount.toLocaleString('de-DE')} prelevati dal conto e riaccreditati sulla tua carta!`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 text-gray-900 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          aria-label="Chiudi finestra"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              Collega la Tua Carta & Opera nel Mercato
            </h2>
            <p className="text-xs text-gray-500">
              Visualizzazione identica e precisa sullo schermo • Nessun dato inviato a server esterni • Privacy 100%
            </p>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Realistic Trade Republic Physical Card Render with Identical Icon */}
        <div className="mb-6">
          <div
            className={`relative w-full max-w-[390px] h-[225px] mx-auto rounded-2xl p-5 border shadow-xl flex flex-col justify-between overflow-hidden transition-all duration-300 ${
              cardType === 'MIRROR'
                ? 'bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 border-slate-700 text-white shadow-slate-900/30'
                : cardType === 'CLASSIC'
                ? 'bg-[#121214] border-gray-800 text-white shadow-black/40'
                : 'bg-gradient-to-br from-emerald-600 via-slate-900 to-slate-950 border-emerald-500/50 text-white'
            }`}
          >
            {/* Mirror Finish Specular Shimmer */}
            {cardType === 'MIRROR' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none" />
            )}

            {/* Top row: Brand & Type */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-widest text-xs text-white">TRADE REPUBLIC</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/20 uppercase tracking-wider text-gray-200">
                {cardType === 'MIRROR' ? 'Mirror Specchiata' : cardType === 'CLASSIC' ? 'Classic Black' : 'Virtual Card'}
              </span>
            </div>

            {/* EMV Chip & Contactless wave */}
            <div className="flex items-center gap-3 my-auto z-10">
              {/* Golden EMV Chip */}
              <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/60 shadow-sm relative overflow-hidden flex items-center justify-center">
                <div className="w-full h-[1px] bg-amber-600/60" />
                <div className="absolute h-full w-[1px] bg-amber-600/60" />
              </div>
              <div className="text-gray-300 opacity-80">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Cardholder Name & Number & Precise Network Icon */}
            <div className="z-10">
              <div className="font-mono text-sm tracking-widest text-gray-200 mb-1">
                •••• •••• •••• {last4 || '••••'}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-mono">Titolare</span>
                  <span className="font-mono font-semibold text-xs tracking-wider text-white">
                    {cardholderName.trim().toUpperCase() || 'IL TUO NOME'}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-mono">Scadenza</span>
                  <span className="font-mono font-semibold text-xs text-white">{expiry}</span>
                </div>

                {/* Identical Card Network Icon */}
                <div className="flex items-center">
                  {cardNetwork === 'VISA' && (
                    <span className="font-black italic tracking-tighter text-lg text-white drop-shadow-sm font-sans">
                      VISA
                    </span>
                  )}
                  {cardNetwork === 'MASTERCARD' && (
                    <div className="flex items-center -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-rose-500 opacity-90 shadow-xs" />
                      <div className="w-6 h-6 rounded-full bg-amber-400 opacity-90 shadow-xs" />
                    </div>
                  )}
                  {cardNetwork === 'AMEX' && (
                    <div className="px-2 py-0.5 rounded bg-sky-600 text-white font-extrabold text-[11px] tracking-widest font-mono shadow-xs border border-sky-400">
                      AMEX
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operating with Real Money in the Market */}
        <div className="mb-5 p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-xs flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Lavora nel Mercato con la Tua Carta
            </span>
            <span className="text-[11px] font-mono font-semibold text-gray-800">
              Liquidità Trading: €{availableCash.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[250, 500, 1000, 2500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleExecuteDeposit(amt)}
                className="py-2 px-2.5 rounded-xl bg-white hover:bg-emerald-50 text-gray-900 hover:text-emerald-800 border border-gray-200 hover:border-emerald-300 font-mono text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-2xs"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>+€{amt.toLocaleString('de-DE')}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-[11px]">
            <span className="text-gray-500">I fondi trasferiti guadagnano il 3.75% annuo BCE e sono protetti dall'algoritmo Zero-Loss.</span>
            {availableCash >= 500 && (
              <button
                type="button"
                onClick={() => handleExecuteWithdraw(500)}
                className="text-xs text-rose-700 hover:text-rose-900 font-medium flex items-center gap-1 shrink-0 ml-2"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Preleva €500 sulla Carta
              </button>
            )}
          </div>
        </div>

        {/* Card Settings Form */}
        <div className="space-y-4 text-xs">
          {/* Card Network Selector: Visa, Mastercard, Amex */}
          <div>
            <label className="block text-[11px] font-mono text-gray-600 uppercase tracking-wider mb-2">
              Circuito della Tua Carta (Icona Identica sullo Schermo)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['VISA', 'MASTERCARD', 'AMEX'] as const).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setCardNetwork(net)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    cardNetwork === net
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-semibold text-xs">{net}</span>
                  {net === 'VISA' && (
                    <span className="font-bold italic text-xs">VISA</span>
                  )}
                  {net === 'MASTERCARD' && (
                    <div className="flex items-center -space-x-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                    </div>
                  )}
                  {net === 'AMEX' && (
                    <span className="text-[10px] font-mono font-bold">AMEX</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Card Model Selector */}
          <div>
            <label className="block text-[11px] font-mono text-gray-600 uppercase tracking-wider mb-2">
              Stile Fisico Carta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'MIRROR', label: 'Mirror (Acciaio)', desc: 'Acciaio cromato lucido' },
                { id: 'CLASSIC', label: 'Classic Matte', desc: 'Nero opaco essenziale' },
                { id: 'VIRTUAL', label: 'Virtual Card', desc: 'Per pagamenti digitali' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCardType(c.id as UserCard['cardType'])}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    cardType === c.id
                      ? 'bg-emerald-50 border-emerald-500 text-gray-900 shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-semibold text-xs block text-gray-900">{c.label}</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cardholder name, last 4 digits, expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono text-gray-600 uppercase tracking-wider mb-1">
                Nome Intestatario Carta
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="ES. IL TUO NOME E COGNOME"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-gray-600 uppercase tracking-wider mb-1">
                Ultime 4 Cifre
              </label>
              <input
                type="text"
                maxLength={4}
                value={last4}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setLast4(val);
                  if (val.startsWith('4')) setCardNetwork('VISA');
                  if (val.startsWith('5')) setCardNetwork('MASTERCARD');
                  if (val.startsWith('3')) setCardNetwork('AMEX');
                }}
                placeholder="ES. 8842"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Saveback & Round-Up Automation */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 block">1% Saveback Automatico</span>
                <span className="text-[10px] text-gray-500">
                  Ogni spesa accredita l'1% nel piano di accumulo dell'asset selezionato
                </span>
              </div>
              <select
                value={savebackAsset}
                onChange={(e) => setSavebackAsset(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 text-gray-800 font-mono text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="NVDA">NVDA (NVIDIA Corp)</option>
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="EUNL">EUNL (Core MSCI World)</option>
                <option value="ASML">ASML Holding</option>
                <option value="ETH">ETH (Ethereum)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div>
                <span className="font-semibold text-gray-900 block">Round-up Invest (Arrotondamento)</span>
                <span className="text-[10px] text-gray-500">
                  Arrotonda automaticamente per micro-investimenti
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRoundUpActive((prev) => !prev)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  roundUpActive ? 'bg-black' : 'bg-gray-300'
                }`}
                aria-label="Attiva o disattiva round up"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    roundUpActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Privacy & Zero-Server-Storage Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2.5">
            <LockKeyhole className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Garanzia di Totale Privacy & Segretezza:</strong> Chiunque usi questa applicazione inserisce esclusivamente la propria carta. I dati sono salvati nella memoria locale del tuo browser e non vengono mai inviati a server esterni.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between gap-2">
          {userCard.isActive ? (
            <button
              type="button"
              onClick={handleClearCard}
              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Rimuovi Carta</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-xs transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-black hover:bg-gray-800 text-white font-semibold text-xs transition-all shadow-xs"
            >
              Salva in Privacy & Applica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
