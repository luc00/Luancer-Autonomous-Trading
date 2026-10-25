/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VirtualOfficeView, CameraPreset } from './components/VirtualOfficeView.tsx';
import { TopBar } from './components/TopBar.tsx';
import { ControlDock } from './components/ControlDock.tsx';
import { RiskDisclosureModal } from './components/RiskDisclosureModal.tsx';
import { AuthLockScreen } from './components/AuthLockScreen.tsx';
import { CardManagerModal } from './components/CardManagerModal.tsx';
import {
  INITIAL_ASSETS,
  INITIAL_CONFIG,
  INITIAL_PORTFOLIO,
} from './trading/initialData.ts';
import {
  Asset,
  Portfolio,
  OpusStrategyConfig,
  Position,
  TradeLog,
  UserCard,
} from './trading/types.ts';
import {
  evaluateBuySignal,
  evaluatePositionManagement,
  calculateCashInterest,
  simulatePriceTick,
} from './trading/engine.ts';
import { calculateCardSaveback } from './trading/marketSync.ts';

export default function App() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [activeAssetId, setActiveAssetId] = useState<string>('nvda');
  const [portfolio, setPortfolio] = useState<Portfolio>(INITIAL_PORTFOLIO);
  const [strategyConfig, setStrategyConfig] = useState<OpusStrategyConfig>(INITIAL_CONFIG);
  const [latestDecision, setLatestDecision] = useState<string>(
    'Opus 5.5 Desk attivo: scansione momentum rialzista in corso su Trade Republic...'
  );
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('DESK');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);
  // Protected Access Zone state (supports ?autostart=1 from Ultra Mode test suite)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('autostart') !== '1';
    }
    return false;
  });

  // Active asset object
  const activeAsset = assets.find((a) => a.id === activeAssetId) || assets[0];

  // Ref tracking current state for interval ticks
  const stateRef = useRef({
    assets,
    portfolio,
    strategyConfig,
  });

  useEffect(() => {
    stateRef.current = { assets, portfolio, strategyConfig };
  }, [assets, portfolio, strategyConfig]);

  // Main Simulation & Autonomous Execution Loop (every 1.5s)
  useEffect(() => {
    const timer = setInterval(() => {
      const { assets: currentAssets, portfolio: currentPort, strategyConfig: currentConfig } =
        stateRef.current;

      // 1. Tick Prices for All Assets
      const updatedAssets = currentAssets.map((asset) => {
        // Bias slightly upwards for momentum simulation
        const newPrice = simulatePriceTick(asset.price, asset.volatility, 0.0003);
        const diff24h = newPrice - asset.previousClose;
        const pct24h = (diff24h / asset.previousClose) * 100;

        // Append to history
        const newHistory = [
          ...asset.history.slice(-18),
          {
            time: Date.now(),
            open: asset.price,
            close: newPrice,
            high: Math.max(asset.price, newPrice) * 1.001,
            low: Math.min(asset.price, newPrice) * 0.999,
            price: newPrice,
            volume: Math.floor(1000 + Math.random() * 5000),
          },
        ];

        return {
          ...asset,
          price: newPrice,
          change24h: diff24h,
          changePercent24h: pct24h,
          history: newHistory,
        };
      });

      // 2. Accrue Trade Republic 3.75% Cash Interest (1.5 seconds fraction)
      const interestDelta = calculateCashInterest(
        currentPort.availableCash,
        currentPort.interestRateAnnual,
        1.5
      );
      const newAccumulatedInterest = currentPort.accumulatedInterest + interestDelta;
      let newAvailableCash = currentPort.availableCash + interestDelta;

      let updatedPositions: Position[] = [...currentPort.positions];
      let newTrades: TradeLog[] = [...currentPort.tradeHistory];
      let winCount = currentPort.winningTrades;
      let totalTradesCount = currentPort.totalTrades;
      let decisionMessage = latestDecision;

      // 3. Autonomous Execution: Manage Open Positions (Trailing Stop / Break-Even Lock)
      const remainingPositions: Position[] = [];

      for (const pos of updatedPositions) {
        const liveAsset = updatedAssets.find((a) => a.id === pos.assetId);
        const currentPrice = liveAsset ? liveAsset.price : pos.currentPrice;

        const evalResult = evaluatePositionManagement(pos, currentPrice, currentConfig);

        if (currentConfig.autoPilot && evalResult.shouldSell) {
          // Autonomous Sell Execution (Take Profit / Zero-Loss Stop)
          const soldValue = pos.quantity * currentPrice;
          const pnl = soldValue - pos.investedAmount;
          const pnlPercent = (pnl / pos.investedAmount) * 100;

          newAvailableCash += soldValue;
          totalTradesCount += 1;
          if (pnl >= -0.01) {
            winCount += 1;
          }

          const sellLog: TradeLog = {
            id: `trade-sell-${Date.now()}-${pos.symbol}`,
            timestamp: Date.now(),
            type: 'SELL',
            symbol: pos.symbol,
            name: pos.name,
            quantity: pos.quantity,
            price: currentPrice,
            totalAmount: soldValue,
            pnl,
            pnlPercent,
            reason: evalResult.reason,
          };
          newTrades.unshift(sellLog);
          decisionMessage = evalResult.reason;
        } else {
          remainingPositions.push(evalResult.updatedPosition);
        }
      }

      updatedPositions = remainingPositions;

      // 4. Autonomous Execution: Scan for Buy Breakouts ("comprare quando sale")
      if (currentConfig.autoPilot) {
        for (const asset of updatedAssets) {
          const buySignal = evaluateBuySignal(
            asset,
            newAvailableCash,
            updatedPositions,
            currentConfig
          );

          if (buySignal.shouldBuy && buySignal.allocationAmount >= 50) {
            const allocation = buySignal.allocationAmount;
            const quantity = Math.round((allocation / asset.price) * 10000) / 10000;
            const investedAmount = Math.round(quantity * asset.price * 100) / 100;

            newAvailableCash -= investedAmount;

            // Initial protective stop: 0.8% below entry
            const initialStop = asset.price * (1 - currentConfig.trailingOffsetPercent / 100);

            const newPos: Position = {
              id: `pos-${Date.now()}-${asset.id}`,
              assetId: asset.id,
              symbol: asset.symbol,
              name: asset.name,
              category: asset.category,
              buyPrice: asset.price,
              currentPrice: asset.price,
              quantity,
              investedAmount,
              currentValue: investedAmount,
              pnl: 0,
              pnlPercent: 0,
              peakPrice: asset.price,
              stopLossPrice: initialStop,
              breakEvenLocked: false,
              openedAt: Date.now(),
            };

            updatedPositions.push(newPos);

            const buyLog: TradeLog = {
              id: `trade-buy-${Date.now()}-${asset.symbol}`,
              timestamp: Date.now(),
              type: 'BUY',
              symbol: asset.symbol,
              name: asset.name,
              quantity,
              price: asset.price,
              totalAmount: investedAmount,
              reason: buySignal.reason,
            };
            newTrades.unshift(buyLog);
            decisionMessage = `Acquisto Autonomo: ${asset.symbol} a €${asset.price.toFixed(2)} (${buySignal.reason})`;
            break; // Max 1 buy execution per tick to pace capital allocation
          }
        }
      }

      // 5. Update Portfolio Totals
      const totalInvested = updatedPositions.reduce((sum, p) => sum + p.investedAmount, 0);
      const totalCurrentInvestedValue = updatedPositions.reduce(
        (sum, p) => sum + p.currentValue,
        0
      );
      const totalVal = newAvailableCash + totalCurrentInvestedValue;
      const totalPnl = totalVal - currentPort.initialCash;
      const totalPnlPct = (totalPnl / currentPort.initialCash) * 100;

      const updatedPortfolio: Portfolio = {
        ...currentPort,
        availableCash: Math.round(newAvailableCash * 100) / 100,
        investedValue: Math.round(totalCurrentInvestedValue * 100) / 100,
        totalValue: Math.round(totalVal * 100) / 100,
        totalPnl: Math.round(totalPnl * 100) / 100,
        totalPnlPercent: Math.round(totalPnlPct * 100) / 100,
        accumulatedInterest: Math.round(newAccumulatedInterest * 100) / 100,
        totalTrades: totalTradesCount,
        winningTrades: winCount,
        positions: updatedPositions,
        tradeHistory: newTrades.slice(0, 30),
      };

      setAssets(updatedAssets);
      setPortfolio(updatedPortfolio);
      if (decisionMessage !== latestDecision) {
        setLatestDecision(decisionMessage);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [latestDecision]);

  // Toggle Auto-Pilot
  const handleToggleAutoPilot = useCallback(() => {
    setStrategyConfig((prev) => {
      const next = !prev.autoPilot;
      setLatestDecision(
        next
          ? 'Opus 5.5 Auto-Pilot avviato: scansione e protezione Zero-Loss attive.'
          : 'Opus 5.5 Auto-Pilot messo in pausa.'
      );
      return { ...prev, autoPilot: next };
    });
  }, []);

  // Update Strategy Parameters
  const handleUpdateStrategy = useCallback((updated: Partial<OpusStrategyConfig>) => {
    setStrategyConfig((prev) => ({ ...prev, ...updated }));
  }, []);

  // Deposit Simulated Cash (+€1.000)
  const handleDepositCash = useCallback((amount: number) => {
    setPortfolio((prev) => {
      const newCash = prev.availableCash + amount;
      const newTotal = prev.totalValue + amount;
      const newInitial = prev.initialCash + amount;
      return {
        ...prev,
        initialCash: newInitial,
        availableCash: newCash,
        totalValue: newTotal,
      };
    });
    setLatestDecision(`Deposito di €${amount.toLocaleString('de-DE')} completato sul conto Trade Republic.`);
  }, []);

  // Manual Close Position
  const handleManualClosePosition = useCallback((positionId: string) => {
    setPortfolio((prev) => {
      const targetPos = prev.positions.find((p) => p.id === positionId);
      if (!targetPos) return prev;

      const soldValue = targetPos.currentValue;
      const pnl = soldValue - targetPos.investedAmount;
      const pnlPct = (pnl / targetPos.investedAmount) * 100;

      const closeLog: TradeLog = {
        id: `trade-manual-${Date.now()}-${targetPos.symbol}`,
        timestamp: Date.now(),
        type: 'SELL',
        symbol: targetPos.symbol,
        name: targetPos.name,
        quantity: targetPos.quantity,
        price: targetPos.currentPrice,
        totalAmount: soldValue,
        pnl,
        pnlPercent: pnlPct,
        reason: 'Chiusura manuale da interfaccia utente Trade Republic',
      };

      const updatedPos = prev.positions.filter((p) => p.id !== positionId);
      const newCash = prev.availableCash + soldValue;
      const totalInvestedVal = updatedPos.reduce((sum, p) => sum + p.currentValue, 0);
      const totalVal = newCash + totalInvestedVal;

      return {
        ...prev,
        availableCash: Math.round(newCash * 100) / 100,
        investedValue: Math.round(totalInvestedVal * 100) / 100,
        totalValue: Math.round(totalVal * 100) / 100,
        totalTrades: prev.totalTrades + 1,
        winningTrades: pnl >= 0 ? prev.winningTrades + 1 : prev.winningTrades,
        positions: updatedPos,
        tradeHistory: [closeLog, ...prev.tradeHistory],
      };
    });
    setLatestDecision('Posizione chiusa manualmente su Trade Republic.');
  }, []);

  // Manual Buy Asset
  const handleManualBuyAsset = useCallback((asset: Asset) => {
    const { portfolio: curPort, strategyConfig: curConfig } = stateRef.current;
    const maxAvailable = curPort.availableCash * 0.25;
    if (maxAvailable < 50) {
      setLatestDecision('Liquidità insufficiente per aprire una nuova posizione (minimo €50).');
      return;
    }

    const allocation = Math.min(500, maxAvailable);
    const quantity = Math.round((allocation / asset.price) * 10000) / 10000;
    const invested = Math.round(quantity * asset.price * 100) / 100;
    const initialStop = asset.price * (1 - curConfig.trailingOffsetPercent / 100);

    const newPos: Position = {
      id: `pos-man-${Date.now()}-${asset.id}`,
      assetId: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      category: asset.category,
      buyPrice: asset.price,
      currentPrice: asset.price,
      quantity,
      investedAmount: invested,
      currentValue: invested,
      pnl: 0,
      pnlPercent: 0,
      peakPrice: asset.price,
      stopLossPrice: initialStop,
      breakEvenLocked: false,
      openedAt: Date.now(),
    };

    setPortfolio((prev) => {
      const newCash = prev.availableCash - invested;
      const updatedPositions = [...prev.positions, newPos];
      const totalInvestedVal = updatedPositions.reduce((s, p) => s + p.currentValue, 0);
      return {
        ...prev,
        availableCash: Math.round(newCash * 100) / 100,
        investedValue: Math.round(totalInvestedVal * 100) / 100,
        positions: updatedPositions,
      };
    });

    setLatestDecision(`Acquisto manuale eseguito: ${asset.symbol} per €${invested.toFixed(2)}.`);
  }, []);

  // Update User Trade Republic Card with Local Privacy Storage
  const handleUpdateCard = useCallback((updatedCard: UserCard) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tr_user_card_v2', JSON.stringify(updatedCard));
      } catch {
        // Local storage fallback
      }
    }
    setPortfolio((prev) => ({
      ...prev,
      userCard: updatedCard,
    }));
    setLatestDecision(
      `Carta ${updatedCard.cardNetwork || 'VISA'} ${updatedCard.cardType} aggiornata per ${updatedCard.cardholderName}. 1% Saveback attivo su ${updatedCard.savebackAssetSymbol}.`
    );
  }, []);

  // Deposit funds from connected card to trading cash
  const handleDepositFromCard = useCallback((amount: number) => {
    setPortfolio((prev) => {
      const newCash = prev.availableCash + amount;
      const newTotal = prev.totalValue + amount;
      const newInitial = prev.initialCash + amount;
      return {
        ...prev,
        initialCash: newInitial,
        availableCash: Math.round(newCash * 100) / 100,
        totalValue: Math.round(newTotal * 100) / 100,
      };
    });
    setLatestDecision(
      `Ricarica di €${amount.toLocaleString('de-DE')} completata dalla tua carta •••• ${portfolio.userCard.last4} al conto trading Trade Republic.`
    );
  }, [portfolio.userCard.last4]);

  // Withdraw profits back to connected card
  const handleWithdrawToCard = useCallback((amount: number) => {
    setPortfolio((prev) => {
      if (prev.availableCash < amount) {
        setLatestDecision('Liquidità insufficiente per il prelievo.');
        return prev;
      }
      const newCash = prev.availableCash - amount;
      const newTotal = prev.totalValue - amount;
      return {
        ...prev,
        availableCash: Math.round(newCash * 100) / 100,
        totalValue: Math.round(newTotal * 100) / 100,
      };
    });
    setLatestDecision(
      `Prelievo di €${amount.toLocaleString('de-DE')} riaccreditato sulla tua carta •••• ${portfolio.userCard.last4}.`
    );
  }, [portfolio.userCard.last4]);

  // Simulate Card Spend with 1% Saveback Reinvestment
  const handleSimulateCardSpend = useCallback((spendAmount: number) => {
    setPortfolio((prev) => {
      const card = prev.userCard;
      const { savebackReward, totalInvested } = calculateCardSaveback(spendAmount, card);
      const newSavebackTotal = card.totalSavebackEarned + savebackReward;

      return {
        ...prev,
        userCard: {
          ...card,
          totalSavebackEarned: Math.round(newSavebackTotal * 100) / 100,
        },
      };
    });

    setLatestDecision(
      `Pagamento con carta Trade Republic di €${spendAmount.toFixed(2)} eseguito. 1% Saveback (+€${(spendAmount * 0.01).toFixed(2)}) investito in ${portfolio.userCard.savebackAssetSymbol}!`
    );
  }, [portfolio.userCard.savebackAssetSymbol]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F8FAFC] select-none text-gray-900 font-sans">
      {/* 3D Three.js Virtual Office */}
      <VirtualOfficeView
        activeAsset={activeAsset}
        portfolio={portfolio}
        strategyConfig={strategyConfig}
        latestDecision={latestDecision}
        cameraPreset={cameraPreset}
      />

      {/* Minimalist Trade Republic Top Bar */}
      <TopBar
        portfolio={portfolio}
        strategyConfig={strategyConfig}
        onToggleAutoPilot={handleToggleAutoPilot}
        onDepositCash={handleDepositCash}
        onOpenRiskModal={() => setIsRiskModalOpen(true)}
        onOpenCardModal={() => setIsCardModalOpen(true)}
        onLockSession={() => setIsLocked(true)}
        isZenMode={isZenMode}
        onToggleZenMode={() => {
          setIsZenMode((prev) => !prev);
          setIsCollapsed((prev) => !prev);
        }}
        cameraPreset={cameraPreset}
        onSelectPreset={setCameraPreset}
      />

      {/* Collapsible Unified Bottom Control Dock */}
      {!isZenMode && (
        <ControlDock
          assets={assets}
          activeAsset={activeAsset}
          onSelectAsset={(a) => setActiveAssetId(a.id)}
          portfolio={portfolio}
          strategyConfig={strategyConfig}
          onUpdateStrategy={handleUpdateStrategy}
          latestDecision={latestDecision}
          onManualClosePosition={handleManualClosePosition}
          onManualBuyAsset={handleManualBuyAsset}
          onOpenCardModal={() => setIsCardModalOpen(true)}
          onSimulateCardSpend={handleSimulateCardSpend}
          cameraPreset={cameraPreset}
          onSelectCameraPreset={setCameraPreset}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      )}

      {/* Transparent Financial Education & Risk Disclosure Modal */}
      <RiskDisclosureModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
      />

      {/* Trade Republic Card Manager Modal */}
      <CardManagerModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        userCard={portfolio.userCard}
        onUpdateCard={handleUpdateCard}
        availableCash={portfolio.availableCash}
        onDepositFromCard={handleDepositFromCard}
        onWithdrawToCard={handleWithdrawToCard}
      />

      {/* Protected Access Zone Screen */}
      {isLocked && (
        <AuthLockScreen
          onUnlock={() => setIsLocked(false)}
          userCardholderName={portfolio.userCard.cardholderName}
        />
      )}
    </div>
  );
}
