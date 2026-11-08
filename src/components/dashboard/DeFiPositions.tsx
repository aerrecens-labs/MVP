import React, { useState } from 'react';
import { useAgentData, type AgentOpportunity } from '@/hooks/useAgentData';
import {
  Droplets,
  ArrowUpDown,
  Shield,
  Coins,
  ExternalLink,
  Layers,
  Loader2,
  AlertTriangle,
  Bot,
  RefreshCw,
} from 'lucide-react';

type FilterType = 'all' | 'liquidity' | 'lending' | 'borrowing' | 'staking';

const filterOptions: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'liquidity', label: 'Liquidity' },
  { id: 'lending', label: 'Lending' },
  { id: 'borrowing', label: 'Borrowing' },
  { id: 'staking', label: 'Staking' },
];

const typeIcons: Record<string, React.ElementType> = {
  liquidity: Droplets,
  lending: ArrowUpDown,
  borrowing: ArrowUpDown,
  staking: Coins,
};

const typeColors: Record<string, string> = {
  liquidity: '#00D4FF',
  lending: '#00FFA3',
  borrowing: '#FFB800',
  staking: '#8B5CF6',
};

// ── Opportunity Card ─────────────────────────────────────────────────────────

const OpportunityCard: React.FC<{ opp: AgentOpportunity; index: number }> = ({ opp, index }) => {
  const apyUpgradePct = (opp.upgrade_apy_bps / 100).toFixed(2);
  const targetApyPct = opp.target_apy.toFixed(2);
  const currentApyPct = opp.current_apy.toFixed(2);
  const colors = ['#00D4FF', '#00FFA3', '#8B5CF6', '#FFB800', '#FF4757'];
  const color = colors[index % colors.length];

  return (
    <div
      className="rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
      style={{
        background: 'rgba(15, 20, 50, 0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            <Bot size={18} style={{ color }} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{opp.target_protocol}</h4>
            <p className="text-xs text-gray-500">Token: {opp.token}</p>
          </div>
        </div>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(0,255,163,0.1)',
            color: '#00FFA3',
          }}
        >
          +{apyUpgradePct}% APY
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">From</span>
          <span className="text-xs text-gray-300">{opp.current_protocol} ({currentApyPct}% APY)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">To</span>
          <span className="text-xs text-[#00FFA3] font-medium">{opp.target_protocol} ({targetApyPct}% APY)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Position Size</span>
          <span className="text-sm font-mono font-bold text-white">
            ${opp.amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <Shield size={10} />
            Base Sepolia
          </span>
          <a
            href="https://sepolia.basescan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#00D4FF] hover:text-[#00D4FF]/80 font-medium transition-colors"
          >
            View
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};

// ── Empty / Loading states ────────────────────────────────────────────────────

const EmptyState: React.FC<{ isError: boolean; errorMsg: string; onRefresh: () => void }> = ({
  isError,
  errorMsg,
  onRefresh,
}) => (
  <div
    className="flex flex-col items-center justify-center gap-4 py-16 rounded-xl"
    style={{
      background: 'rgba(15, 20, 50, 0.5)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    {isError ? (
      <>
        <AlertTriangle size={32} className="text-[#FFB800]" />
        <div className="text-center">
          <p className="text-sm text-white font-medium mb-1">Agent Offline</p>
          <p className="text-xs text-gray-500 max-w-xs">
            {errorMsg || 'Start the Zeinyra Agent (python -m uvicorn main:app) to scan your DeFi positions.'}
          </p>
        </div>
      </>
    ) : (
      <>
        <Bot size={32} className="text-gray-600" />
        <div className="text-center">
          <p className="text-sm text-white font-medium mb-1">No Opportunities Found</p>
          <p className="text-xs text-gray-500 max-w-xs">
            The agent scanned your portfolio and found no upgrade opportunities at this time.
          </p>
        </div>
      </>
    )}
    <button
      onClick={onRefresh}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-[#00D4FF] bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 transition-all"
    >
      <RefreshCw size={12} />
      Re-scan
    </button>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const DeFiPositions: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const { data, isLoading, isError, error, refetch } = useAgentData();

  const opportunities = data?.opportunities ?? [];
  const positionsFound = data?.positions_found ?? 0;

  // Agent returns opportunities (not positions directly); show them all under 'all'
  const filtered = filter === 'all' ? opportunities : opportunities;

  const totalUpgradeValue = opportunities.reduce((sum, o) => sum + o.amount_usd, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10">
            <Layers size={16} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">DeFi Upgrade Opportunities</h3>
            <p className="text-xs text-gray-500">
              {isLoading
                ? 'Scanning via Zeinyra Agent…'
                : isError
                  ? 'Agent offline — run python -m uvicorn main:app'
                  : `${positionsFound} positions scanned · ${opportunities.length} upgrades found · $${totalUpgradeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} potential`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${filter === opt.id
                    ? 'bg-[#00D4FF]/15 text-[#00D4FF]'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            title="Re-scan"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-gray-500 hover:text-[#00D4FF] transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-16 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <Loader2 size={20} className="text-[#00D4FF] animate-spin" />
          <span className="text-sm text-gray-400">Agent scanning DeFi positions…</span>
        </div>
      ) : (filtered.length === 0 || isError) ? (
        <EmptyState
          isError={isError}
          errorMsg={error?.message ?? ''}
          onRefresh={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((opp, i) => (
            <OpportunityCard key={i} opp={opp} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeFiPositions;
