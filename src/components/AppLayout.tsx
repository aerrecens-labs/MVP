import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWallet } from '@/contexts/WalletContext';
import { useAccount, useSwitchChain } from 'wagmi';


import Sidebar, { type NavItem } from './dashboard/Sidebar';
import DashboardHeader from './dashboard/DashboardHeader';
import OverviewView from './dashboard/OverviewView';
import AssetVault from './dashboard/AssetVault';
import DeFiView from './dashboard/DeFiView';
import YieldStrategies from './dashboard/YieldStrategies';
import TransactionHistory from './dashboard/TransactionHistory';
import AgentChatView from './dashboard/AgentChatView';
import LandingPage from './wallet/LandingPage';

import { Loader2, Wallet, ExternalLink, Zap } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();
  const { isConnected, smartWalletBalance, disconnect, smartAccountAddress, isSmartAccountDeployed, isSmartAccountLoading } = useWallet();
  const [activeNav, setActiveNav] = useState<NavItem>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // swLoading is true only while factory read is actively in-flight.
  // Once wagmi settles (success OR error after retries) we always show the dashboard.
  const swLoading = isConnected && isSmartAccountLoading;
  // Show dashboard as soon as we're connected — smartAccountAddress may still be loading
  // inside components, but we never block the full UI on it.
  const hasSmartWallet = isConnected && !isSmartAccountLoading;

  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = isConnected && chain?.id !== 8453;


  // Display address: prefer the predicted address, fall back to nothing
  const displayAddress = smartAccountAddress ?? null;

  const effectiveCollapsed = isMobile ? true : sidebarCollapsed;

  const renderView = () => {
    switch (activeNav) {
      case 'overview':
        return <OverviewView onNavigate={setActiveNav} />;
      case 'vault':
        return <AssetVault />;
      case 'defi':
        return <DeFiView />;
      case 'yield':
        return <YieldStrategies />;
      case 'history':
        return <TransactionHistory />;
      case 'agent-chat':
        return <AgentChatView />;
      default:
        return <OverviewView onNavigate={setActiveNav} />;
    }
  };

  const viewTitles: Record<NavItem, string> = {
    overview: 'Portfolio Overview',
    vault: 'Asset Vault',
    defi: 'DeFi Positions',
    yield: 'Yield Strategies',
    history: 'Transaction History',
    'agent-chat': 'AI Agent Chat',
  };

  return (
    <>
      {/* AppKit manages its own wallet modal — ConnectWalletModal is legacy */}

      {!isConnected ? (
        /* ── State 1: Landing page when wallet is not connected ─────── */
        <LandingPage />

      ) : swLoading ? (
        /* ── State 2a: Checking for smart wallet ────────────────────── */
        <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-[#00D4FF] animate-spin" />
            <p className="text-gray-400 text-sm">Checking smart wallet…</p>
          </div>
        </div>

      ) : isWrongNetwork ? (
        /* ── State 2b: Wrong network connected ──────────────────────── */
        <div className="min-h-screen bg-[#0A0E27] grid-bg flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl p-8 text-center"
            style={{
              background: 'linear-gradient(180deg, #381115 0%, #300d14 100%)',
              border: '1px solid rgba(255,100,100,0.08)',
            }}
          >
            <h2 className="text-xl font-bold text-white mb-2">Wrong Network</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Zeinyra requires the Base Mainnet. Please switch your network to continue.
            </p>
            <button
              onClick={() => switchChain({ chainId: 8453 })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: '#FF4D4D', color: '#FFF' }}
            >
              Switch to Base Mainnet
            </button>
          </div>
        </div>
      ) : !hasSmartWallet ? (
        /* ── State 2c: EOA connected, no smart wallet detected ──────── */

        <div className="min-h-screen bg-[#0A0E27] grid-bg flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl p-8 text-center"
            style={{
              background: 'linear-gradient(180deg, #111538 0%, #0D1130 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              <Wallet size={28} className="text-[#00D4FF]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Deploy Your Smart Wallet</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Zeinyra uses Account Abstraction (ERC-4337) to enable gasless AI-managed transactions.
              Deploy your personal <span className="text-[#00D4FF] font-mono">ZeinyraAccount</span> to unlock the full dashboard.
            </p>
            <div
              className="rounded-xl p-4 mb-6 text-left"
              style={{ background: 'rgba(0,114,255,0.06)', border: '1px solid rgba(0,114,255,0.15)' }}
            >
              <p className="text-xs text-[#00D4FF] font-semibold mb-1">Production Network</p>
              <p className="text-xs text-gray-400">
                Connected to <span className="font-mono text-[#00D4FF]">Base Mainnet</span>. 
                Deploy your personal <span className="font-mono text-[#00D4FF]">ZeinyraAccount</span> at:
                <span className="font-mono text-[#00D4FF] text-[10px] block mt-1 break-all">
                  {displayAddress ?? 'predicting…'}
                </span>
                {!isSmartAccountDeployed && displayAddress && ' Not yet deployed — dashboard is in preview mode.'}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={displayAddress ? `https://basescan.org/address/${displayAddress}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${!displayAddress ? 'opacity-50 pointer-events-none' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, #00D4FF 0%, #00FFA3 100%)',
                  color: '#0A0E27',
                }}
              >
                <ExternalLink size={14} />
                View on BaseScan
              </a>
              <button
                onClick={disconnect}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>

      ) : (
        /* ── State 3: Connected EOA + Smart Wallet u2014 full dashboard ─── */
        <div className="min-h-screen bg-[#0A0E27] grid-bg">
          <Sidebar
            activeNav={activeNav}
            onNavChange={setActiveNav}
            collapsed={effectiveCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          <DashboardHeader sidebarCollapsed={effectiveCollapsed} />

          <main
            className={`pt-16 min-h-screen transition-all duration-300 ${effectiveCollapsed ? 'pl-[72px]' : 'pl-[240px]'
              }`}
          >
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white">{viewTitles[activeNav]}</h1>
                <p className="text-xs text-gray-500 mt-1">
                  {activeNav === 'overview' && 'Welcome back! Here\'s your portfolio at a glance.'}
                  {activeNav === 'vault' && 'View and manage all your crypto assets in one place.'}
                  {activeNav === 'defi' && 'Monitor and manage your decentralized finance positions.'}
                  {activeNav === 'yield' && 'Explore yield farming opportunities across DeFi protocols.'}
                  {activeNav === 'history' && 'Review all your on-chain transactions and activity.'}
                  {activeNav === 'agent-chat' && 'Chat with your Zeinyra strategist about portfolio and yield.'}
                </p>
              </div>

              {renderView()}
            </div>

            <footer className="mt-8 px-6 py-4 border-t border-white/[0.04]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #00FFA3 100%)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#0A0E27" />
                      <path d="M2 17L12 22L22 17" stroke="#0A0E27" strokeWidth="2" strokeLinecap="round" />
                      <path d="M2 12L12 17L22 12" stroke="#0A0E27" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500">
                    Zeinyra Dashboard v1.0.5 · Base Mainnet
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-gray-600 font-mono">
                    SW: {displayAddress ? `${displayAddress.slice(0, 6)}…${displayAddress.slice(-4)}` : '—'}
                  </span>
                  <span className="text-[10px] text-gray-600 flex items-center gap-1">
                    <Zap size={8} className="text-[#00FFA3]" />
                    Balance: {smartWalletBalance ?? '—'}
                  </span>
                  <span className="text-[10px] text-gray-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                    Base Mainnet
                  </span>
                </div>
              </div>
            </footer>
          </main>
        </div>
      )}
    </>
  );
};

export default AppLayout;
