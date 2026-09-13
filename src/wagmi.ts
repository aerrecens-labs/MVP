/**
 * Zeinyra — Reown AppKit + Wagmi v2
 *
 * This file creates the WagmiAdapter and initialises the Reown AppKit modal.
 * The modal handles MetaMask, WalletConnect, Coinbase Wallet, and every other
 * mobile/desktop wallet automatically — no custom connect UI required.
 *
 * Required env var (set in Vercel Dashboard → Environment Variables):
 *   VITE_WALLETCONNECT_PROJECT_ID  ← from https://dashboard.reown.com
 */

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base as reownBase } from '@reown/appkit/networks';
import { http } from 'wagmi';

// Re-export viem-compatible chains for the rest of the app
export { base } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string;

if (!projectId) {
  console.warn(
    '[Zeinyra] VITE_WALLETCONNECT_PROJECT_ID is not set. ' +
      'Mobile wallets will not work. Add it to Vercel → Settings → Environment Variables.'
  );
}

// ── Networks ──────────────────────────────────────────────────────────────────

const networks = [reownBase] as [typeof reownBase];

// ── WagmiAdapter (replaces manual createConfig) ──────────────────────────────

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: projectId ?? 'placeholder',
  transports: {
    [reownBase.id]: http('https://1rpc.io/base'),
  },
  ssr: false, // Vite CSR app
});

// ── AppKit Modal (handles all wallet connections incl. MetaMask mobile) ───────

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId: projectId ?? 'placeholder',
  metadata: {
    name: 'Zeinyra',
    description: 'Autonomous DeFi Optimisation on Base',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://Zeinyra.vercel.app',
    icons: ['https://Zeinyra.vercel.app/favicon.ico'],
  },
  features: {
    analytics: false,  // disable cloud analytics
    email: false,      // no email login
    socials: [],       // no social login
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00D4FF',
    '--w3m-border-radius-master': '12px',
  },
});

/** The wagmiConfig for use in WagmiProvider */
export const wagmiConfig = wagmiAdapter.wagmiConfig;
