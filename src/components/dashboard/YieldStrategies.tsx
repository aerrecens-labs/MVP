import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import {
  TrendingUp, Shield, Zap, AlertTriangle, CheckCircle2, Info,
  ArrowRight, Bot, Loader2, ExternalLink, RefreshCw, Activity,
  Sparkles, Target, Layers, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  INTENT_REGISTRY_ADDRESS,
  SESSION_MODULE_ADDRESS,
  intentRegistryAbi,
  sessionModuleAbi,
  AGENT_ID,
} from '@/constants/contracts';
import { useAgentStrategies, AgentOpportunityItem, SplitEntry } from '@/hooks/useAgentStrategies';
import { useAgentSession } from '@/hooks/useAgentSession';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useWallet } from '@/contexts/WalletContext';

const AGENT_BASE_URL = import.meta.env.VITE_AGENT_API_URL ?? 'http://localhost:8000';

// ── Risk Config ────────────────────────────────────────────────────────────────

const riskConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  low:    { bg: 'rgba(0,255,163,0.08)',  text: '#00FFA3', border: 'rgba(0,255,163,0.25)',  label: 'Low Risk' },
  medium: { bg: 'rgba(255,184,0,0.08)',  text: '#FFB800', border: 'rgba(255,184,0,0.25)',  label: 'Medium Risk' },
  high:   { bg: 'rgba(255,71,87,0.08)',  text: '#FF4757', border: 'rgba(255,71,87,0.25)',  label: 'High Risk' },
};

// ── WebSocket scanning status type ────────────────────────────────────────────
type ScanStatus = 'idle' | 'scanning' | 'found' | 'ai_check' | 'split' | 'locked' | 'error';

// ── Target APY Control ────────────────────────────────────────────────────────
// Dual-input: slider (0–1000) + numeric input. Sends SET_TARGET_APY over WebSocket.

interface TargetApyControlProps {
  initialValue: number;
  onStatusUpdate: (status: ScanStatus, msg: string, data?: unknown) => void;
}

