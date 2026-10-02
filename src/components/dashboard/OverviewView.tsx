import React from 'react';
import MetricsCards from './MetricsCards';
import PerformanceChart from './PerformanceChart';
import TokenAllocation from './TokenAllocation';
import AssetsTable from './AssetsTable';
import StrategyFeed from './StrategyFeed';
import { useAgentData } from '@/hooks/useAgentData';
import { useOnChainBalances } from '@/hooks/useOnChainBalances';
import { useDeFiPositions } from '@/hooks/useDeFiPositions';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Bot,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useAgentStrategies } from '@/hooks/useAgentStrategies';

const AgentThesis: React.FC = () => {
  const { data, isLoading } = useAgentStrategies();
  if (isLoading) return <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />;
  if (!data) return <p className="text-sm text-gray-500 italic">"Scanning protocols for optimal yield vectors..."</p>;
  return (
    <p className="text-base text-gray-300 leading-relaxed italic">
      "{data.analysis.thesis}"
    </p>
  );
};

interface OverviewViewProps {
  onNavigate: (nav: 'defi') => void;
}

// ── Chain colour palette (matches DeFiView) ───────────────────────────────────

const CHAIN_COLORS: Record<string, string> = {
  Base: '#0052FF',
  Ethereum: '#627EEA',
  Arbitrum: '#28A0F0',
  Optimism: '#FF0420',
  Polygon: '#8247E5',
  'BNB Chain': '#F0B90B',
  Avalanche: '#E84142',
  Gnosis: '#048848',
  Linea: '#61DFFF',
  Scroll: '#FFDBB5',
};
const FALLBACK_COLORS = ['#00D4FF', '#00FFA3', '#8B5CF6', '#FFB800', '#FF7A45', '#A78BFA'];

function chainColor(name: string, idx: number) {
  return CHAIN_COLORS[name] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

// ── Recharts custom tooltip ───────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}

const ChainTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: inner } = payload[0];
  return (
    <div
      className="text-xs rounded-xl px-3 py-2 shadow-xl"
      style={{ background: '#0F1338', border: `1px solid ${inner.color}40` }}
    >
      <p className="font-semibold text-white">{name}</p>
      <p className="font-mono text-gray-300">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    </div>
  );
};

// ── Network Distribution Chart ────────────────────────────────────────────────

