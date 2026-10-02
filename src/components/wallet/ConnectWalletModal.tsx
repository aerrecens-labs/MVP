import React, { useState, useEffect, useMemo } from 'react';
import { useWallet, type WalletType } from '@/contexts/WalletContext';

/** True when the user is on a phone/tablet — no browser MetaMask extension available */
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
import {
  X,
  Shield,
  ExternalLink,
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';

// ── Wallet metadata ──────────────────────────────────────────────────────────

interface WalletOption {
  id: WalletType;
  name: string;
  description: string;
  color: string;
  popular?: boolean;
}

const desktopWallets: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Connect using browser extension',
    color: '#F6851B',
    popular: true,
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Scan QR with MetaMask mobile',
    color: '#3B99FC',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Connect using Coinbase Wallet',
    color: '#0052FF',
  },
];

const mobileWallets: WalletOption[] = [
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Connect MetaMask or any mobile wallet',
    color: '#3B99FC',
    popular: true,
  },
  {
    id: 'metamask',
    name: 'MetaMask (in-app browser)',
    description: 'Already using MetaMask browser? Tap here',
    color: '#F6851B',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Connect using Coinbase Wallet',
    color: '#0052FF',
  },
];

// ── SVG icons for each wallet ────────────────────────────────────────────────

const MetaMaskIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F6851B" fillOpacity="0.15" />
    <path d="M24.5 8L17.2 13.4L18.6 10.2L24.5 8Z" fill="#E2761B" />
    <path d="M7.5 8L14.7 13.5L13.4 10.2L7.5 8Z" fill="#E4761B" />
    <path d="M21.8 20.5L19.8 23.6L24.1 24.8L25.3 20.6L21.8 20.5Z" fill="#E4761B" />
    <path d="M6.7 20.6L7.9 24.8L12.2 23.6L10.2 20.5L6.7 20.6Z" fill="#E4761B" />
    <path d="M12 16.2L10.8 18L14.8 18.2L14.7 13.9L12 16.2Z" fill="#E4761B" />
    <path d="M20 16.2L17.2 13.8L17.2 18.2L21.2 18L20 16.2Z" fill="#E4761B" />
    <path d="M12.2 23.6L14.6 22.4L12.5 20.6L12.2 23.6Z" fill="#E4761B" />
    <path d="M17.4 22.4L19.8 23.6L19.5 20.6L17.4 22.4Z" fill="#E4761B" />
  </svg>
);

const WalletConnectIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#3B99FC" fillOpacity="0.15" />
    <path
      d="M11.2 13.6C14 10.8 18 10.8 20.8 13.6L21.2 14C21.3 14.1 21.3 14.3 21.2 14.4L20.2 15.4C20.15 15.45 20.05 15.45 20 15.4L19.4 14.8C17.4 12.8 14.6 12.8 12.6 14.8L12 15.4C11.95 15.45 11.85 15.45 11.8 15.4L10.8 14.4C10.7 14.3 10.7 14.1 10.8 14L11.2 13.6ZM23 15.8L23.9 16.7C24 16.8 24 17 23.9 17.1L19.9 21.1C19.8 21.2 19.6 21.2 19.5 21.1L16.8 18.4C16.775 18.375 16.725 18.375 16.7 18.4L14 21.1C13.9 21.2 13.7 21.2 13.6 21.1L9.6 17.1C9.5 17 9.5 16.8 9.6 16.7L10.5 15.8C10.6 15.7 10.8 15.7 10.9 15.8L13.6 18.5C13.625 18.525 13.675 18.525 13.7 18.5L16.4 15.8C16.5 15.7 16.7 15.7 16.8 15.8L19.5 18.5C19.525 18.525 19.575 18.525 19.6 18.5L22.3 15.8C22.4 15.7 22.6 15.7 22.7 15.8L23 15.8Z"
      fill="#3B99FC"
    />
  </svg>
);

const CoinbaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#0052FF" fillOpacity="0.15" />
    <circle cx="16" cy="16" r="8" fill="#0052FF" fillOpacity="0.2" />
    <rect x="13" y="13" width="6" height="6" rx="1" fill="#0052FF" />
  </svg>
);

const walletIcons: Record<WalletType, React.FC> = {
  metamask: MetaMaskIcon,
  walletconnect: WalletConnectIcon,
  coinbase: CoinbaseIcon,
};

// ── Connection step indicators ───────────────────────────────────────────────

type ConnectStep = 'detect' | 'approve' | 'sign' | 'done';

const steps: { id: ConnectStep; label: string }[] = [
  { id: 'detect', label: 'Detecting wallet' },
  { id: 'approve', label: 'Requesting approval' },
  { id: 'sign', label: 'Verifying signature' },
  { id: 'done', label: 'Connected' },
];

// ── Main Component ───────────────────────────────────────────────────────────

const ConnectWalletModal: React.FC = () => {
  const { status, error, isModalOpen, closeConnectModal, connect, shortAddress, session } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [currentStep, setCurrentStep] = useState<ConnectStep>('detect');
  const wallets = useMemo(() => isMobile ? mobileWallets : desktopWallets, []);

  // Real connection: advance steps based on wagmi status
  useEffect(() => {
    if (status === 'connecting' && selectedWallet) {
      setCurrentStep('detect');
      // Brief visual delay so the user sees step progression
      const t1 = setTimeout(() => setCurrentStep('approve'), 400);
      const t2 = setTimeout(() => setCurrentStep('sign'), 900);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [status, selectedWallet]);

  useEffect(() => {
    if (status === 'connected') {
      setCurrentStep('done');
    }
  }, [status]);

  // Reset when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setTimeout(() => {
        setSelectedWallet(null);
        setCurrentStep('detect');
      }, 300);
    }
  }, [isModalOpen]);

  const handleSelectWallet = (walletType: WalletType) => {
    setSelectedWallet(walletType);
    connect(walletType);
  };

  const handleRetry = () => {
    if (selectedWallet) {
      connect(selectedWallet);
    }
  };

  const handleBack = () => {
    setSelectedWallet(null);
    setCurrentStep('detect');
  };

  if (!isModalOpen) return null;

  const isConnecting = status === 'connecting';
  const isError = status === 'error';
  const isConnected = status === 'connected';
  const showSteps = selectedWallet && (isConnecting || isError || isConnected);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={!isConnecting ? closeConnectModal : undefined}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[440px] mx-4 rounded-2xl overflow-hidden shadow-2xl animate-float-up"
        style={{
          background: 'linear-gradient(180deg, #0F1338 0%, #0A0E27 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {showSteps && !isConnected && (
              <button
                onClick={handleBack}
                disabled={isConnecting}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all disabled:opacity-40"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <h2 className="text-base font-semibold text-white">
              {isConnected ? 'Connected' : showSteps ? 'Connecting...' : 'Connect Wallet'}
            </h2>
          </div>
          <button
            onClick={closeConnectModal}
            disabled={isConnecting}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {!showSteps ? (
            /* ── Wallet Selection ─────────────────────────────────────── */
            <>
              {/* Security notice */}
              <div
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl mb-5"
                style={{
                  background: 'rgba(0,212,255,0.06)',
                  border: '1px solid rgba(0,212,255,0.1)',
                }}
              >
                <Shield size={14} className="text-[#00D4FF] flex-shrink-0" />
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Zeinyra never stores your private keys. Connections are secured end-to-end.
                </p>
              </div>

              {/* Wallet list */}
              <div className="space-y-2">
                {wallets.map((w) => {
                  const Icon = walletIcons[w.id];
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleSelectWallet(w.id)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group hover:-translate-y-0.5"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = `${w.color}40`;
                        (e.currentTarget as HTMLElement).style.background = `${w.color}08`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      <Icon />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{w.name}</span>
                          {w.popular && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#00FFA3]/10 text-[#00FFA3]">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{w.description}</p>
                      </div>
                      <ArrowLeft size={14} className="text-gray-600 rotate-180 group-hover:text-gray-400 transition-colors" />
                    </button>
                  );
                })}
              </div>

              {/* Footer info */}
              <div className="mt-5 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    <Lock size={10} />
                    Non-custodial
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    <Globe size={10} />
                    Multi-chain
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    <Zap size={10} />
                    Instant
                  </span>
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-3">
                  By connecting, you agree to our{' '}
                  <button className="text-[#00D4FF] hover:underline">Terms of Service</button>
                  {' '}and{' '}
                  <button className="text-[#00D4FF] hover:underline">Privacy Policy</button>
                </p>
              </div>
            </>
          ) : (
            /* ── Connection Progress ──────────────────────────────────── */
            <div className="py-2">
              {/* Wallet icon + animation */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-4">
                  {selectedWallet && React.createElement(walletIcons[selectedWallet])}

                  {isConnecting && (
                    <div className="absolute -inset-3 rounded-full border-2 border-transparent border-t-[#00D4FF] animate-spin" />
                  )}
                  {isConnected && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00FFA3] flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-[#0A0E27]" />
                    </div>
                  )}
                  {isError && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF4757] flex items-center justify-center">
                      <AlertCircle size={12} className="text-white" />
                    </div>
                  )}
                </div>

                <p className="text-sm font-semibold text-white">
                  {wallets.find((w) => w.id === selectedWallet)?.name}
                </p>

                {isConnected && shortAddress && (
                  <p className="text-xs font-mono text-[#00D4FF] mt-1">{shortAddress}</p>
                )}
              </div>

              {/* Step indicators */}
              <div className="space-y-3 mb-6">
                {steps.map((step, i) => {
                  const stepIndex = steps.findIndex((s) => s.id === currentStep);
                  const thisIndex = i;
                  const isDone = thisIndex < stepIndex || (isConnected && thisIndex <= stepIndex);
                  const isCurrent = thisIndex === stepIndex && !isConnected && !isError;
                  const isPending = thisIndex > stepIndex;
                  const isFailed = isError && thisIndex === stepIndex;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${isCurrent ? 'bg-white/[0.04]' : ''
                        }`}
                    >
                      {/* Status icon */}
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                        {isDone ? (
                          <div className="w-6 h-6 rounded-full bg-[#00FFA3]/15 flex items-center justify-center">
                            <CheckCircle2 size={14} className="text-[#00FFA3]" />
                          </div>
                        ) : isFailed ? (
                          <div className="w-6 h-6 rounded-full bg-[#FF4757]/15 flex items-center justify-center">
                            <AlertCircle size={14} className="text-[#FF4757]" />
                          </div>
                        ) : isCurrent ? (
                          <Loader2 size={16} className="text-[#00D4FF] animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-white/10" />
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={`text-sm transition-colors ${isDone
                          ? 'text-[#00FFA3]'
                          : isFailed
                            ? 'text-[#FF4757]'
                            : isCurrent
                              ? 'text-white font-medium'
                              : 'text-gray-600'
                          }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Error message */}
              {isError && error && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-4"
                  style={{
                    background: 'rgba(255,71,87,0.08)',
                    border: '1px solid rgba(255,71,87,0.15)',
                  }}
                >
                  <AlertCircle size={14} className="text-[#FF4757] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Action buttons */}
              {isError && (
                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRetry}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #00D4FF 0%, #00FFA3 100%)',
                      color: '#0A0E27',
                    }}
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                </div>
              )}

              {isConnected && (
                <button
                  onClick={closeConnectModal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #00D4FF 0%, #00FFA3 100%)',
                    color: '#0A0E27',
                  }}
                >
                  <Zap size={14} />
                  Enter Dashboard
                </button>
              )}

              {isConnecting && (
                <p className="text-center text-[11px] text-gray-600 mt-2">
                  {selectedWallet === 'walletconnect'
                    ? 'Approve the connection in your MetaMask app…'
                    : 'Please confirm in your wallet extension…'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;