const TargetApyControl: React.FC<TargetApyControlProps> = ({ initialValue, onStatusUpdate }) => {
  const [targetApy, setTargetApy] = useState(Math.round(initialValue));
  const [inputRaw, setInputRaw] = useState(String(Math.round(initialValue)));
  const wsRef = useRef<WebSocket | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const connectAndSend = useCallback((value: number) => {
    onStatusUpdate('scanning', `Target Locked. Scanning for ${value}% APY opportunities across Base...`);
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      const wsUrl = AGENT_BASE_URL.replace(/^http/, 'ws') + '/chat';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'SET_TARGET_APY', value }));
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          switch (msg.type) {
            case 'TARGET_LOCKED':
              onStatusUpdate('locked', msg.response);
              break;
            case 'APY_FOUND':
              onStatusUpdate('found', msg.message, msg.opportunity);
              break;
            case 'SPLIT_SUGGESTED':
              onStatusUpdate('split', msg.message, msg.split_strategy);
              break;
            case 'AI_VERDICT':
              onStatusUpdate('ai_check', msg.verdict);
              break;
            case 'STATUS':
              if (msg.status === 'SCANNING') onStatusUpdate('scanning', msg.message);
              if (msg.status === 'AI_CHECK') onStatusUpdate('ai_check', msg.message);
              break;
            default:
              break;
          }
        } catch { /* ignore */ }
      };

      ws.onerror = () => onStatusUpdate('error', 'WebSocket error. Check agent backend.');
      ws.onclose = () => {};
    } catch (e) {
      onStatusUpdate('error', 'Could not connect to agent backend.');
    }
  }, [onStatusUpdate]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setTargetApy(v);
    setInputRaw(String(v));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => connectAndSend(v), 600);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputRaw(e.target.value);
    const v = Number(e.target.value);
    if (!isNaN(v) && v >= 0 && v <= 1000) {
      setTargetApy(v);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => connectAndSend(v), 600);
    }
  };

  const apyColor = targetApy > 200 ? '#FF4757' : targetApy > 50 ? '#FFB800' : '#00FFA3';

  return (
    <div
      className="rounded-xl p-5 mb-6"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Target size={15} className="text-[#00D4FF]" />
        <h4 className="text-sm font-bold text-white uppercase tracking-tight">Set Yield Target</h4>
        <span className="ml-auto text-[10px] text-gray-500">Triggers live agent scan</span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        {/* Slider */}
        <div className="flex-1 relative">
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={targetApy}
            onChange={handleSliderChange}
            style={{ accentColor: apyColor }}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10"
          />
          <div
            className="absolute top-0 left-0 h-1.5 rounded-full pointer-events-none transition-all duration-200"
            style={{ width: `${(targetApy / 1000) * 100}%`, background: apyColor, opacity: 0.5 }}
          />
        </div>

        {/* Numeric Input */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={1000}
            value={inputRaw}
            onChange={handleInputChange}
            className="w-20 bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1.5 text-sm font-mono text-right text-white focus:outline-none focus:border-[#00D4FF]/40"
          />
          <span className="text-sm text-gray-400 font-mono">%</span>
        </div>

        {/* APY Badge */}
        <div
          className="px-3 py-1.5 rounded-lg text-sm font-black font-mono min-w-[72px] text-center"
          style={{ background: `${apyColor}15`, border: `1px solid ${apyColor}30`, color: apyColor }}
        >
          {targetApy}%
        </div>
      </div>

      <div className="flex gap-3">
        {[0, 15, 50, 100, 342, 1000].map(v => (
          <button
            key={v}
            onClick={() => { setTargetApy(v); setInputRaw(String(v)); connectAndSend(v); }}
            className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all"
          >
            {v}%
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Scan Status Banner ────────────────────────────────────────────────────────

const ScanStatusBanner: React.FC<{ status: ScanStatus; message: string }> = ({ status, message }) => {
  if (status === 'idle') return null;

  const configs: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
    scanning:  { color: '#00D4FF', bg: 'rgba(0,212,255,0.06)', icon: <Loader2 size={13} className="animate-spin" /> },
    locked:    { color: '#00D4FF', bg: 'rgba(0,212,255,0.06)', icon: <Target size={13} /> },
    found:     { color: '#00FFA3', bg: 'rgba(0,255,163,0.06)', icon: <CheckCircle2 size={13} /> },
    ai_check:  { color: '#FFB800', bg: 'rgba(255,184,0,0.06)', icon: <Sparkles size={13} /> },
    split:     { color: '#9B59B6', bg: 'rgba(155,89,182,0.06)', icon: <Layers size={13} /> },
    error:     { color: '#FF4757', bg: 'rgba(255,71,87,0.06)', icon: <AlertTriangle size={13} /> },
  };

  const cfg = configs[status] ?? configs.scanning;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 px-4 py-3 rounded-xl mb-4 text-xs"
      style={{ background: cfg.bg, border: `1px solid ${cfg.color}25`, color: cfg.color }}
    >
      {cfg.icon}
      <span className="leading-relaxed">{message}</span>
    </motion.div>
  );
};

// ── Opportunity Card ──────────────────────────────────────────────────────────

const OpportunityCard: React.FC<{
  opp: AgentOpportunityItem;
  onDeposit: (opp: AgentOpportunityItem) => void;
}> = ({ opp, onDeposit }) => {
  const risk = riskConfig[opp.risk_level] ?? riskConfig.high;
  const isRec = opp.is_recommended;
  const trustTier = opp.trust_tier ?? 3;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
      style={{
        background: isRec
          ? 'linear-gradient(135deg, rgba(255,184,0,0.06) 0%, rgba(255,140,0,0.03) 100%)'
          : 'rgba(15,20,50,0.5)',
        border: isRec ? '1px solid rgba(255,184,0,0.35)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isRec ? '0 0 24px rgba(255,184,0,0.08)' : 'none',
      }}
    >
      {/* Recommended glow overlay */}
      {isRec && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse at top, rgba(255,184,0,0.08) 0%, transparent 70%)',
          }}
        />
      )}

      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <h4 className="text-sm font-bold text-white truncate">{opp.pair}</h4>
              {isRec && (
                <span
                  className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)' }}
                >
                  <Star size={7} className="fill-[#FFB800]" />
                  Zeinyra Recommended
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500">{opp.protocol}</p>
          </div>
          
          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
            <span
               className="text-[10px] font-bold px-2 py-0.5 rounded-full"
               style={{ background: risk.bg, color: risk.text, border: `1px solid ${risk.border}` }}
            >
              {risk.label}
            </span>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
              Trust Tier {trustTier}
            </span>
          </div>
        </div>

        {/* APY Display */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1">
             <span
               className="text-3xl font-black font-mono leading-none"
               style={{ color: opp.risk_level === 'high' ? '#FF4757' : opp.risk_level === 'medium' ? '#FFB800' : '#00FFA3' }}
             >
               {opp.apy.toFixed(1)}%
             </span>
             <span className="text-xs text-gray-500 font-mono">APY</span>
          </div>
          {opp.security_note && (
             <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <Shield size={10} className="text-gray-400" />
                <span className="text-[9px] text-gray-400 font-medium italic">{opp.security_note}</span>
             </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="space-y-1.5 mb-4 text-[11px]">
          {opp.liquidity_depth > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Pool Liquidity</span>
              <span className="text-gray-300 font-mono">${(opp.liquidity_depth / 1e6).toFixed(1)}M</span>
            </div>
          )}
          {Number(opp.upgrade_apy_bps) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Yield Upgrade</span>
              <span className="text-[#00FFA3] font-mono">+{(opp.upgrade_apy_bps / 100).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {opp.description && (
          <p className="text-[11px] text-gray-400 leading-relaxed mb-4">{opp.description}</p>
        )}

        {/* Action Button */}
        <button
          onClick={() => onDeposit(opp)}
          className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-tighter transition-all hover:brightness-110 active:scale-95"
          style={{
            background: isRec
              ? 'linear-gradient(135deg, rgba(255,184,0,0.2), rgba(255,140,0,0.1))'
              : 'rgba(0,212,255,0.08)',
            border: isRec ? '1px solid rgba(255,184,0,0.3)' : '1px solid rgba(0,212,255,0.2)',
            color: isRec ? '#FFB800' : '#00D4FF',
          }}
        >
          {isRec ? 'Optimize Position' : 'Select Strategy'}
          <ArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  );
};

// ── Section 1: Featured Elite Combo ──────────────────────────────────────────

const FeaturedSplitHero: React.FC<{ 
  splits: SplitEntry[]; 
  targetApy: number; 
  isActive?: boolean; 
  capital?: number 
}> = ({ splits, targetApy, isActive, capital = 0 }) => {
  if (!splits || splits.length === 0) return null;

  const blended = splits.reduce((sum, s) => sum + (s.apy * s.weight_pct) / 100, 0);

  return (
    <div className="relative mb-10">
      {/* Large Featured Heading */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-[#00D4FF]" />
        <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Section 1: The Recommended Split</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(15,20,50,0.8), rgba(10,12,30,0.95))',
          border: '1px solid rgba(0,212,255,0.2)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Success Glow Animation */}
        {isActive && (
           <motion.div
             className="absolute inset-0 pointer-events-none"
             animate={{
               background: [
                 'radial-gradient(circle at 50% 0%, rgba(0,212,255,0.1) 0%, transparent 70%)',
                 'radial-gradient(circle at 50% 0%, rgba(0,212,255,0.2) 0%, transparent 60%)',
                 'radial-gradient(circle at 50% 0%, rgba(0,212,255,0.1) 0%, transparent 70%)'
               ]
             }}
             transition={{ duration: 4, repeat: Infinity }}
           />
        )}

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/30">
                 <Layers size={20} className="text-[#00D4FF]" />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-white leading-tight">Elite Combo Strategy</h3>
                 <p className="text-xs text-gray-500">Mathematically optimized allocation for {targetApy}% target</p>
              </div>
            </div>

            <div className="mb-6">
               <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-black font-mono text-white italic tracking-tighter">
                   ~{blended.toFixed(1)}%
                 </span>
                 <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Expected APY</span>
               </div>
               <p className="text-[10px] text-gray-600 mt-2 leading-relaxed max-w-sm">
                 Our Featured Split prioritizes blue-chip stability while utilizing strategic boosters only to reach the target threshold.
               </p>
            </div>

            <button className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#00D4FF] text-black font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,212,255,0.4)]">
              Register Portfolio Intent
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-bold text-gray-500 uppercase">Capital Allocation Map</span>
               <div className="flex items-center gap-1">
                  <Activity size={10} className="text-[#00FFA3]" />
                  <span className="text-[9px] text-[#00FFA3] font-bold uppercase tracking-widest">Optimized for ${capital.toLocaleString()}</span>
               </div>
            </div>

            {/* Allocation Bar */}
            <div className="flex h-4 rounded-full overflow-hidden mb-6 bg-white/5 border border-white/10">
              {splits.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.weight_pct}%` }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.8 }}
                  style={{
                    background: i === 0 ? '#00FFA3' : '#00D4FF',
                    opacity: 0.85
                  }}
                />
              ))}
            </div>

            <div className="space-y-4">
               {splits.map((s, i) => (
                 <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? '#00FFA3' : '#00D4FF' }} />
                       <div>
                          <p className="text-xs font-bold text-white group-hover:text-[#00D4FF] transition-colors">{s.protocol} {s.pair}</p>
                          <p className="text-[9px] text-gray-500 font-mono italic">Allocation: {s.weight_pct.toFixed(0)}% (${s.amount_usd.toLocaleString()})</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black font-mono text-white">{s.apy.toFixed(1)}%</p>
                       <p className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">Pool APY</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── AI Observer Insights ──────────────────────────────────────────────────────

const ObserverInsights: React.FC = () => {
  const { data, isLoading, error } = useAgentStrategies();

  if (isLoading) {
    return (
      <div className="rounded-xl p-5 mb-6 animate-pulse" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <div className="h-4 w-32 bg-white/5 rounded mb-3" />
        <div className="h-12 w-full bg-white/[0.02] rounded" />
      </div>
    );
  }

  if (error || !data) return null;

  const score = data.analysis.efficiency_score;
  const scoreColor = score > 80 ? '#00FFA3' : score > 50 ? '#FFB800' : '#FF4757';

  return (
    <div
      className="rounded-xl p-5 mb-6 relative overflow-hidden"
      style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#00D4FF]" />
          <h4 className="text-sm font-bold text-white uppercase tracking-tight">AI Observer Insights</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono">NFT ID: {data.agent_id}</span>
          <div className="px-2 py-0.5 rounded bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[9px] font-bold text-[#00D4FF]">
            LIVE SYNC
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="md:col-span-3">
          <p className="text-xs font-medium text-gray-400 leading-relaxed mb-2">Success Glow Thesis</p>
          <p className="text-sm text-white font-medium leading-relaxed italic">"{data.analysis.thesis}"</p>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Efficiency</p>
          <div className="relative flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
              <circle cx="32" cy="32" r="28" stroke={scoreColor} strokeWidth="4" fill="transparent"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - score / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute text-lg font-black font-mono" style={{ color: scoreColor }}>{score}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-600 uppercase font-bold">ETH PRICE</span>
            <span className="text-xs font-mono text-gray-300">${data.eth_price.toLocaleString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-600 uppercase font-bold">VAULT USDC</span>
            <span className="text-xs font-mono text-gray-300">${data.vault_balances.usdc.toLocaleString()}</span>
          </div>
          {data.user_preferences?.min_apy_target > 0 && (
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-600 uppercase font-bold">TARGET APY</span>
              <span className="text-xs font-mono text-[#FFB800]">{data.user_preferences.min_apy_target.toFixed(1)}%</span>
            </div>
          )}
        </div>
        <span className="text-[9px] text-gray-600">Last Updated: {new Date(data.last_updated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

// ── Active Intent Card ────────────────────────────────────────────────────────

const ActiveIntentCard: React.FC = () => {
  const { targetChain } = useEnvironment();
  const { data: intent, isLoading, error } = useReadContract({
    address: INTENT_REGISTRY_ADDRESS,
    abi: intentRegistryAbi,
    functionName: 'activeIntents',
    args: [AGENT_ID],
    chainId: targetChain.id,
  });

  const hasActiveIntent = intent && intent[3] !== undefined &&
    intent[3] > BigInt(Math.floor(Date.now() / 1000));
  const apyPct = intent ? Number(intent[2]) / 100 : 0;
  const deadlineDate = intent ? new Date(Number(intent[3]) * 1000).toLocaleString() : null;

  return (
    <div className="rounded-xl p-5 mb-6" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Bot size={16} className="text-[#00D4FF]" />
        <h4 className="text-sm font-semibold text-white">Active Agent Intent</h4>
        <span className="text-[10px] text-gray-500 ml-auto">Agent ID: {AGENT_ID.toString()}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={14} className="text-[#00D4FF] animate-spin" />
          <span className="text-xs text-gray-400">Reading from IntentRegistry…</span>
        </div>
      ) : error ? (
        <p className="text-xs text-[#FF4757]">Could not read IntentRegistry: {error.message.slice(0, 80)}</p>
      ) : !hasActiveIntent ? (
        <div className="flex items-start gap-2">
          <Info size={13} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            No active intent registered. Set a Target APY above and the agent will register one automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Target Vault</p>
            <p className="text-xs font-mono text-[#00D4FF] break-all">{(intent[0] as string).slice(0, 10)}…{(intent[0] as string).slice(-6)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Min Expected APY</p>
            <p className="text-lg font-bold text-[#00FFA3] font-mono">{apyPct.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Expires</p>
            <p className="text-xs text-gray-300">{deadlineDate}</p>
          </div>
          <div className="sm:col-span-3">
            <a href={`${targetChain.blockExplorers?.default.url}/address/${INTENT_REGISTRY_ADDRESS}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#00D4FF] hover:underline">
              <ExternalLink size={10} />View IntentRegistry on BaseScan
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Agent Panel ───────────────────────────────────────────────────────────────

interface AgentPanelProps {
  isAgentActive?: boolean;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ isAgentActive }) => {
  const { targetChain } = useEnvironment();
  const { eoaAddress } = useWallet();
  const { address: connectedAddress, connector } = useAccount();
  const { hasOperator, isSessionActive, operatorAddress, isLoading: sessionLoading, refetch } = useAgentSession();
  
  // 1. Local state for immediate UI feedback on refresh
  const [localActive, setLocalActive] = useState(() => {
    return localStorage.getItem('Zeinyra_agent_persistent_active') === 'true';
  });

  // 2. Sync local state with backend/on-chain truth when they arrive
  useEffect(() => {
    if (isSessionActive || isAgentActive) {
      setLocalActive(true);
      localStorage.setItem('Zeinyra_agent_persistent_active', 'true');
    }
  }, [isSessionActive, isAgentActive]);

  const agentEnabled = localActive || isSessionActive || !!isAgentActive;

  const { writeContractAsync, isPending: writePending, data: txHash, error: writeError } = useWriteContract();
  const { isLoading: txLoading, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleToggle = async () => {
    if (!eoaAddress || !connector) { alert("Please connect your wallet first."); return; }
    if (!hasOperator) { alert("Agent operator is not configured."); return; }
    
    // Set local state immediately for UX
    setLocalActive(true);
    localStorage.setItem('Zeinyra_agent_persistent_active', 'true');

    // 1. Notify Backend Agent to start its 24h window (Software side)
    try {
      const wsUrl = AGENT_BASE_URL.replace(/^http/, 'ws') + '/chat';
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'ACTIVATE_AGENT' }));
        setTimeout(() => ws.close(), 1000);
      };
    } catch (e) {
      console.warn('Backend activation ping failed:', e);
    }

    // 2. On-chain session creation (if not already active)
    if (isSessionActive) return;
    
    try {
      await writeContractAsync({
        address: SESSION_MODULE_ADDRESS,
        abi: sessionModuleAbi,
        functionName: 'createSession',
        args: [operatorAddress as `0x${string}`, AGENT_ID, 86400n],
        account: eoaAddress,
        chain: targetChain,
      });
    } catch (e) {
      console.error('Session creation failed:', e);
    }
  };

  const isPending = writePending || txLoading || sessionLoading;

  return (
    <div className="rounded-xl p-5 mb-6 transition-all duration-300"
      style={{
        background: agentEnabled ? 'rgba(0,255,163,0.05)' : !hasOperator ? 'rgba(255,184,0,0.03)' : 'rgba(255,255,255,0.03)',
        border: agentEnabled ? '1px solid rgba(0,255,163,0.2)' : !hasOperator ? '1px solid rgba(255,184,0,0.15)' : '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: agentEnabled ? 'rgba(0,255,163,0.12)' : 'rgba(255,255,255,0.05)', border: agentEnabled ? '1px solid rgba(0,255,163,0.25)' : '1px solid rgba(255,255,255,0.08)' }}>
            <Bot size={16} className={agentEnabled ? 'text-[#00FFA3]' : 'text-gray-500'} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Enable AI Agent</p>
              {!hasOperator && (
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-[9px] font-bold text-[#FFB800] bg-[#FFB800]/10 px-1.5 py-0.5 rounded border border-[#FFB800]/20">
                    <AlertTriangle size={8} />CONFIG REQUIRED
                  </span>
                  <button onClick={() => refetch()} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-[#00D4FF] transition-colors">
                    <RefreshCw size={10} className={sessionLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">Grants a 24h session key · Agent ID {AGENT_ID.toString()}</p>
          </div>
        </div>

        <button onClick={handleToggle} disabled={isPending || !connectedAddress}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: agentEnabled ? 'rgba(0,255,163,0.05)' : !hasOperator ? 'rgba(255,184,0,0.08)' : 'rgba(0,212,255,0.08)',
            border: agentEnabled ? '1px solid rgba(0,255,163,0.4)' : !hasOperator ? '1px solid rgba(255,184,0,0.3)' : '1px solid rgba(0,212,255,0.2)',
            color: agentEnabled ? '#00FFA3' : !hasOperator ? '#FFB800' : '#00D4FF',
          }}>
          {isPending ? <Loader2 size={14} className="animate-spin" /> : agentEnabled ? <Zap size={14} /> : <Bot size={14} />}
          {isPending ? 'Syncing…' : agentEnabled ? 'AGENT ACTIVE' : !hasOperator ? 'Register Agent' : 'Authorize 24h Session'}
          {agentEnabled && <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />}
        </button>
      </div>

      {(txSuccess || isSessionActive) && !writeError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[#00FFA3]">
          <CheckCircle2 size={12} />Session active! Agent authorized.
        </div>
      )}
      {!hasOperator && !sessionLoading && (
        <div className="mt-3 p-3 rounded-lg bg-[#FFB800]/5 border border-[#FFB800]/10 flex gap-2">
          <Info size={14} className="text-[#FFB800] mt-0.5" />
          <p className="text-[11px] text-[#FFB800]/80 leading-relaxed">
            Agent Operator not set. Run <code>setAgentOperator(0, 0xBe88...)</code> to configure.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const YieldStrategies: React.FC = () => {
  const { data: strategyData, isLoading, refetch } = useAgentStrategies();
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [splitData, setSplitData] = useState<SplitEntry[]>([]);

  const initialTarget = strategyData?.user_preferences?.min_apy_target ?? 0;
  const hasSyncedRef = useRef(false);

  // 1. Silent sync: Ensure backend knows we are active once per mount
  useEffect(() => {
    const isPersistentActive = localStorage.getItem('Zeinyra_agent_persistent_active') === 'true';
    if (isPersistentActive && !strategyData?.user_preferences?.is_active && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      let ws: WebSocket | null = null;
      try {
        const wsUrl = AGENT_BASE_URL.replace(/^http/, 'ws') + '/chat';
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          ws?.send(JSON.stringify({ type: 'ACTIVATE_AGENT' }));
          setTimeout(() => ws?.close(), 2000);
          console.log('Zeinyra: Silent backend activation synced.');
        };
      } catch (e) { 
          if (ws) ws.close();
      }
    }
  }, [strategyData?.user_preferences?.is_active]); // Only sync when preference differs

  const handleStatusUpdate = useCallback((status: ScanStatus, msg: string, data?: unknown) => {
    setScanStatus(status);
    setScanMessage(msg);
    if (status === 'split' && Array.isArray(data)) {
      setSplitData(data as SplitEntry[]);
    }
    // Refetch strategies after scan completes
    if (status === 'found' || status === 'split') {
      setTimeout(() => refetch(), 1500);
    }
  }, [refetch]);

  const filteredOpps = useMemo(() => {
    const opportunities = strategyData?.opportunities ?? [];
    const base = riskFilter === 'all' ? opportunities : opportunities.filter(o => o.risk_level === riskFilter);
    // Sort: recommended first, then by APY descending
    return [...base].sort((a, b) => {
      if (a.is_recommended && !b.is_recommended) return -1;
      if (!a.is_recommended && b.is_recommended) return 1;
      return b.apy - a.apy;
    });
  }, [strategyData?.opportunities, riskFilter]);

  const handleDeposit = useCallback((opp: AgentOpportunityItem) => {
    console.log('Deposit intent for:', opp);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00FFA3]/10">
            <TrendingUp size={16} className="text-[#00FFA3]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Yield Strategies</h3>
            <p className="text-xs text-gray-500">Agent-scanned opportunities across Base DeFi</p>
          </div>
        </div>

        {/* Risk filter */}
        <div className="flex items-center gap-2">
          <div className="flex bg-white/[0.04] rounded-lg p-0.5">
            {(['all', 'low', 'medium', 'high'] as const).map(r => (
              <button key={r} onClick={() => setRiskFilter(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${riskFilter === r ? 'bg-[#00D4FF]/15 text-[#00D4FF]' : 'text-gray-500 hover:text-gray-300'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Observer */}
      <ObserverInsights />

      {/* Target APY Control */}
      <TargetApyControl initialValue={initialTarget} onStatusUpdate={handleStatusUpdate} />

      {/* Scan Status Banner */}
      <ScanStatusBanner status={scanStatus} message={scanMessage} />

      {/* Section 1: Featured Elite Combo */}
      {(splitData.length > 0 || (strategyData?.split_strategy?.length ?? 0) > 0) && (
        <FeaturedSplitHero
          splits={splitData.length > 0 ? splitData : (strategyData?.split_strategy ?? [])}
          targetApy={strategyData?.user_preferences?.min_apy_target ?? 0}
          isActive={strategyData?.user_preferences?.is_active}
          capital={strategyData?.user_preferences?.total_capital ?? 0}
        />
      )}

      {/* Section 2: Elite Blue Chips (Tier 1 & 2) */}
      <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} className="text-[#00FFA3]" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Section 2: Elite Blue Chips</h2>
            <span className="ml-auto text-[10px] text-gray-600 font-bold uppercase tracking-widest">Verified Multi-Audited</span>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="rounded-xl p-5 bg-[#0D1130] border border-white/[0.05] animate-pulse h-56" />
              ))}
            </div>
          ) : filteredOpps.filter(o => (o.trust_tier ?? 3) <= 2).length === 0 ? (
            <p className="text-xs text-gray-500 italic p-6 border border-white/5 rounded-xl bg-white/[0.02]">
              No blue-chip upgrades detected for your current risk settings.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredOpps.filter(o => (o.trust_tier ?? 3) <= 2).map((opp, idx) => (
                 <OpportunityCard key={idx} opp={opp} onDeposit={handleDeposit} />
               ))}
            </div>
          )}
      </div>

      {/* Section 3: Elite Growth & Frontier (Tier 3) */}
      <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-[#FFB800]" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Section 3: Elite Growth & Frontier</h2>
            <span className="ml-auto text-[10px] text-gray-600 font-bold uppercase tracking-widest">High-Yield Strategic Boosters</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-5 bg-[#0D1130] border border-white/[0.05] animate-pulse h-56" />
              ))}
            </div>
          ) : filteredOpps.filter(o => (o.trust_tier ?? 0) === 3).length === 0 ? (
             <p className="text-xs text-gray-500 italic p-6 border border-white/5 rounded-xl bg-white/[0.02]">
               No frontier boosters qualified for elite selection in this cycle.
             </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOpps.filter(o => (o.trust_tier ?? 0) === 3).map((opp, idx) => (
                <OpportunityCard key={idx} opp={opp} onDeposit={handleDeposit} />
              ))}
            </div>
          )}
      </div>

      {/* Active Agent Intent & Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
         <ActiveIntentCard />
         <AgentPanel isAgentActive={strategyData?.user_preferences?.is_active} />
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
        <Info size={18} className="text-[#00D4FF] flex-shrink-0" />
        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
          The Zeinyra Leaderboard is refreshed every 5 minutes. The **Elite Selection Algorithm** deduplicates fee tiers and prioritizes liquidity depth to ensure your $20,000+ capital moves are executed with minimal slippage.
        </p>
      </div>
    </div>
  );
};

export default YieldStrategies;
