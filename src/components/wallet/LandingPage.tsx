import React, { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Wallet, ArrowRight } from 'lucide-react';

// ── Stats ────────────────────────────────────────────────────────────────────

const stats = [
  { label: 'Total Value Tracked', value: 2400000000, prefix: '$', suffix: 'B+', display: '$2.4B+' },
  { label: 'Active Wallets', value: 48000, prefix: '', suffix: '+', display: '48K+' },
  { label: 'Protocols Supported', value: 120, prefix: '', suffix: '+', display: '120+' },
  { label: 'Chains Integrated', value: 12, prefix: '', suffix: '', display: '12' },
];

// ── Main Component ───────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  const { openConnectModal } = useWallet();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white overflow-x-hidden">
      {/* ── Floating Header ─────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'
          }`}
        style={{
          background: scrolled ? 'rgba(10, 14, 39, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #00FFA3 100%)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#0A0E27" />
                <path d="M2 17L12 22L22 17" stroke="#0A0E27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="#0A0E27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Zeinyra
            </span>
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, rgba(0,255,163,0.05) 40%, transparent 70%)',
          }}
        />
        {/* Floating orbs */}
        <div
          className="absolute top-40 left-[15%] w-64 h-64 rounded-full animate-glow"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-60 right-[10%] w-48 h-48 rounded-full animate-glow"
          style={{ background: 'radial-gradient(circle, rgba(0,255,163,0.06) 0%, transparent 70%)', animationDelay: '1s' }}
        />

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 animate-float-up"
            style={{
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.15)',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-xs font-medium text-[#00D4FF]">Built for Base Mainnet</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 animate-float-up"
            style={{ animationDelay: '100ms' }}
          >
            Your DeFi Portfolio,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #00D4FF 0%, #00FFA3 50%, #00D4FF 100%)' }}
            >
              One Command Center
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-float-up"
            style={{ animationDelay: '200ms' }}
          >
            Track, manage, and optimize your entire DeFi portfolio across chains and protocols.
            Real-time analytics, yield strategies, and smart alerts — all in one place.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-float-up"
            style={{ animationDelay: '300ms' }}
          >
            <button
              onClick={openConnectModal}
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[#00D4FF]/20"
              style={{
                background: 'linear-gradient(135deg, #00D4FF 0%, #00FFA3 100%)',
                color: '#0A0E27',
              }}
            >
              <Wallet size={18} />
              Connect Wallet
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-float-up"
            style={{ animationDelay: '400ms' }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{stat.display}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
