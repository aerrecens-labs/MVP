import React, { useState, useEffect } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { Brain, Zap, CheckCircle, ChevronDown, ChevronUp, Bot, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { INTENT_REGISTRY_ADDRESS, intentRegistryAbi } from '@/constants/contracts';
import { useEnvironment } from '@/contexts/EnvironmentContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type FeedEventType = 'scan' | 'intent' | 'execution' | 'system';

interface FeedEvent {
    id: string;
    type: FeedEventType;
    title: string;
    detail: string;
    timestamp: Date;
    payload?: string;
    txHash?: string;
    reasoning?: string;
    gasPrice?: string;
    slippage?: string;
    status?: 'registered' | 'deferred_gas';
    isStrategicSwap?: boolean;
    amountInUsd?: number;
    target_project?: string;
}

// ── Mock Initial History ──────────────────────────────────────────────────────

const INITIAL_HISTORY: FeedEvent[] = [
    {
        id: 'init-1',
        type: 'system',
        title: 'Agent Initialized',
        detail: 'Zeinyra Agent connected to Base Sepolia Intent Registry.',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
        id: 'init-2',
        type: 'scan',
        title: 'Portfolio Scan Completed',
        detail: 'Analyzed 4 DeFi positions. Found 2 Upgrade Opportunities with >5% yield delta.',
        timestamp: new Date(Date.now() - 3500000), // 58 mins ago
    }
];

// ── Component ─────────────────────────────────────────────────────────────────

const StrategyFeed: React.FC = () => {
    const { targetChain, isMockMode } = useEnvironment();
    const [events, setEvents] = useState<FeedEvent[]>(INITIAL_HISTORY);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(true);

    // ── Mock Events Injection ──────────────────────────────────────────────────
    useEffect(() => {
        if (!isMockMode) return;

        const mockEvents: FeedEvent[] = [
            {
                id: 'mock-evt-1',
                type: 'scan',
                title: 'Portfolio Audit Complete',
                detail: 'Full scan of $10,000 across 3 protocols finished. 4 high-yield rotations identified.',
                timestamp: new Date(Date.now() - 300000),
                reasoning: "Current Uniswap LP concentration is sub-optimal. Reranging can capture 12.5% more volume."
            },
            {
                id: 'mock-evt-2',
                type: 'intent',
                title: 'Aerodrome Migration Proposed',
                detail: 'Move $4,000 AERO/USDC to High-Efficiency Gauge.',
                timestamp: new Date(Date.now() - 600000),
                target_project: 'Aerodrome',
                amountInUsd: 4000,
                isStrategicSwap: true,
                reasoning: "The new gauge has a 4.2x emission multiplier compared to your current position."
            },
            {
                id: 'mock-evt-3',
                type: 'intent',
                title: 'Beefy Yield Rotation Found',
                detail: 'Swap idle USDC for BIFI-MAXI vault (+5.2% APY).',
                timestamp: new Date(Date.now() - 900000),
                target_project: 'Beefy',
                amountInUsd: 2500,
                isStrategicSwap: true,
                reasoning: "BIFI-MAXI offers auto-compounding rewards which outperforms static USDC lending by 5%."
            },
            {
                id: 'mock-evt-4',
                type: 'system',
                title: 'Showcase Baseline Established',
                detail: 'Environment synchronized with MVP Mock Data.',
                timestamp: new Date(Date.now() - 3600000),
            }
        ];
        setEvents(mockEvents);
    }, [isMockMode]);

    // ── Event Watcher ─────────────────────────────────────────────────────────────

    useWatchContractEvent({
        address: INTENT_REGISTRY_ADDRESS,
        abi: intentRegistryAbi,
        eventName: 'IntentRegistered',
        chainId: targetChain.id,
        onLogs(logs) {
            if (!isListening) return;

            const newEvents = logs.map((log, index) => {
                // Safe access of args
                const tokenId = log.args.tokenId ? log.args.tokenId.toString() : 'Unknown';
                const target = log.args.target ? log.args.target : 'Unknown Vault';

                return {
                    id: `${log.transactionHash}-${index}`,
                    type: 'intent' as FeedEventType,
                    title: 'Optimization Intent Logged',
                    detail: `Agent registered an intent (Token ID: ${tokenId}) targeting vault ${target.slice(0, 6)}...${target.slice(-4)}.`,
                    timestamp: new Date(),
                    txHash: log.transactionHash,
                    payload: JSON.stringify(log.args, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value, 2
                    )
                };
            });

            setEvents(prev => [...newEvents, ...prev].slice(0, 50)); // Keep last 50
        },
    });

    // ── Reasoning Logs Polling ───────────────────────────────────────────────────
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const agentUrl = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8000';
                const res = await fetch(`${agentUrl}/history`);
                if (!res.ok) return;

                const data = await res.json();
                if (!Array.isArray(data)) return;

                const newEvents: FeedEvent[] = data.map((item: {
                    tx_hash?: string;
                    timestamp: number;
                    target_project?: string;
                    candidate_chain?: string;
                    delta_bps?: number;
                    wallet_address: string;
                    reasoning?: string;
                    gas_price?: number;
                    slippage?: number;
                    status?: 'registered' | 'deferred_gas';
                    is_strategic_swap?: boolean;
                    amount_in_usd?: number;
                }, index: number) => ({
                    id: `history-${item.tx_hash || index}-${item.timestamp}`,
                    type: item.tx_hash ? 'intent' : 'scan',
                    title: item.tx_hash ? 'Optimization Intent Logged' : 'Agent Reasoning Log',
                    detail: item.tx_hash
                        ? `Proposed rotation for ${item.target_project} on ${item.candidate_chain || 'Base'} (+${item.delta_bps} bps delta).`
                        : `Analyzing opportunities for ${item.wallet_address.slice(0, 6)}...`,
                    timestamp: new Date(item.timestamp * 1000),
                    txHash: item.tx_hash,
                    reasoning: item.reasoning,
                    gasPrice: item.gas_price ? `${(item.gas_price / 1e9).toFixed(2)} Gwei` : undefined,
                    slippage: item.slippage ? `${(item.slippage * 100).toFixed(2)}%` : undefined,
                    status: item.status,
                    isStrategicSwap: item.is_strategic_swap,
                    amountInUsd: item.amount_in_usd,
                    target_project: item.target_project,
                    payload: JSON.stringify(item, null, 2)
                }));

                setEvents(prev => {
                    // Simple merge by ID to avoid duplicates
                    const existingIds = new Set(prev.map(e => e.id));
                    const filteredNew = newEvents.filter(e => !existingIds.has(e.id));
                    return [...filteredNew, ...prev].slice(0, 50);
                });
            } catch (err) {
                console.error("Failed to fetch strategy logs:", err);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    // ── Render Helpers ────────────────────────────────────────────────────────────

    const getIcon = (type: FeedEventType) => {
        switch (type) {
            case 'intent': return <Zap size={16} className="text-[#00FFA3]" />;
            case 'execution': return <CheckCircle size={16} className="text-[#00D4FF]" />;
            case 'scan': return <Brain size={16} className="text-[#F97316]" />;
            case 'system': return <Bot size={16} className="text-gray-400" />;
        }
    };

    const getIconBg = (type: FeedEventType) => {
        switch (type) {
            case 'intent': return 'rgba(0,255,163,0.1)';
            case 'execution': return 'rgba(0,212,255,0.1)';
            case 'scan': return 'rgba(249,115,22,0.1)';
            case 'system': return 'rgba(255,255,255,0.05)';
        }
    };

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    return (
        <div
            className="rounded-2xl p-5 h-full flex flex-col"
            style={{
                background: 'linear-gradient(180deg, rgba(15,19,56,0.5) 0%, rgba(10,14,39,0.5) 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(8px)'
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Brain size={16} className="text-[#F97316]" />
                    <h3 className="text-sm font-semibold text-white">Strategy Intelligence Feed</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isListening && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00FFA3]/10 border border-[#00FFA3]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
                            <span className="text-[10px] text-[#00FFA3] font-mono">Listening</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-500">
                        <Loader2 size={18} className="animate-spin text-gray-600" />
                        <span className="text-xs">Awaiting Agent events...</span>
                    </div>
                ) : (
                    events.map((ev) => (
                        <div
                            key={ev.id}
                            className="p-3 rounded-xl transition-all"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: getIconBg(ev.type) }}
                                >
                                    {getIcon(ev.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-white truncate">{ev.title}</p>
                                    </div>

                                    {ev.status === 'deferred_gas' && (
                                        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-500 font-medium">
                                            <AlertTriangle size={12} />
                                            High Gas - Optimization Deferred
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{ev.detail}</p>

                                    {ev.reasoning && (
                                        <div className="mt-3 p-3 rounded-lg border border-orange-500/10 bg-orange-500/5 relative overflow-hidden group/insight">
                                            <div className="absolute top-0 right-0 p-1">
                                                <Brain size={12} className="text-orange-500/30" />
                                            </div>
                                            <p className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Brain size={10} /> AI Insights
                                            </p>
                                            <p className="text-xs text-orange-100/80 italic leading-relaxed">
                                                "{ev.reasoning}"
                                            </p>

                                            {ev.isStrategicSwap && (
                                                <div className="mt-4 space-y-4 relative pl-6">
                                                    {/* Vertical Line */}
                                                    <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-orange-500/20" />

                                                    {/* Moving Dot Animation */}
                                                    <div className="absolute left-[5px] top-2 w-[6px] h-[6px] rounded-full bg-orange-500 animate-bounce transition-all duration-1000"
                                                        style={{ animationDelay: '0s', top: '15%' }} />

                                                    {/* Step 1 */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-[#0F1338] border border-orange-500/50 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                        </div>
                                                        <p className="text-[11px] font-bold text-orange-300 uppercase">Step 1: Liquidity Routing</p>
                                                        <p className="text-xs text-orange-100/70 mt-0.5">
                                                            🔄 Swap {ev.amountInUsd?.toFixed(0) || '500'} mUSDC for ETH via Uniswap V3
                                                        </p>
                                                    </div>

                                                    {/* Step 2 */}
                                                    <div className="relative">
                                                        <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-[#0F1338] border border-orange-500/20 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500/30" />
                                                        </div>
                                                        <p className="text-[11px] font-bold text-orange-300/60 uppercase">Step 2: Yield Capture</p>
                                                        <p className="text-xs text-orange-100/70 mt-0.5">
                                                            🏦 Deposit ETH into {ev.target_project || 'Vault'}
                                                        </p>
                                                    </div>

                                                    {/* Analytics Hook */}
                                                    <div className="mt-4 p-2 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
                                                        <span className="text-[10px] text-orange-300 font-medium">Estimated AI Fee Savings</span>
                                                        <span className="text-xs font-mono text-[#00FFA3]">
                                                            +${((ev.amountInUsd || 0) * 0.007).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {(ev.gasPrice || ev.slippage) && (
                                                <div className="mt-2 pt-2 border-t border-orange-500/10 flex items-center gap-4 text-[10px] text-orange-500/60 font-mono">
                                                    {ev.gasPrice && (
                                                        <span className="flex items-center gap-1">
                                                            <Zap size={10} /> {ev.gasPrice}
                                                        </span>
                                                    )}
                                                    {ev.slippage && (
                                                        <span className="flex items-center gap-1">
                                                            <Shield size={10} /> Slippage: {ev.slippage}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {ev.payload && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
                                                className="flex items-center gap-1 text-[10px] text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors bg-[#00D4FF]/10 px-2 py-1 rounded"
                                            >
                                                {expandedId === ev.id ? 'Hide Payload' : 'View Payload'}
                                                {expandedId === ev.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>

                                            {expandedId === ev.id && (
                                                <div className="mt-2 p-2 rounded bg-black/40 border border-white/5 overflow-x-auto">
                                                    <pre className="text-[10px] text-[#00FFA3] font-mono whitespace-pre-wrap">
                                                        {ev.payload}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {ev.txHash && !ev.payload && (
                                        <div className="mt-2">
                                            <a
                                                href={`https://sepolia.basescan.org/tx/${ev.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-[#00FFA3] hover:underline flex items-center gap-1"
                                            >
                                                <Zap size={10} /> View on BaseScan
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Scrollbar CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}} />
        </div>
    );
};

export default StrategyFeed;
