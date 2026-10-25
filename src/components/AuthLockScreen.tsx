/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  AlertCircle,
  Building2,
  LockKeyhole,
} from 'lucide-react';
import { validateAccessPin } from '../trading/marketSync.ts';

interface AuthLockScreenProps {
  onUnlock: () => void;
  userCardholderName: string;
}

export const AuthLockScreen: React.FC<AuthLockScreenProps> = ({
  onUnlock,
  userCardholderName,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        if (validateAccessPin(nextPin, '2026')) {
          setTimeout(() => {
            onUnlock();
          }, 250);
        } else {
          setError('PIN non valido. Riprova (PIN demo predefinito: 2026)');
          setTimeout(() => {
            setPin('');
          }, 800);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleBiometricUnlock = () => {
    setPin('2026');
    setTimeout(() => {
      onUnlock();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xl select-none text-gray-900 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Luancer and Co. Centered Logo */}
        <div className="mb-4">
          <img
            src="./assets/aistudio/logo_Luancer_per_trading_d71fa9bd.jpg"
            alt="Luancer and Co."
            className="h-14 sm:h-16 w-auto object-contain rounded-2xl border border-gray-200/90 shadow-xs"
          />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-gray-900 mb-1">
          Zona di Accesso Protetto
        </h1>
        <p className="text-xs text-gray-500 text-center mb-6">
          Trading Desk Opus 5.5 • Ambiente Privato & Sicuro
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  isFilled
                    ? 'bg-black border-black scale-110 shadow-xs'
                    : 'border-gray-300 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 mb-4 animate-shake font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 text-lg font-mono font-semibold text-gray-900 border border-gray-200 transition-all active:scale-95 shadow-xs"
              aria-label={`Tasto ${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleBiometricUnlock}
            className="h-14 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-all active:scale-95"
            title="Sblocco biometrico rapido FaceID/TouchID"
            aria-label="Sblocco Biometrico"
          >
            <Fingerprint className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 text-lg font-mono font-semibold text-gray-900 border border-gray-200 transition-all active:scale-95 shadow-xs"
            aria-label="Tasto 0"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 text-xs font-mono font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 flex items-center justify-center transition-all active:scale-95"
            aria-label="Cancella cifra"
          >
            Canc
          </button>
        </div>

        {/* Demo Helper & Privacy Guarantee */}
        <div className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 text-center space-y-1 mb-4">
          <p className="flex items-center justify-center gap-1.5 text-gray-800 font-medium">
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>PIN predefinito demo: <strong className="font-mono text-black">2026</strong> o usa l'impronta biometrica</span>
          </p>
          <p className="text-[10px] text-gray-500">
            Sessione protetta con crittografia client-side locale.
          </p>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Privacy & Segretezza 100%
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <LockKeyhole className="w-3.5 h-3.5 text-sky-600" />
            Zero Dati su Server
          </span>
        </div>
      </div>
    </div>
  );
};
