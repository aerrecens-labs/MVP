import React, { useState, useMemo } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useOnChainBalances } from '@/hooks/useOnChainBalances';
import {
  Vault,
  ArrowDownLeft,
  Send,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Loader2,
  Droplet,
} from 'lucide-react';

const TokenIcon: React.FC<{ symbol: string; color: string; size?: number }> = ({
  symbol,
  color,
  size = 40,
}) => (
  <div
    className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
    style={{
      width: size,
      height: size,
      background: `${color}30`,
      border: `1px solid ${color}50`,
      fontSize: size * 0.3,
    }}
  >
    {symbol.slice(0, 2)}
  </div>
);

const AssetVault: React.FC = () => {
  const { environment, targetChain } = useEnvironment();
  const { smartAccountAddress } = useWallet();
  const { assets, isLoading, ethPrice } = useOnChainBalances();

  const totalUsd = useMemo(() => assets.reduce((acc, t) => acc + t.usdValue, 0), [assets]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showReceive, setShowReceive] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use the predicted smart account address for the receive modal
  const SMART_WALLET_ADDR = smartAccountAddress ?? '—';

  const filteredTokens = assets.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHidden = showHidden ? hidden.has(t.id) : !hidden.has(t.id);
    return matchesSearch && matchesHidden;
  });

  const toggleHide = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = () => {
    if (SMART_WALLET_ADDR !== '—') {
      navigator.clipboard.writeText(SMART_WALLET_ADDR);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00D4FF]/10">
            <Vault size={16} className="text-[#00D4FF]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Asset Vault</h3>
            <p className="text-xs text-gray-500">
              {isLoading
                ? 'Syncing blockchain...'
                : `Total: $${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} · Smart Vault`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {environment === 'SANDBOX' && (
            <button
              onClick={() => window.dispatchEvent(new Event('openProvisioningModal'))}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'rgba(249,115,22,0.12)',
                border: '1px solid rgba(249,115,22,0.3)',
                color: '#F97316',
              }}
            >
              <Droplet size={14} />
              <span className="hidden xs:inline">Provision</span>
              <span className="xs:hidden">Drip</span>
            </button>
          )}

          <button
            onClick={() => setShowReceive(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(0,212,255,0.12)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#00D4FF',
            }}
          >
            <ArrowDownLeft size={14} />
            Receive
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all opacity-50 cursor-not-allowed"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#9ca3af',
            }}
            disabled
            title="Send functionality is restricted in v1"
          >
            <Send size={14} />
            Send
          </button>
        </div>
      </div>

      {/* Search & filter row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 max-w-xs bg-white/[0.04] border border-white/[0.06]">
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search assets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-gray-500 outline-none flex-1"
          />
        </div>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-gray-200"
        >
          {showHidden ? <Eye size={13} /> : <EyeOff size={13} />}
          {showHidden ? 'Show All' : 'Hidden'}
        </button>
      </div>

      {/* Token list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(15, 20, 50, 0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {isLoading && assets.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 size={16} className="animate-spin text-[#00D4FF]" />
            <span className="text-sm">Fetching on-chain balances…</span>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            {searchQuery ? `No tokens matching "${searchQuery}"` : 'No token balances in vault.'}
          </div>
        ) : (
          filteredTokens.map((token, i) => (
            <div
              key={token.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] group relative ${i < filteredTokens.length - 1 ? 'border-b border-white/[0.04]' : ''
                }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <TokenIcon symbol={token.symbol} color={token.color} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{token.name}</p>
                    <span className="text-[10px] text-gray-500 font-mono">{token.symbol}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {token.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token.symbol}
                  </p>
                </div>

                <div className="text-right sm:hidden">
                  <p className="text-sm font-mono font-semibold text-white">
                    ${token.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block text-right">
                <p className="text-sm font-mono font-semibold text-white">
                  ${token.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  ~${token.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <button
                onClick={() => toggleHide(token.id)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-all opacity-0 group-hover:opacity-100 sm:static ml-4"
              >
                <EyeOff size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Receive Modal */}
      {showReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl p-6 mx-4"
            style={{
              background: 'linear-gradient(180deg, #111538 0%, #0D1130 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Receive Assets</h3>
              <button
                onClick={() => setShowReceive(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Send tokens to your Smart Wallet on {targetChain.name}:
            </p>

            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 cursor-pointer hover:bg-white/[0.06] transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={handleCopy}
            >
              <p className="font-mono text-xs text-[#00D4FF] flex-1 break-all">{SMART_WALLET_ADDR}</p>
              {copied ? <Check size={16} className="text-[#00FFA3] flex-shrink-0" /> : <Copy size={16} className="text-gray-500 flex-shrink-0" />}
            </div>

            <p className="text-[11px] text-gray-600 text-center">
              Only send assets on {targetChain.name} {environment === 'SANDBOX' ? '(testnet)' : ''} · Chain ID {targetChain.id}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetVault;
