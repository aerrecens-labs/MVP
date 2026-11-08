import React, { useState, useMemo } from 'react';
import { useOnChainBalances } from '@/hooks/useOnChainBalances';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ArrowUpDown,
  Star,
  Loader2,
} from 'lucide-react';

// Mini sparkline component
const Sparkline: React.FC<{ positive: boolean }> = ({ positive }) => {
  const color = positive ? '#00FFA3' : '#627EEA';
  // Static flat line for testnet (no price history oracle)
  const points = '0,14 20,14 40,14 60,14 80,14';
  return (
    <svg width={80} height={28} viewBox="0 0 80 28">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 3"
      />
    </svg>
  );
};

const TokenIcon: React.FC<{ symbol: string; color: string }> = ({ symbol, color }) => (
  <div
    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
    style={{ background: `${color}30`, border: `1px solid ${color}50` }}
  >
    {symbol.slice(0, 2)}
  </div>
);

type SortKey = 'name' | 'price' | 'balance' | 'usdValue';
type SortDir = 'asc' | 'desc';

const AssetsTable: React.FC = () => {
  const { assets, isLoading } = useOnChainBalances();
  const tokens = useMemo(
    () =>
      assets.map((a) => ({
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        color: a.color,
        balance: a.balance,
        price: a.price,
        usdValue: a.usdValue,
        change24h: 0,
        sparkline: [] as number[],
      })),
    [assets],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('usdValue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['native-eth', 'eth']));

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredTokens = useMemo(() => {
    let result = [...tokens];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return result;
  }, [tokens, searchQuery, sortKey, sortDir]);

  const SortHeader: React.FC<{ label: string; sortKeyName: SortKey; align?: string }> = ({
    label,
    sortKeyName,
    align = 'left',
  }) => (
    <th className={`px-4 py-3 text-${align}`}>
      <button
        onClick={() => handleSort(sortKeyName)}
        className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors ${align === 'right' ? 'ml-auto' : ''
          } ${sortKey === sortKeyName ? 'text-[#00D4FF]' : 'text-gray-500 hover:text-gray-300'
          }`}
      >
        {label}
        <ArrowUpDown size={12} />
      </button>
    </th>
  );

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(15, 20, 50, 0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white">Assets</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isLoading ? 'Loading…' : `${tokens.length} tokens in smart wallet`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-gray-500 outline-none w-28"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 size={16} className="animate-spin text-[#00D4FF]" />
            <span className="text-sm">Fetching on-chain balances…</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="w-10 px-4 py-3" />
                <SortHeader label="Token" sortKeyName="name" />
                <SortHeader label="Price" sortKeyName="price" align="right" />
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    7D Chart
                  </span>
                </th>
                <SortHeader label="Balance" sortKeyName="balance" align="right" />
                <SortHeader label="Value" sortKeyName="usdValue" align="right" />
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token) => (
                <tr
                  key={token.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(token.id);
                      }}
                    >
                      <Star
                        size={14}
                        className={
                          favorites.has(token.id)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-600 hover:text-gray-400'
                        }
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <TokenIcon symbol={token.symbol} color={token.color} />
                      <div>
                        <p className="text-sm font-medium text-white">{token.name}</p>
                        <p className="text-xs text-gray-500">{token.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-white">
                      ${token.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      <span className="text-[10px] text-gray-600 ml-1">~</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Sparkline positive={true} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-gray-300">
                      {token.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono font-medium text-white">
                      ${token.usdValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTokens.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    {searchQuery
                      ? `No tokens found matching "${searchQuery}"`
                      : 'No token balances found in smart wallet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AssetsTable;