const NetworkDistribution: React.FC<{
  byChain: Record<string, number>;
  onNavigate: (nav: 'defi') => void;
}> = ({ byChain, onNavigate }) => {
  const total = Object.values(byChain).reduce((s, v) => s + v, 0);

  const entries = Object.entries(byChain)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8); // cap at 8 slices for legibility

  const pieData = entries.map(([name, value]) => ({ name, value }));

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{ background: 'linear-gradient(180deg,#0F1338 0%,#0A0E27 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-[#00D4FF]" />
          <h3 className="text-sm font-semibold text-white">Network Distribution</h3>
        </div>
        <button
          onClick={() => onNavigate('defi')}
          className="flex items-center gap-1 text-xs text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors"
        >
          Details <ChevronRight size={12} />
        </button>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <Globe size={28} className="text-gray-700" />
          <p className="text-xs text-gray-500 text-center">
            No DeFi positions found.<br />
            <span className="text-gray-600">
              No positions detected on tracked chains.
            </span>
          </p>
        </div>
      ) : (
        <>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={entry.name} fill={chainColor(entry.name, idx)} />
                  ))}
                </Pie>
                <Tooltip content={<ChainTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 mt-2">
            {entries.map(([name, value], idx) => {
              const color = chainColor(name, idx);
              const pct = ((value / total) * 100).toFixed(1);
              return (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-gray-400 flex-1 truncate">{name}</span>
                  <span className="text-[10px] text-gray-600 font-mono">{pct}%</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────

const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { isMockMode } = useEnvironment();
  const { data: agentData, isLoading: agentLoading, isError: agentError } = useAgentData();
  const { assets, isLoading: balLoading } = useOnChainBalances();
  const { positions, isLoading: posLoading } = useDeFiPositions();

  const walletUsd = assets.reduce((sum, a) => sum + a.usdValue, 0);
  const defiUsd = positions.reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  const portfolioUsd = walletUsd + defiUsd;

  const nativeByChain = isMockMode
    ? {
        Base: portfolioUsd * 0.85,
        Ethereum: portfolioUsd * 0.1,
        Arbitrum: portfolioUsd * 0.05,
      }
    : {
        Base: portfolioUsd,
      };

  const isChainLoading = !isMockMode && (balLoading || posLoading);

  const opportunities = agentData?.opportunities?.slice(0, 4) ?? [];
  const colors = ['#00D4FF', '#00FFA3', '#8B5CF6', '#FFB800'];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <MetricsCards />

      {/* Strategic Highlights — Agent 2.0 */}
      <div 
        className="rounded-2xl p-6 relative overflow-hidden group"
        style={{ 
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(0, 255, 163, 0.05) 100%)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
        }}
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Bot size={120} className="text-[#00D4FF]" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-[#00FFA3]" />
              <span className="text-[10px] font-bold text-[#00FFA3] uppercase tracking-widest">Strategic Intelligence Active</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Success Glow Thesis</h2>
            <AgentThesis />
          </div>
          <div className="flex-shrink-0">
             <button 
               onClick={() => onNavigate('defi')}
               className="px-6 py-3 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-sm font-bold hover:bg-[#00D4FF]/20 transition-all flex items-center gap-2"
             >
               Optimize Portfolio
               <ChevronRight size={16} />
             </button>
          </div>
        </div>
      </div>

      {/* Charts row — Performance | TokenAllocation | Network Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <PerformanceChart />
        </div>
        <div className="xl:col-span-1">
          <TokenAllocation />
        </div>
        <div className="xl:col-span-2">
          {isChainLoading ? (
            <div
              className="rounded-2xl p-5 h-full flex items-center justify-center gap-3"
              style={{ background: 'linear-gradient(180deg,#0F1338 0%,#0A0E27 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Loader2 size={16} className="animate-spin text-[#00D4FF]" />
              <span className="text-sm text-gray-500">Fetching native chain distributions…</span>
            </div>
          ) : (
            <NetworkDistribution
              byChain={portfolioUsd > 0 ? nativeByChain : {}}
              onNavigate={onNavigate}
            />
          )}
        </div>
      </div>

      {/* Assets Table */}
      <AssetsTable />

      {/* DeFi Opportunities Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">DeFi Upgrade Opportunities</h3>
          <button
            onClick={() => onNavigate('defi')}
            className="flex items-center gap-1 text-xs text-[#00D4FF] hover:text-[#00D4FF]/80 font-medium transition-colors"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {agentLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <Loader2 size={16} className="animate-spin text-[#00D4FF]" />
            <span className="text-sm text-gray-500">Agent scanning DeFi positions…</span>
          </div>
        ) : agentError || opportunities.length === 0 ? (
          <div
            className="flex items-center justify-center gap-3 py-8 rounded-xl"
            style={{ background: 'rgba(15,20,50,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {agentError
              ? <AlertTriangle size={16} className="text-[#FFB800]" />
              : <Bot size={16} className="text-gray-600" />}
            <p className="text-sm text-gray-500">
              {agentError
                ? 'Agent offline — start python -m uvicorn main:app to scan'
                : 'No upgrade opportunities detected at this time.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {opportunities.map((opp, i) => {
              const color = colors[i % colors.length];
              return (
                <div
                  key={i}
                  className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                  style={{ background: 'rgba(15,20,50,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                      <Bot size={14} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{opp.target_protocol}</p>
                      <p className="text-[10px] text-gray-500">{opp.token}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Target APY</span>
                    <span className="text-sm font-mono font-bold text-[#00FFA3]">{opp.target_apy.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Value</span>
                    <span className="text-xs font-mono text-gray-300">
                      ${opp.amount_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Upgrade</span>
                    <span className="text-[10px] font-mono text-[#00FFA3]">
                      +{(opp.upgrade_apy_bps / 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strategy Intelligence Feed Row */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-4 h-[400px]">
          <StrategyFeed />
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
