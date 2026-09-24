
import { Address } from 'viem';

export const MOCK_EOA_ADDRESS = '0x1234567890123456789012345678901234567890' as Address;
export const MOCK_SMART_ACCOUNT = '0x0987654321098765432109876543210987654321' as Address;

// --- 1. Portfolio History (Synthetic Growth) ---
export const mockPortfolioHistory = [
  { date: 'Mar 05', value: 9200, price: 2100 },
  { date: 'Mar 10', value: 9450, price: 2250 },
  { date: 'Mar 15', value: 9380, price: 2180 },
  { date: 'Mar 20', value: 9700, price: 2350 },
  { date: 'Mar 25', value: 9950, price: 2420 },
  { date: 'Mar 30', value: 10200, price: 2480 },
  { date: 'Apr 01', value: 10450, price: 2520 },
  { date: 'Apr 03', value: 10582, price: 2580 },
];

// --- 2. DeFi Positions ($10,000 Total Allocation) ---
export const mockDeFiPositions = [
  {
    id: 'Aerodrome-Mock-1',
    protocol: 'Aerodrome SlipStream',
    name: 'WETH/AERO',
    tokens: ['0x4200000000000000000000000000000000000006', '0x94017f2943a17973d224207a048a6058e3989c44'] as Address[],
    valueUsd: 4000.00,
    apy: 45.2,
    rangeStatus: 'in-range',
    ownerType: 'Smart Account' as const,
    metadata: {
      tokenId: '9842',
      token0: '0x4200000000000000000000000000000000000006' as Address,
      token1: '0x94017f2943a17973d224207a048a6058e3989c44' as Address,
      fee: 100,
      liquidity: '4500000000000000000',
      tickLower: -2000,
      tickUpper: 2000,
      amount0: 0.82,
      amount1: 15420.5,
      symbol0: 'WETH',
      symbol1: 'AERO',
      currentPrice: 18520,
      priceLower: 15000,
      priceUpper: 22000,
    }
  },
  {
    id: 'Uniswap-Mock-1',
    protocol: 'Uniswap V3 (Base)',
    name: 'WETH/USDC',
    tokens: ['0x4200000000000000000000000000000000000006', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'] as Address[],
    valueUsd: 4000.00,
    apy: 15.6,
    rangeStatus: 'in-range',
    ownerType: 'Smart Account' as const,
    metadata: {
      tokenId: '124456',
      token0: '0x4200000000000000000000000000000000000006' as Address,
      token1: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
      fee: 500,
      liquidity: '850000000000000000',
      tickLower: -5000,
      tickUpper: 5000,
      amount0: 0.75,
      amount1: 1850,
      symbol0: 'WETH',
      symbol1: 'USDC',
      currentPrice: 2580,
      priceLower: 2200,
      priceUpper: 3000,
    }
  },
  {
    id: 'Beefy-Mock-1',
    protocol: 'Beefy Finance',
    name: 'Moonwell USDC Vault',
    tokens: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'] as Address[],
    valueUsd: 2000.00,
    apy: 8.1,
    rangeStatus: 'active',
    ownerType: 'Smart Account' as const,
    metadata: {
      tokenId: 'beefy-well-usdc',
      token0: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
      token1: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
      fee: 0,
      liquidity: '2000000000',
      tickLower: 0,
      tickUpper: 0,
      amount0: 2000,
      amount1: 0,
      symbol0: 'USDC',
      symbol1: 'USDC',
      currentPrice: 1,
      priceLower: 1,
      priceUpper: 1,
    }
  }
];

// --- 3. AI Agent Upgrades (+35% APY boost total) ---
export const mockAgentStrategy = {
  agent_id: 1,
  last_updated: new Date().toISOString(),
  eth_price: 2580.42,
  vault_balances: { eth: 1.57, usdc: 3850 },
  analysis: {
    thesis: "Detected inefficient capital allocation in 'WETH/USDC' and 'WETH/AERO' pools. By concentrating liquidity and utilizing the new Aerodrome Slipstream gauges, we can achieve 57.2% aggregate APY (+35.3% boost).",
    efficiency_score: 88
  },
  split_strategy: [
    {
      protocol: 'Aerodrome',
      pair: 'WETH/AERO',
      apy: 60.4,
      weight_pct: 40,
      amount_usd: 4000
    },
    {
      protocol: 'Uniswap V3',
      pair: 'WETH/USDC',
      apy: 28.0,
      weight_pct: 40,
      amount_usd: 4000
    },
    {
      protocol: 'Beefy Finance',
      pair: 'BIFI-MAXI',
      apy: 13.2,
      weight_pct: 20,
      amount_usd: 2000
    }
  ],
  user_preferences: {
    min_apy_target: 35.0,
    risk_tolerance: 'medium',
    is_active: true,
    total_capital: 10000
  },
  opportunities: [
    {
      protocol: 'Aerodrome',
      target_protocol: 'Aerodrome SlipStream',
      current_protocol: 'Aerodrome V2',
      pair: 'WETH/AERO',
      token: 'vNFT-9842',
      apy: 45.2,
      target_apy: 60.4,
      current_apy: 45.2,
      risk_level: 'low',
      risk_tier: 'A',
      liquidity_depth: 12500000,
      amount_usd: 4000,
      upgrade_apy_bps: 1520,
      description: "Migration to the 0.3% Slipstream Gauge will unlock higher incentive emissions for your WETH/AERO position.",
      vault_address: '0x940...3820',
      is_recommended: true
    },
    {
      protocol: 'Uniswap V3',
      target_protocol: 'Uniswap V3',
      current_protocol: 'Uniswap V3',
      pair: 'WETH/USDC',
      token: 'vNFT-124456',
      apy: 15.6,
      target_apy: 28.0,
      current_apy: 15.6,
      risk_level: 'medium',
      risk_tier: 'B+',
      liquidity_depth: 45000000,
      amount_usd: 4000,
      upgrade_apy_bps: 1240,
      description: "Narrowing your price range to $2,400-$2,800 will increase fee collection efficiency by 2.4x.",
      vault_address: '0xa99...D55f',
      is_recommended: true
    },
    {
      protocol: 'Beefy Finance',
      target_protocol: 'Beefy Finance',
      current_protocol: 'Moonwell',
      pair: 'USDC-USDbC LP',
      token: 'USDC',
      apy: 8.1,
      target_apy: 13.2,
      current_apy: 8.1,
      risk_level: 'low',
      risk_tier: 'A',
      liquidity_depth: 8500000,
      amount_usd: 2000,
      upgrade_apy_bps: 510,
      description: "Switching from the singular Moonwell vault to the USDC-USDbC LP vault adds trading fee revenue.",
      vault_address: '0x52b...ce43',
      is_recommended: true
    },
    {
      protocol: 'Zeinyra Agent',
      target_protocol: 'Auto-Compounder v1',
      current_protocol: 'Manual Harvesting',
      pair: 'Global Portfolio',
      token: 'Rewards',
      apy: 0,
      target_apy: 2.3,
      current_apy: 0,
      risk_level: 'low',
      risk_tier: 'S',
      liquidity_depth: 0,
      amount_usd: 10000,
      upgrade_apy_bps: 230,
      description: "Enable the 'Intent Harvest' module to automatically compound rewards twice daily, minimizing gas slippage.",
      vault_address: '0x142...737b',
      is_recommended: true
    }
  ]
};

// --- 4. Mock AI Chat Conversation ---
export const mockChatConversation = [
  { sender: 'user', text: "How are my positions fetching yield?" },
  { sender: 'agent', text: "Scanning your active vaults on Base Mainnet... I've identified your $10,000 allocation across Uniswap, Aerodrome, and Beefy. You are currently earning an aggregate 22.4% APY." },
  { sender: 'user', text: "Can we do better?" },
  { sender: 'agent', text: "Yes. I've found 4 potential upgrades. The most critical is migrating your Aerodrome WETH/AERO position to Slipstream. This alone adds 15.2% to your yield. In total, I can boost your performance by **+35% APY**. Would you like me to prepare the 'Intent' signatures?" },
  { sender: 'user', text: "What's the risk increase?" },
  { sender: 'agent', text: "The risk profile remains 'Low-Medium'. My proposed Uniswap re-range is slightly more aggressive but remains within 1.5 standard deviations of current ETH volatility. Your safety is my priority." }
];

// --- 5. Mock Transaction History ---
export const mockTransactions = [
  {
    id: 'tx-1',
    type: 'stake' as const,
    token: 'WETH/AERO',
    amount: 0.85,
    timestamp: new Date().toISOString(),
    hash: '0x8f3a...b2c1',
    status: 'confirmed' as const,
    gasFee: 0.12,
  },
  {
    id: 'tx-2',
    type: 'swap' as const,
    tokenFrom: 'USDC',
    tokenTo: 'WETH',
    amountFrom: 1850,
    amountTo: 0.72,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    hash: '0x4d2e...a8f3',
    status: 'confirmed' as const,
    gasFee: 0.15,
  },
  {
    id: 'tx-3',
    type: 'approve' as const,
    token: 'USDC',
    amount: 1000000,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    hash: '0x7b1c...d4e2',
    status: 'confirmed' as const,
    gasFee: 0.05,
  },
  {
    id: 'tx-4',
    type: 'receive' as const,
    token: 'ETH',
    amount: 5.2,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    hash: '0x2a9f...c7b4',
    status: 'confirmed' as const,
    gasFee: 0,
  }
];
