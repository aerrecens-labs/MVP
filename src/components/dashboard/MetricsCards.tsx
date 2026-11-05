/**
 * MetricsCards — Top-of-dashboard KPI cards.
 *
 * Card 1 – Smart Wallet Balance      real on-chain ETH (wagmi useBalance)
 * Card 2 – 24h Change                real ETH price from CoinGecko
 * Card 3 – Active DeFi Positions     Zerion position count (+ agent scan count)
 * Card 4 – Best Available APY        agent /optimize (real opportunity data)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useAgentData } from '@/hooks/useAgentData';
import { useAgentStrategies } from '@/hooks/useAgentStrategies';
import { usePriceData } from '@/hooks/usePriceData';
import { useOnChainBalances } from '@/hooks/useOnChainBalances';
import { useDeFiPositions } from '@/hooks/useDeFiPositions';

// ─────────────────────────────────────────────────────────────────────────────
// Card 1 — Total Net Worth (wallet balances + DeFi positions)
// ─────────────────────────────────────────────────────────────────────────────

const NetWorthCard: React.FC = () => {
  const { isMockMode } = useEnvironment();
  const { assets, ethPrice, isLoading: balLoading } = useOnChainBalances();
  const { positions, isLoading: posLoading } = useDeFiPositions();

  const walletUsd = assets.reduce((sum, a) => sum + a.usdValue, 0);
  const defiUsd = positions.reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  const totalNetWorthUsd = walletUsd + defiUsd;
  const ethAsset = assets.find((a) => a.symbol === 'ETH' || a.symbol === 'WETH');
  const totalEth = ethAsset?.balance ?? 0;
  const price = ethPrice || ethAsset?.price || 0;

  const isLoading = !isMockMode && (balLoading || posLoading);

  return (
    <div
      className="group relative rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 100%)',
        border: '1px solid rgba(0,212,255,0.15)',
      }}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 100%)',
          filter: 'blur(20px)',
          zIndex: -1,
        }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
        >
          <DollarSign size={20} style={{ color: 'rgba(0,212,255,1)' }} />
        </div>
        <div className="flex items-center gap-1">
          <ArrowUpRight size={14} className="text-[#00FFA3]" />
          <span className="text-xs font-medium text-[#00FFA3]">{isMockMode ? 'Showcase' : 'Live'}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
        Total Net Worth
      </p>
      {isLoading ? (
        <div className="flex items-center gap-2 h-8">
          <Loader2 size={16} className="text-[#00D4FF] animate-spin" />
          <span className="text-sm text-gray-500">Calculating…</span>
        </div>
      ) : (
        <p className="text-2xl font-bold text-white tracking-tight font-mono">
          ${totalNetWorthUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        Wallet ${walletUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        {defiUsd > 0 ? ` · DeFi $${defiUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : ''}
        {totalEth > 0 ? ` · ${totalEth.toFixed(4)} ETH` : ''}
        {price > 0 ? ` @ $${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : ''}
      </p>
    </div>
  );
};

// ... existing Change24hCard code ...

const Change24hCard: React.FC = () => {
  const { ethPriceUsd, eth24hChangePct: realChange, isLoading: priceLoading } = usePriceData();
  const { isMockMode } = useEnvironment();
  const { assets } = useOnChainBalances();

  const eth24hChangePct = isMockMode ? 2.45 : realChange;
  const ethAsset = assets.find((a) => a.symbol === 'ETH' || a.symbol === 'WETH');
  const totalEth = ethAsset?.balance ?? 0;
  const price = ethPriceUsd || ethAsset?.price || 0;

  const dollarChange = totalEth * price * (eth24hChangePct / 100);
  const isPositive = eth24hChangePct >= 0;

  const pctDisplay = (priceLoading && !isMockMode)
    ? '…'
    : `${isPositive ? '+' : ''}${eth24hChangePct.toFixed(2)}%`;

  const dollarDisplay = (priceLoading && !isMockMode)
    ? undefined
    : `${isPositive ? '+' : ''}$${Math.abs(dollarChange).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div
      className="group relative rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
      style={{
        background: `linear-gradient(135deg, ${isPositive ? 'rgba(0,255,163,0.12)' : 'rgba(255,71,87,0.10)'} 0%, ${isPositive ? 'rgba(0,255,163,0.04)' : 'rgba(255,71,87,0.03)'} 100%)`,
        border: `1px solid ${isPositive ? 'rgba(0,255,163,0.15)' : 'rgba(255,71,87,0.15)'}`,
      }}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${isPositive ? 'rgba(0,255,163,0.12)' : 'rgba(255,71,87,0.10)'} 0%, transparent 100%)`,
          filter: 'blur(20px)',
          zIndex: -1,
        }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${isPositive ? 'rgba(0,255,163,0.15)' : 'rgba(255,71,87,0.15)'}`,
          }}
        >
          {isPositive
            ? <TrendingUp size={20} className="text-[#00FFA3]" />
            : <TrendingDown size={20} className="text-[#FF4757]" />}
        </div>
        {dollarDisplay && (
          <div className="flex items-center gap-1">
            {isPositive
              ? <ArrowUpRight size={14} className="text-[#00FFA3]" />
              : <ArrowDownRight size={14} className="text-[#FF4757]" />}
            <span className={`text-xs font-medium ${isPositive ? 'text-[#00FFA3]' : 'text-[#FF4757]'}`}>
              {dollarDisplay}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Portfolio 24h</p>
      {priceLoading && !isMockMode ? (
        <div className="flex items-center gap-2 h-8">
          <Loader2 size={16} className="text-[#00FFA3] animate-spin" />
          <span className="text-sm text-gray-500">Fetching…</span>
        </div>
      ) : (
        <p className={`text-2xl font-bold tracking-tight font-mono ${isPositive ? 'text-[#00FFA3]' : 'text-[#FF4757]'}`}>
          {pctDisplay}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        ETH · {price > 0
          ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '—'}
      </p>
    </div>
  );
};

// ... existing DefiMetricCards code ...

const DefiMetricCards: React.FC = () => {
  const { data: agentData, isLoading: agentLoading } = useAgentData();
  const { isMockMode } = useEnvironment();
  const { positions, isLoading: posLoading } = useDeFiPositions();

  const positionsCount = isMockMode
    ? 3
    : (positions.length || agentData?.positions_found || 0);
  const positionsLoading = !isMockMode && posLoading;

  const opportunities = agentData?.opportunities ?? [];
  const bestApy = opportunities.length > 0
    ? Math.max(...opportunities.map((o) => o.target_apy)).toFixed(1) + '%'
    : (isMockMode ? '60.4%' : null);

  const positionSubtitle = isMockMode
    ? 'Across 3 protocols'
    : positionsCount > 0
      ? `On ${[...new Set(positions.map((p) => p.protocol))].length || 1} protocol(s)`
      : 'No open positions';

  return (
    <>
      <div
        className="group relative rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%)',
          border: '1px solid rgba(139,92,246,0.15)',
        }}
      >
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%)',
            filter: 'blur(20px)',
            zIndex: -1,
          }}
        />
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(139,92,246,0.15)',
            }}
          >
            <Layers size={20} style={{ color: 'rgba(139,92,246,1)' }} />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpRight size={14} className="text-[#00FFA3]" />
            <span className="text-xs font-medium text-[#00FFA3]">
              {isMockMode ? '3 vaults' : 'Base'}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
          Active DeFi Positions
        </p>
        <p className="text-2xl font-bold text-white tracking-tight font-mono">
          {positionsLoading ? '…' : `${positionsCount}`}
        </p>
        <p className="text-xs text-gray-500 mt-1">{positionSubtitle}</p>
      </div>

      <BestApyCard
        value={bestApy}
        loading={!isMockMode && agentLoading}
        opportunitiesCount={opportunities.length}
        subtitle={
          isMockMode
            ? 'Showcase opportunities'
            : agentLoading
              ? 'Fetching…'
              : bestApy
                ? 'from agent scan'
                : 'Connect & disable Showcase to scan'
        }
      />
    </>
  );
};

// ── Shared APY Card (with animation) ──────────────────────────────────────────

const BestApyCard: React.FC<{ value: string | null; loading: boolean; opportunitiesCount: number; subtitle: string }> = ({ value, loading, opportunitiesCount, subtitle }) => {
  const [shouldFlash, setShouldFlash] = useState(false);
  const prevValueRef = useRef<string | null>(null);

  useEffect(() => {
    if (value && prevValueRef.current && value > prevValueRef.current) {
      setShouldFlash(true);
      const timer = setTimeout(() => setShouldFlash(false), 2000);
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <div
      className="group relative rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
      style={{
        background: 'linear-gradient(135deg, rgba(255,184,0,0.12) 0%, rgba(255,184,0,0.04) 100%)',
        border: '1px solid rgba(255,184,0,0.15)',
      }}
    >
      <AnimatePresence>
        {shouldFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: 'rgba(0, 255, 163, 0.15)',
              boxShadow: 'inset 0 0 20px rgba(0, 255, 163, 0.3)',
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(255,184,0,0.12) 0%, rgba(255,184,0,0.04) 100%)',
          filter: 'blur(20px)',
          zIndex: -1,
        }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,184,0,0.15)',
          }}
        >
          <Percent size={20} style={{ color: 'rgba(255,184,0,1)' }} />
        </div>
        {opportunitiesCount > 0 && (
          <div className="flex items-center gap-1">
            <ArrowUpRight size={14} className="text-[#00FFA3]" />
            <span className="text-xs font-medium text-[#00FFA3]">
              {opportunitiesCount} upgrade{opportunitiesCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
        Best Available APY
      </p>
      <p className="text-2xl font-bold text-white tracking-tight font-mono">
        {loading ? '…' : value ?? '—'}
      </p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Card 5 — AI Efficiency Score (Agent 2.0)
// ─────────────────────────────────────────────────────────────────────────────

const EfficiencyCard: React.FC = () => {
  const { data, isLoading, error } = useAgentStrategies();

  const score = data?.analysis?.efficiency_score ?? 0;
  const scoreColor = score > 80 ? '#00FFA3' : score > 50 ? '#FFB800' : '#FF4757';

  return (
    <div
      className="group relative rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 100%)',
        border: '1px solid rgba(0,212,255,0.15)',
      }}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 100%)',
          filter: 'blur(20px)',
          zIndex: -1,
        }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
        >
          <Bot size={20} className="text-[#00D4FF]" />
        </div>
        <div className="flex items-center gap-1">
          <Sparkles size={14} className="text-[#00FFA3]" />
          <span className="text-xs font-medium text-[#00FFA3]">Agent 2.0</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
        AI Efficiency Score
      </p>
      {isLoading ? (
        <div className="flex items-center gap-2 h-8">
          <Loader2 size={16} className="text-[#00D4FF] animate-spin" />
          <span className="text-sm text-gray-500">Analyzing…</span>
        </div>
      ) : error || !data ? (
        <p className="text-2xl font-bold text-gray-600 tracking-tight font-mono">—</p>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold tracking-tight font-mono" style={{ color: scoreColor }}>
            {score}
          </p>
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              className="h-full rounded-full"
              style={{ background: scoreColor }}
            />
          </div>
        </div>
      )}
      <p className="text-[10px] text-gray-500 mt-1 truncate">
        {data?.analysis?.thesis ? `"${data.analysis.thesis}"` : 'Observer syncing…'}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

const MetricsCards: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
    <NetWorthCard />
    <Change24hCard />
    <DefiMetricCards />
    <EfficiencyCard />
  </div>
);

export default MetricsCards;
