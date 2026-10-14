import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentData } from '@/hooks/useAgentData';
import { useAgentSession } from '@/hooks/useAgentSession';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import {
  LayoutDashboard,
  Vault,
  Layers,
  TrendingUp,
  History,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Rocket,
  Loader2,
  MessageSquare,
} from 'lucide-react';

export type NavItem = 'overview' | 'vault' | 'defi' | 'yield' | 'history' | 'agent-chat';

interface SidebarProps {
  activeNav: NavItem;
  onNavChange: (nav: NavItem) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { id: NavItem; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Portfolio Overview', icon: LayoutDashboard },
  { id: 'vault', label: 'Asset Vault', icon: Vault },
  { id: 'defi', label: 'DeFi Positions', icon: Layers },
  { id: 'yield', label: 'Yield Strategies', icon: TrendingUp },
  { id: 'history', label: 'Transaction History', icon: History },
  { id: 'agent-chat', label: 'AI Agent Chat', icon: MessageSquare },
];

const Sidebar: React.FC<SidebarProps> = ({ activeNav, onNavChange, collapsed, onToggleCollapse }) => {
  const { environment, toggleEnvironment } = useEnvironment();
  const { isLoading: isScanning } = useAgentData();
  const { isSessionActive: agentActive } = useAgentSession();
  const isSandbox = environment === 'SANDBOX';

  // Dynamic Theme Colors
  const accentGradient = isSandbox
    ? 'linear-gradient(135deg, #F97316 0%, #EAB308 100%)' // Orange to Yellow
    : 'linear-gradient(135deg, #00D4FF 0%, #00FFA3 100%)';

  const accentColor = isSandbox ? '#F97316' : '#00D4FF';
  const accentLight = isSandbox ? 'rgba(249,115,22,0.12)' : 'rgba(0,212,255,0.12)';
  const accentLightEnd = isSandbox ? 'rgba(234,179,8,0.06)' : 'rgba(0,255,163,0.06)';
  const activeBgGradient = `linear-gradient(90deg, ${accentLight} 0%, ${accentLightEnd} 100%)`;
  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      style={{
        background: 'linear-gradient(180deg, #080C24 0%, #0A0E27 50%, #0D1130 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            {/* Agent Success Glow */}
            <AnimatePresence>
              {agentActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: [0.4, 0.7, 0.4],
                    scale: [1, 1.2, 1],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-lg blur-md"
                  style={{ background: accentGradient }}
                />
              )}
            </AnimatePresence>
            
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500 relative z-10"
              style={{ background: accentGradient }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#0A0E27" />
                <path d="M2 17L12 22L22 17" stroke="#0A0E27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="#0A0E27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap transition-colors duration-500">
              Zeinyra
              {agentActive && (
                <motion.span 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[#00FFA3] shadow-[0_0_8px_#00FFA3]" 
                  title="Session Active"
                />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                }`}
              style={isActive ? { background: activeBgGradient } : {}}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full transition-all duration-500"
                  style={{ background: accentGradient }}
                />
              )}
              <Icon
                size={20}
                className={`flex-shrink-0 transition-colors ${isActive ? '' : 'text-gray-500 group-hover:text-gray-300'}`}
                style={isActive ? { color: accentColor } : {}}
              />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Environment Toggle */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={toggleEnvironment}
          className={`w-full relative flex items-center justify-between p-1 rounded-lg transition-all duration-500 ${isSandbox ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#00D4FF]/10 border-[#00D4FF]/30'
            } border`}
          title={collapsed ? (isSandbox ? 'Switch to Production' : 'Switch to Sandbox') : undefined}
        >
          {/* Active Slider Background */}
          {!collapsed && (
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-all duration-500 z-0"
              style={{
                background: accentGradient,
                left: isSandbox ? '4px' : 'calc(50%)'
              }}
            />
          )}

          <div className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1.5 transition-colors duration-300 ${isSandbox ? 'text-white' : 'text-gray-500'}`}>
            <FlaskConical size={14} className={collapsed && isSandbox ? 'text-orange-400' : ''} />
            {!collapsed && <span className="text-[11px] font-bold tracking-wider">SANDBOX</span>}
          </div>

          <div className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1.5 transition-colors duration-300 ${!isSandbox ? 'text-[#0A0E27]' : 'text-gray-500'}`}>
            <Rocket size={14} className={collapsed && !isSandbox ? 'text-[#00D4FF]' : ''} />
            {!collapsed && <span className="text-[11px] font-bold tracking-wider">PROD</span>}
          </div>
        </button>
      </div>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] transition-all">
          <Settings size={20} className="flex-shrink-0 text-gray-500" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] transition-all">
          <HelpCircle size={20} className="flex-shrink-0 text-gray-500" />
          {!collapsed && <span className="text-sm font-medium">Help Center</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#141836] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all z-50 transition-colors duration-500 ${isSandbox ? 'hover:border-orange-500/30' : 'hover:border-[#00D4FF]/30'}`}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Scanning Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#080C24]/60 backdrop-blur-[2px] pointer-events-none"
          >
            <div className="relative flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border-2 border-white/5 flex items-center justify-center relative">
                <Loader2 size={20} className="text-[#00D4FF] animate-spin" />
                <motion.div
                  className="absolute inset-0 rounded-full border-t-2 border-[#00FFA3]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-center"
                >
                  <p className="text-[10px] font-bold tracking-[0.2em] text-white uppercase mb-1">Scanning</p>
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#00D4FF] animate-pulse" />
                    <span className="text-[9px] text-gray-400 font-medium">Multichain Intelligence</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Animated shimmer sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-1/2 -skew-x-12"
              animate={{ left: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default Sidebar;
