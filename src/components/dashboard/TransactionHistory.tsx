import React, { useState, useMemo, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  Filter,
  History,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Zeinyra_ACCOUNT_ADDRESS } from '@/constants/contracts';
import { useEnvironment } from '@/contexts/EnvironmentContext';

// Etherscan V2 API (Unified Endpoint for all chains)
const ETHERSCAN_V2_API = 'https://api.etherscan.io/v2/api';
const EXPLORER_MAINNET = 'https://basescan.org';
const EXPLORER_SEPOLIA = 'https://sepolia.basescan.org';

// ── Types ──────────────────────────────────────────────────────────────────────

type TxType = 'send' | 'receive' | 'contract';
type TxFilter = 'all' | 'send' | 'receive' | 'contract';

interface ChainTx {
  hash: string;
  from: string;
  to: string;
  value: string;           // in wei
  gasUsed: string;
  gasPrice: string;
  timeStamp: string;
  isError: string;
  functionName: string;
  txreceipt_status: string;
  blockNumber: string;
}

interface DisplayTx {
  id: string;
  type: TxType;
  hash: string;
  action: string;
  block: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  status: 'confirmed' | 'failed';
  timestamp: number;
  isOut: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const shorten = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;

function mapTx(tx: ChainTx, wallet: string): DisplayTx {
  const isOut = tx.from.toLowerCase() === wallet.toLowerCase();
  const gasFeeEth = (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18;
  const ethValue = Number(tx.value) / 1e18;

  // Extract action
  let action = 'Transfer';
  if (tx.functionName) {
    const rawAction = tx.functionName.split('(')[0];
    action = rawAction.charAt(0).toUpperCase() + rawAction.slice(1);
    if (action === 'Execute') action = 'Exec';
    if (action === 'Multicall') action = 'Multicall';
  } else if (tx.to === '') {
    action = 'Contract Creation';
  }

  return {
    id: tx.hash,
    type: tx.functionName ? 'contract' : isOut ? 'send' : 'receive',
    hash: tx.hash,
    action,
    block: tx.blockNumber,
    from: tx.from,
    to: tx.to || 'Contract Creation',
    amount: ethValue > 0 ? `${ethValue.toFixed(4)} ETH` : '0 ETH',
    fee: gasFeeEth.toFixed(8),
    status: tx.isError === '0' ? 'confirmed' : 'failed',
    timestamp: Number(tx.timeStamp),
    isOut,
  };
}

function formatAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TransactionHistory: React.FC = () => {
  const { eoaAddress, smartAccountAddress } = useWallet();
  const { targetChain, isMockMode } = useEnvironment();
  const [filter, setFilter] = useState<TxFilter>('all');
  const [txs, setTxs] = useState<DisplayTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = ETHERSCAN_V2_API;
  const explorerBase = targetChain.id === 8453 ? EXPLORER_MAINNET : EXPLORER_SEPOLIA;

  useEffect(() => {
    if (!smartAccountAddress && !eoaAddress && !isMockMode) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    if (isMockMode) {
      setTimeout(() => {
        if (cancelled) return;
        const mockTxs: DisplayTx[] = [
          {
            id: 'mock-1',
            type: 'contract',
            hash: '0x7d1a2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v',
            action: 'Deposit',
            block: '14285700',
            from: eoaAddress || '0xWallet',
            to: 'Aerodrome: Gauge',
            amount: '5620.5 AERO',
            fee: '0.000412',
            status: 'confirmed',
            timestamp: Math.floor(Date.now() / 1000) - 3600,
            isOut: true,
          },
          {
            id: 'mock-2',
            type: 'contract',
            hash: '0x9c3e4d5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v',
            action: 'Increase Liquidity',
            block: '14285650',
            from: eoaAddress || '0xWallet',
            to: 'Uniswap V3: NFT Manager',
            amount: '1.2 WETH',
            fee: '0.000854',
            status: 'confirmed',
            timestamp: Math.floor(Date.now() / 1000) - 7200,
            isOut: true,
          },
          {
            id: 'mock-3',
            type: 'contract',
            hash: '0x4b2d3c4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u',
            action: 'Deposit',
            block: '14285600',
            from: eoaAddress || '0xWallet',
            to: 'Beefy: BIFI Vault',
            amount: '2500.0 USDC',
            fee: '0.000321',
            status: 'confirmed',
            timestamp: Math.floor(Date.now() / 1000) - 10800,
            isOut: true,
          },
          {
            id: 'mock-4',
            type: 'receive',
            hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
            action: 'Transfer',
            block: '14285500',
            from: 'CEX: Coinbase',
            to: eoaAddress || '0xWallet',
            amount: '5.0 ETH',
            fee: '0.000000',
            status: 'confirmed',
            timestamp: Math.floor(Date.now() / 1000) - 86400,
            isOut: false,
          },
          {
            id: 'mock-5',
            type: 'contract',
            hash: '0xdef0123456789abcdef0123456789abcdef01234',
            action: 'Approve',
            block: '14285400',
            from: eoaAddress || '0xWallet',
            to: 'Uniswap V3: Router',
            amount: '0 ETH',
            fee: '0.000124',
            status: 'confirmed',
            timestamp: Math.floor(Date.now() / 1000) - 90000,
            isOut: true,
          }
        ];
        setTxs(mockTxs);
        setLoading(false);
      }, 800);
      return;
    }

    const apiKey = import.meta.env.VITE_BASESCAN_API_KEY;
    
    const fetchForAddress = async (addr: string) => {
      const url = new URL(apiBase);
      url.searchParams.set('chainid', String(targetChain.id));
      url.searchParams.set('module', 'account');
      url.searchParams.set('action', 'txlist');
      url.searchParams.set('address', addr);
      url.searchParams.set('sort', 'desc');
      url.searchParams.set('offset', '20');
      url.searchParams.set('page', '1');
      if (apiKey) url.searchParams.set('apikey', apiKey);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.status === '1' && Array.isArray(data.result)) {
        return data.result.map((tx: ChainTx) => mapTx(tx, addr));
      }
      if (data.status === '0' && data.message === 'No transactions found') return [];
      throw new Error(data.result || data.message || 'API Error');
    };

    Promise.all([
      eoaAddress ? fetchForAddress(eoaAddress) : Promise.resolve([]),
      smartAccountAddress ? fetchForAddress(smartAccountAddress) : Promise.resolve([]),
    ])
      .then(([eoaTxs, saTxs]) => {
        if (cancelled) return;
        // Merge and sort
        const merged = [...eoaTxs, ...saTxs].sort((a, b) => b.timestamp - a.timestamp);
        // De-duplicate by hash
        const unique = merged.filter((tx, i, self) => i === self.findIndex((t) => t.hash === tx.hash));
        setTxs(unique);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [smartAccountAddress, eoaAddress, targetChain.id, apiBase, isMockMode]);

  const filtered = useMemo(
    () => (filter === 'all' ? txs : txs.filter((t) => t.type === filter)),
    [txs, filter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00D4FF]/10 border border-[#00D4FF]/20">
            <History size={20} className="text-[#00D4FF]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Unified Transaction Explorer</h3>
            <p className="text-xs text-gray-500">
              {loading ? 'Fetching history…' : `${txs.length} transactions across EOA + Smart Wallet`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-lg border border-white/[0.08]">
          {(['all', 'send', 'receive', 'contract'] as TxFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f
                ? 'bg-[#00D4FF]/15 text-[#00D4FF] shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden border border-white/[0.06]"
        style={{ background: 'rgba(15, 20, 50, 0.4)' }}
      >
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-white/[0.1]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0F1432]">
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Transaction Hash</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Action</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Block</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Age</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">From / To</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Fee</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                      <Loader2 size={24} className="animate-spin text-[#00D4FF]" />
                      <span className="text-sm font-medium">Aggregating blockchain history…</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-20">
                    <div className="flex flex-col items-center justify-center gap-3 text-red-400">
                      <AlertTriangle size={32} />
                      <p className="text-sm font-semibold">BaseScan Error</p>
                      <p className="text-xs text-red-300/60 max-w-xs text-center">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-gray-500 text-sm">
                    No transactions found for this wallet pair.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4 min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <a
                          href={`${explorerBase}/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-[#00D4FF] hover:underline"
                        >
                          {shorten(tx.hash)}
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-gray-300">
                        {tx.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-gray-400">{tx.block}</td>
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{formatAgo(new Date(tx.timestamp * 1000))}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400">{shorten(tx.from)}</span>
                        <div className={`px-1 rounded text-[8px] font-bold ${tx.isOut ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/20'}`}>
                          {tx.isOut ? 'OUT' : 'IN'}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">{shorten(tx.to)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-xs font-mono font-bold ${tx.amount !== '0 ETH' ? 'text-white' : 'text-gray-600'}`}>
                        {tx.amount}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-[10px] font-mono text-gray-600">{tx.fee}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
