/**
 * WalletContext — Reown AppKit + wagmi v2
 *
 * Extends the base wagmi connection state with:
 *  - smartAccountAddress: predicted via ZeinyraAccountFactory.getAddress(eoa, 0)
 *  - isSmartAccountDeployed: true if bytecode exists at that address
 *  - discoveryTriggered: true once POST /start-discovery has been sent to the agent
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import {
  useAccount,
  useDisconnect,
  useBalance,
  useReadContract,
  useBytecode,
} from 'wagmi';
import { formatEther } from 'viem';
import {
  Zeinyra_ACCOUNT_ADDRESS,
  Zeinyra_ACCOUNT_FACTORY_ADDRESS,
  ZeinyraAccountFactoryAbi,
} from '@/constants/contracts';
import { useEnvironment } from '@/contexts/EnvironmentContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletSession {
  address: `0x${string}`;
  ens?: string;
  chainId: number;
  chainName: string;
}

export interface WalletContextType {
  // ── Connection ────────────────────────────────────────────────────────────
  status: ConnectionStatus;
  session: WalletSession | null;
  error: string | null;
  isConnected: boolean;
  shortAddress: string | null;
  /** The connected EOA address (MetaMask / WalletConnect) */
  eoaAddress: `0x${string}` | undefined;

  // ── Smart Account ─────────────────────────────────────────────────────────
  /**
   * Predicted smart account address from Factory.getAddress(eoa, 0).
   * Populated as soon as the EOA is connected. null while loading.
   */
  smartAccountAddress: `0x${string}` | null;
  /** True when bytecode exists at smartAccountAddress (contract is deployed). */
  isSmartAccountDeployed: boolean;
  /** ETH balance of the predicted smart account address */
  smartWalletBalance: string | null;

  // ── Agent ─────────────────────────────────────────────────────────────────
  /** True while Factory.getAddress() is still in flight */
  isSmartAccountLoading: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  connect: (walletType?: WalletType) => void;
  disconnect: () => void;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  isModalOpen: boolean; // no-op, kept for API compat
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const CHAIN_NAME: Record<number, string> = {
  8453: 'Base',
  84532: 'Base Sepolia',
};

const AGENT_API = import.meta.env.VITE_AGENT_API_URL ?? 'http://localhost:8000';

// ── Context ───────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = (): WalletContextType => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { open: openAppKit } = useAppKit();
  const [localError] = useState<string | null>(null);
  const [discoveryTriggered, setDiscoveryTriggered] = useState(false);
  const discoveryRef = useRef<string | null>(null); // tracks last triggered address

  const { targetChain, environment } = useEnvironment();

  // ── 1. EOA connection state (wagmi) ─────────────────────────────────────────

  const { address: eoaAddress, chainId, isConnected, isConnecting } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // ── 2. Predict smart account address via Factory ─────────────────────────────
  // Factory.getAddress(owner, salt=0) → deterministic CREATE2 address

  const {
    data: predictedAddress,
    isLoading: predicting,
    isError: predictError,
  } = useReadContract({
    address: Zeinyra_ACCOUNT_FACTORY_ADDRESS,
    abi: ZeinyraAccountFactoryAbi,
    functionName: 'getAddress',
    args: eoaAddress ? [eoaAddress, BigInt(0)] : undefined,
    chainId: targetChain.id,
    query: {
      enabled: !!eoaAddress,
      staleTime: Infinity, // deterministic — never re-fetch
      retry: 2,            // retry twice before giving up
    },
  });

  // Stop loading as soon as wagmi settles (success or error after retries)
  const isSmartAccountLoading = !!eoaAddress && predicting && !predictError;

  // Prefer the on-chain factory prediction; fall back to the known deployed address
  // so balance / token reads work even if the factory RPC call fails.
  const smartAccountAddress: `0x${string}` | null =
    (predictedAddress as `0x${string}` | undefined) ??
    (eoaAddress ? Zeinyra_ACCOUNT_ADDRESS : null);

  // ── 3. Deployment check — useBytecode ────────────────────────────────────────

  const { data: bytecode } = useBytecode({
    address: smartAccountAddress ?? undefined,
    chainId: targetChain.id,
    query: { enabled: !!smartAccountAddress },
  });

  // bytecode is '0x' or undefined when not deployed; any non-empty value = deployed
  const isSmartAccountDeployed =
    typeof bytecode === 'string' && bytecode !== '0x' && bytecode.length > 2;

  // ── 4. Smart account ETH balance ─────────────────────────────────────────────

  const { data: swBalanceData } = useBalance({
    address: smartAccountAddress ?? undefined,
    chainId: targetChain.id,
    query: { enabled: !!smartAccountAddress },
  });

  const smartWalletBalance = swBalanceData
    ? `${parseFloat(formatEther(swBalanceData.value)).toFixed(4)} ${swBalanceData.symbol}`
    : null;

  // ── 5. Trigger agent discovery once address is known ─────────────────────────

  useEffect(() => {
    // Only fire once per predicted address, and only when connected
    if (!smartAccountAddress || !isConnected) return;
    if (discoveryRef.current === smartAccountAddress) return;

    discoveryRef.current = smartAccountAddress;
    setDiscoveryTriggered(false);

    fetch(`${AGENT_API}/start-discovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        account: smartAccountAddress,
        chainId: targetChain.id,
        env: environment.toLowerCase()
      }),
    })
      .then(() => setDiscoveryTriggered(true))
      .catch((err) => {
        // Agent may be offline — log and continue gracefully
        console.warn('[Zeinyra] Agent discovery trigger failed:', err.message);
        setDiscoveryTriggered(false);
      });
  }, [smartAccountAddress, isConnected, targetChain.id, environment]);

  // Reset discovery state on disconnect
  useEffect(() => {
    if (!isConnected) {
      discoveryRef.current = null;
      setDiscoveryTriggered(false);
    }
  }, [isConnected]);

  // ── 6. Derived status ────────────────────────────────────────────────────────

  let status: ConnectionStatus;
  if (isConnected) status = 'connected';
  else if (isConnecting || predicting) status = 'connecting';
  else if (localError) status = 'error';
  else status = 'disconnected';

  const session: WalletSession | null =
    eoaAddress && chainId
      ? {
        address: eoaAddress,
        chainId,
        chainName: CHAIN_NAME[chainId] ?? `Chain ${chainId}`,
      }
      : null;

  const shortAddress = eoaAddress ? shorten(eoaAddress) : null;

  // ── 7. Actions ───────────────────────────────────────────────────────────────

  const connect = useCallback((_walletType?: WalletType) => openAppKit(), [openAppKit]);
  const disconnect = useCallback(() => wagmiDisconnect(), [wagmiDisconnect]);
  const openConnectModal = useCallback(() => openAppKit(), [openAppKit]);
  const closeConnectModal = useCallback(() => { }, []); // AppKit controls its own close

  // ── 8. Context value ─────────────────────────────────────────────────────────

  const value: WalletContextType = {
    status,
    session,
    error: localError,
    isConnected,
    shortAddress,
    eoaAddress,
    smartAccountAddress,
    isSmartAccountDeployed,
    smartWalletBalance,
    isSmartAccountLoading,
    connect,
    disconnect,
    openConnectModal,
    closeConnectModal,
    isModalOpen: false,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
