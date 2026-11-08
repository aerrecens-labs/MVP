import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  X,
  Wifi,
  Copy,
  ExternalLink,
  LogOut,
  Check,
  User,
  Sparkles,
} from 'lucide-react';
import { useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { notifications as mockNotifications, type Notification } from './mockData';
import { useWallet } from '@/contexts/WalletContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';

interface DashboardHeaderProps {
  sidebarCollapsed: boolean;
}

const EXPLORER_URLS: Record<'PRODUCTION' | 'SANDBOX', string> = {
  PRODUCTION: 'https://basescan.org',
  SANDBOX: 'https://sepolia.basescan.org',
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ sidebarCollapsed }) => {
  const { session, shortAddress, disconnect, eoaAddress } = useWallet();
  const { environment, targetChain, isMockMode, setMockMode } = useEnvironment();
  const explorerUrl = EXPLORER_URLS[environment];

  // Live EOA balance (the connected MetaMask wallet)
  const { data: eoaBalance } = useBalance({
    address: eoaAddress,
    chainId: targetChain.id,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(mockNotifications);
  const [copied, setCopied] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (walletRef.current && !walletRef.current.contains(e.target as Node)) {
        setShowWalletMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleCopyAddress = () => {
    if (session) {
      navigator.clipboard.writeText(session.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    setShowWalletMenu(false);
    disconnect();
  };

  const notifTypeColors: Record<string, string> = {
    success: '#00FFA3',
    warning: '#FFB800',
    info: '#00D4FF',
    alert: '#FF4757',
  };

  const balanceDisplay = eoaBalance
    ? `${parseFloat(formatEther(eoaBalance.value)).toFixed(4)} ETH`
    : '—';

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-30 flex items-center justify-between px-6 transition-all duration-300 ${sidebarCollapsed ? 'left-[72px]' : 'left-[240px]'}`}
      style={{
        background: 'rgba(10, 14, 39, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${searchFocused
            ? 'bg-white/[0.08] border border-[#00D4FF]/30'
            : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.06]'
            }`}
        >
          <Search size={16} className="text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search tokens, protocols, transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Search portfolio"
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="text-gray-500 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-500 bg-white/[0.06] border border-white/[0.08]">
              <span className="text-[10px]">Ctrl</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-4">
        {/* Showcase Mode Toggle */}
        <button
          onClick={() => setMockMode(!isMockMode)}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${isMockMode
            ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800] shadow-[0_0_12px_rgba(255,184,0,0.15)] animate-pulse'
            : 'bg-white/[0.04] border-white/[0.06] text-gray-500 hover:bg-white/[0.08] hover:text-gray-300'
            }`}
        >
          <Sparkles size={14} className={isMockMode ? 'text-[#FFB800]' : ''} />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {isMockMode ? 'Showcase Mode Active' : 'Enable Showcase Mode'}
          </span>
        </button>

        {/* Network badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <div className="w-2 h-2 rounded-full animate-pulse bg-[#0052FF]" />
          <span className="text-xs font-medium text-gray-300">{targetChain.name}</span>
        </div>

        {/* Gas indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04]">
          <Wifi size={12} className="text-[#00FFA3]" />
          <span className="text-xs font-mono text-gray-400">{isMockMode ? 'Simulated' : 'Live'}</span>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] border border-transparent hover:border-white/[0.08] transition-all"
          >
            <Bell size={18} className="text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] px-1 h-[18px] rounded-full bg-[#FF4757] text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 top-12 w-[380px] rounded-xl overflow-hidden shadow-2xl z-50"
              style={{
                background: 'linear-gradient(180deg, #111538 0%, #0D1130 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#00D4FF] hover:text-[#00D4FF]/80 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${!n.read ? 'bg-white/[0.02]' : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: notifTypeColors[n.type] }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white">{n.title}</span>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wallet */}
        <div ref={walletRef} className="relative">
          <button
            onClick={() => setShowWalletMenu(!showWalletMenu)}
            aria-label="Wallet menu"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all animate-pulse-neon"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,255,163,0.08) 100%)',
              border: '1px solid rgba(0,212,255,0.25)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[#00FFA3]" />
            <span className="text-sm font-mono font-medium text-white tabular-nums">
              {balanceDisplay}
            </span>
            <span className="hidden sm:inline h-3 w-px bg-white/15" aria-hidden />
            <span className="hidden sm:inline text-sm font-mono text-[#00D4FF]">
              {shortAddress}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {showWalletMenu && (
            <div
              className="absolute right-0 top-12 w-[280px] rounded-xl overflow-hidden shadow-2xl z-50"
              style={{
                background: 'linear-gradient(180deg, #111538 0%, #0D1130 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Wallet info */}
              <div className="px-4 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,255,163,0.1))',
                      border: '1px solid rgba(0,212,255,0.2)',
                    }}
                  >
                    <User size={18} className="text-[#00D4FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-400 truncate">{shortAddress}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{targetChain.name} · EOA</p>
                  </div>
                </div>

                {/* Balance */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03]">
                  <span className="text-xs text-gray-500">EOA Balance</span>
                  <span className="text-sm font-mono font-medium text-white">{balanceDisplay}</span>
                </div>

                {/* Connected via badge */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-600">Connected via</span>
                  <span className="text-[10px] font-medium text-[#00D4FF] px-2 py-0.5 rounded-full bg-[#00D4FF]/10">
                    MetaMask
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <button
                  onClick={handleCopyAddress}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.04] transition-colors"
                >
                  {copied ? <Check size={16} className="text-[#00FFA3]" /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                </button>
                <button
                  onClick={() => {
                    if (session?.address) {
                      window.open(`${explorerUrl}/address/${session.address}`, '_blank');
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.04] transition-colors"
                >
                  <ExternalLink size={16} />
                  <span>View on BaseScan</span>
                </button>
                <div className="mx-3 my-1 border-t border-white/[0.04]" />
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/[0.06] transition-colors"
                >
                  <LogOut size={16} />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
