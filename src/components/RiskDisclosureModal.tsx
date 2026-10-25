/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, AlertTriangle, TrendingUp, X, CheckCircle2, LockKeyhole } from 'lucide-react';

interface RiskDisclosureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskDisclosureModal: React.FC<RiskDisclosureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-gray-900 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          aria-label="Chiudi finestra"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">
              Architettura Opus 5.5 & Trasparenza Operativa
            </h2>
            <p className="text-xs text-gray-500">
              Luancer and Co. • Protezione del Capitale & Meccanica Zero-Loss
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="space-y-4 text-xs sm:text-sm text-gray-700">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              1. Comprare quando sale (Momentum & Trend Breakout)
            </h3>
            <p className="leading-relaxed text-gray-600 text-xs">
              L'algoritmo Opus 5.5 monitora costantemente gli strumenti mondiali. L'ingresso scatta esclusivamente quando c'è convergenza rialzista: Media Mobile Rapida sopra la Lenta, Rate of Change positivo e punteggio di Momentum superiore a 65/100.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              2. Ritirare prima di scendere e perdere (Trailing Break-Even Ratchet)
            </h3>
            <p className="leading-relaxed text-gray-600 text-xs">
              Al primo raggiungimento di profitto (+0.4%), lo stop-loss viene istantaneamente portato sopra il prezzo di carico (Break-Even Lock). Salendo il prezzo, lo stop segue il massimo a distanza fissa (0.7%), uscendo prontamente prima di subire drawdown.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <LockKeyhole className="w-4 h-4 text-purple-600" />
              3. Privacy Totale & Segretezza della Carta
            </h3>
            <p className="leading-relaxed text-gray-600 text-xs">
              Nessun dato finanziario privato dell'utente viene memorizzato su server remoti né condiviso con terze parti. La carta configurata rimane confidenziale nel browser locale del dispositivo in uso.
            </p>
          </div>

          {/* Regulatory & Safety Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-semibold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Avvertenza di Trasparenza & Simulazione Finanziaria</span>
            </div>
            <p className="leading-relaxed text-amber-800/90 text-[11px]">
              Questo applicativo fornisce un ambiente di <strong>paper trading sandbox ed esecuzione algoritmica</strong>. Nei mercati finanziari reali, nessun software può eliminare totalmente il rischio di volatilità o gap d'apertura. Non costituisce sollecitazione o consulenza finanziaria personalizzata.
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white font-semibold text-xs transition-all shadow-xs"
          >
            Ho compreso, torna al Trading Desk
          </button>
        </div>
      </div>
    </div>
  );
};
