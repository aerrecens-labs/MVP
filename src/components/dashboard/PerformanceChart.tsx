/**
 * PerformanceChart — Portfolio value over time.
 *
 * Data source: CoinGecko free public API (ETH price history × ETH balance).
 * No hardcoded/simulated values — all numbers reflect real market prices.
 */

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Maximize2, Loader2, AlertTriangle } from 'lucide-react';
import { useOnChainBalances } from '@/hooks/useOnChainBalances';
import { useDeFiPositions } from '@/hooks/useDeFiPositions';
import { usePortfolioHistory } from '@/hooks/usePortfolioHistory';
import { usePriceData } from '@/hooks/usePriceData';

type TimeRange = '24H' | '7D' | '30D' | '90D' | '1Y' | 'ALL';
const TIME_RANGES: TimeRange[] = ['24H', '7D', '30D', '90D', '1Y', 'ALL'];

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { price: number } }[];
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { value, payload: inner } = payload[0];
  return (
    <div
      className="rounded-lg px-4 py-3 shadow-xl"
      style={{
        background: 'linear-gradient(135deg, #141836 0%, #0F1230 100%)',
        border: '1px solid rgba(0,212,255,0.2)',
      }}
    >
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-white font-mono">
        ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="text-[11px] text-gray-500 mt-0.5">
        ETH ${inner.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const PerformanceChart: React.FC = () => {
  const [activeRange, setActiveRange] = useState<TimeRange>('30D');

  const { ethPriceUsd } = usePriceData();
  const { assets, isLoading: balLoading } = useOnChainBalances();
  const { positions, isLoading: posLoading } = useDeFiPositions();

  const ethAsset = assets.find((a) => a.symbol === 'ETH' || a.symbol === 'WETH');
  const walletEth = ethAsset?.balance ?? 0;
  const defiUsd = positions.reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  const price = ethPriceUsd || ethAsset?.price || 0;
  const syntheticEthFromDeFi = price > 0 ? defiUsd / price : 0;
  const aggregateEthBalance = walletEth + syntheticEthFromDeFi;

  const { data, isLoading: historyLoading, isError, changePercent, changeDollar } =
    usePortfolioHistory(aggregateEthBalance, activeRange);

  const isLoading = balLoading || posLoading || historyLoading;

  const isPositive = (changePercent ?? 0) >= 0;

  // Y-axis formatter — auto-scale to k or cents
  const yFormatter = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    if (val < 1 && val > 0) return `$${val.toFixed(3)}`;
    return `$${val.toFixed(2)}`;
  };

  return (
    <div
      className="rounded-xl p-5 h-full"
      style={{
        background: 'rgba(15, 20, 50, 0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#00D4FF]/10 flex-shrink-0">
            {isPositive
              ? <TrendingUp size={18} className="text-[#00D4FF]" />
              : <TrendingDown size={18} className="text-[#FF4757]" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-white whitespace-nowrap">Portfolio Performance</h3>
              {/* Change badge */}
              {changePercent !== null && !isLoading && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{
                    background: isPositive ? 'rgba(0,255,163,0.1)' : 'rgba(255,71,87,0.1)',
                    color: isPositive ? '#00FFA3' : '#FF4757',
                    border: isPositive ? '1px solid rgba(0,255,163,0.15)' : '1px solid rgba(255,71,87,0.15)',
                  }}
                >
                  {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {isLoading
                ? 'Analysing market history…'
                : isError
                  ? 'Historical data sync failed'
                  : changeDollar !== null
                    ? `${isPositive ? '+' : ''}$${Math.abs(changeDollar).toLocaleString(undefined, { maximumFractionDigits: 2 })} this period`
                    : 'EOA + Smart Account + DeFi Performance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Range buttons container */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5 shadow-inner">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${activeRange === range
                  ? 'bg-[#00D4FF]/15 text-[#00D4FF] shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] text-gray-500 hover:text-gray-300 transition-all">
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="h-[280px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin text-[#00D4FF]" />
            <span className="text-sm">Fetching price history…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
            <AlertTriangle size={20} className="text-[#FFB800]" />
            <p className="text-sm">Failed to load price data</p>
            <p className="text-xs text-gray-600">CoinGecko may be rate-limiting — try again shortly</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            No data available for this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#00D4FF' : '#FF4757'} stopOpacity={0.3} />
                  <stop offset="50%" stopColor={isPositive ? '#00D4FF' : '#FF4757'} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={isPositive ? '#00D4FF' : '#FF4757'} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={isPositive ? '#00D4FF' : '#FF4757'} />
                  <stop offset="100%" stopColor={isPositive ? '#00FFA3' : '#FF7A45'} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4a5568', fontSize: 11 }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4a5568', fontSize: 11 }}
                tickFormatter={yFormatter}
                dx={-10}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="url(#lineGradient)"
                strokeWidth={2.5}
                fill="url(#portfolioGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#00D4FF', stroke: '#0A0E27', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;
