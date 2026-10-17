import React, { useMemo } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useDeFiPositions, type DiscoveredPosition } from '@/hooks/useDeFiPositions';
import { useOnChainBalances } from '@/hooks/useOnChainBalances';
import {
  Layers,
  DollarSign,
  TrendingUp,
  Globe,
  Loader2,
  RefreshCw,
  Bot,
} from 'lucide-react';

const CHAIN_COLORS: Record<string, string> = {
  Base: '#0052FF',
  Ethereum: '#627EEA',
  default: '#00D4FF',
};

function chainColor(name: string) {
  return CHAIN_COLORS[name] ?? CHAIN_COLORS.default;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── DeFi Position Card ────────────────────────────────────────────────────────

const DeFiPositionCard: React.FC<{ pos: DiscoveredPosition }> = ({ pos }) => {
  const isAerodrome = pos.protocol.includes('Aerodrome');
  const isUniswap = pos.protocol.includes('Uniswap');
  const hasGlow = (isAerodrome || isUniswap) && pos.valueUsd > 0;

  const metadata = pos.metadata;
  const priceRange = metadata ? `${fmt(metadata.priceLower)} - ${fmt(metadata.priceUpper)}` : "";
  const currentPrice = metadata ? fmt(metadata.currentPrice) : "";
  const split0 = metadata ? `${fmt(metadata.amount0)} ${metadata.symbol0}` : "";
  const split1 = metadata ? `${fmt(metadata.amount1)} ${metadata.symbol1}` : "";

  return (
    <div
      className={`rounded-2xl p-5 relative overflow-hidden transition-all duration-500 hover:-translate-y-1 ${hasGlow ? 'border-transparent' : 'border-white/[0.05]'}`}
      style={{
        background: 'rgba(15, 20, 50, 0.6)',
        borderWidth: '1px',
        borderStyle: 'solid',
        ...(hasGlow ? {
          boxShadow: '0 0 20px rgba(0, 255, 163, 0.15), inset 0 0 20px rgba(0, 255, 163, 0.02)',
          borderColor: 'rgba(0, 255, 163, 0.4)',
        } : {})
      }}
    >
      {hasGlow && (
        <div className="absolute top-0 right-0 p-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/20 shadow-[0_0_10px_rgba(0,255,163,0.2)]">
            <Bot size={12} className="text-[#00FFA3]" />
            <span className="text-[10px] font-bold text-[#00FFA3] uppercase tracking-wider">Active Yield</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-xl">
          {isAerodrome ? '✈️' : isUniswap ? '🦄' : '🏦'}
        </div>
        <div>
          <h4 className="text-base font-bold text-white leading-tight">{pos.protocol}</h4>
          <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {metadata?.tokenId || 'Pool'}</p>
        </div>
      </div>

      <div className="space-y-4 mb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Position Value</p>
            <p className="text-xl font-mono font-bold text-white">${fmt(pos.valueUsd)}</p>
          </div>
          {pos.apy > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Current APR</p>
              <p className="text-sm font-mono font-bold text-[#00FFA3]">{pos.apy.toFixed(2)}%</p>
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-3">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400 font-medium">Price Range</span>
            <span className="text-[#00FFA3] font-mono">{priceRange}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400 font-medium">Asset Split</span>
            <div className="text-right font-mono">
              <p className="text-white text-[10px]">{split0}</p>
              <p className="text-white text-[10px] mt-0.5">{split1}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/5 text-[#00D4FF]">
          ON-CHAIN VERIFIED
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#0052FF]" />
          <span className="text-xs text-gray-400">Base</span>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const DeFiView: React.FC = () => {
  const { positions, isLoading: defiLoading, refetch: refetchDeFi } = useDeFiPositions();
  const { assets, isLoading: balancesLoading } = useOnChainBalances();

  const totalDeFiValue = useMemo(() => positions.reduce((sum, p) => sum + p.valueUsd, 0), [positions]);
  const totalWalletValue = useMemo(() => assets.reduce((sum, a) => sum + a.usdValue, 0), [assets]);
  const totalValue = totalDeFiValue + totalWalletValue;

  const summaryCards = [
    {
      label: 'Portfolio Value',
      value: `$${fmt(totalValue)}`,
      sub: `Wallet: $${fmt(totalWalletValue)}`,
      icon: DollarSign,
      color: '#00D4FF',
    },
    {
      label: 'DeFi Positions',
      value: `${positions.length}`,
      sub: 'Active Liquidity',
      icon: Layers,
      color: '#00FFA3',
    },
    {
      label: 'Network',
      value: 'Base',
      sub: 'Mainnet 8453',
      icon: Globe,
      color: '#8B5CF6',
    },
    {
      label: 'Portfolio APR',
      value: positions.length > 0 ? `${(positions.reduce((acc, p) => acc + (p.apy * p.valueUsd), 0) / totalDeFiValue).toFixed(1)}%` : '0%',
      sub: 'Weighted Average',
      icon: TrendingUp,
      color: '#FFB800',
    },
  ];

  const handleRefresh = () => {
    refetchDeFi();
  };

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl p-4 transition-all hover:bg-white/[0.02] cursor-default"
              style={{ background: `${card.color}08`, border: `1px solid ${card.color}15` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color: card.color }} />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{card.label}</span>
              </div>
              <p className="text-xl font-bold text-white font-mono">{card.value}</p>
              <p className="text-[10px] text-gray-500 mt-1 font-medium">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers size={14} className="text-[#00D4FF]" />
          Direct On-Chain Positions
          <span className="text-[10px] text-gray-500 font-normal ml-1">
            (Strict Ethers.js + wagmi Discovery)
          </span>
        </h3>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-[#00D4FF] transition-all bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5"
        >
          <RefreshCw size={11} className={defiLoading ? 'animate-spin' : ''} />
          Sync Blockchain
        </button>
      </div>

      {defiLoading && positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
          <Loader2 size={24} className="animate-spin text-[#00D4FF]" />
          <div className="text-center">
            <p className="text-sm text-gray-400 font-medium">Scanning Base Mainnet...</p>
            <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest font-bold">Bypassing rate-limited APIs</p>
          </div>
        </div>
      ) : positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl bg-white/[0.01] border border-white/[0.03] text-center">
          <Globe size={40} className="text-gray-800" />
          <div>
            <p className="text-sm text-gray-500 font-medium">No DeFi positions discovered on-chain.</p>
            <p className="text-xs text-gray-600 mt-1 max-w-xs">Confirm your LPs are correctly provisioned in Aerodrome or Uniswap on Base Mainnet.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {positions.map((pos) => (
            <DeFiPositionCard key={pos.id} pos={pos} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeFiView;
