// Mock data for the crypto dashboard

export const portfolioPerformance = [
  { date: 'Jan 15', value: 125000, btc: 42000 },
  { date: 'Jan 17', value: 128500, btc: 42800 },
  { date: 'Jan 19', value: 126200, btc: 41900 },
  { date: 'Jan 21', value: 131000, btc: 43200 },
  { date: 'Jan 23', value: 129800, btc: 42600 },
  { date: 'Jan 25', value: 133500, btc: 43800 },
  { date: 'Jan 27', value: 130200, btc: 43100 },
  { date: 'Jan 29', value: 135800, btc: 44200 },
  { date: 'Jan 31', value: 132400, btc: 43500 },
  { date: 'Feb 02', value: 137200, btc: 44800 },
  { date: 'Feb 04', value: 134100, btc: 44100 },
  { date: 'Feb 06', value: 138900, btc: 45200 },
  { date: 'Feb 08', value: 136500, btc: 44600 },
  { date: 'Feb 10', value: 140200, btc: 45800 },
  { date: 'Feb 12', value: 139100, btc: 45400 },
  { date: 'Feb 14', value: 142500, btc: 46200 },
];

export const tokenAllocation = [
  { name: 'ETH', value: 40, amount: 57000, color: '#627EEA' },
  { name: 'USDC', value: 30, amount: 42750, color: '#2775CA' },
  { name: 'WBTC', value: 20, amount: 28500, color: '#F7931A' },
  { name: 'Others', value: 10, amount: 14250, color: '#00D4FF' },
];

export interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  balance: number;
  value: number;
  color: string;
  sparkline: number[];
}

export const tokens: Token[] = [
  {
    id: '1',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3245.82,
    change24h: 4.2,
    balance: 17.56,
    value: 57036.59,
    color: '#627EEA',
    sparkline: [3100, 3150, 3120, 3180, 3200, 3170, 3220, 3245],
  },
  {
    id: '2',
    name: 'USD Coin',
    symbol: 'USDC',
    price: 1.00,
    change24h: 0.01,
    balance: 42750.00,
    value: 42750.00,
    color: '#2775CA',
    sparkline: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  },
  {
    id: '3',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    price: 95420.50,
    change24h: 2.8,
    balance: 0.2987,
    value: 28502.16,
    color: '#F7931A',
    sparkline: [93000, 93500, 94200, 93800, 94800, 95100, 94900, 95420],
  },
  {
    id: '4',
    name: 'Chainlink',
    symbol: 'LINK',
    price: 18.42,
    change24h: -1.3,
    balance: 245.5,
    value: 4522.11,
    color: '#2A5ADA',
    sparkline: [19.2, 18.9, 18.6, 18.8, 18.5, 18.3, 18.5, 18.42],
  },
  {
    id: '5',
    name: 'Aave',
    symbol: 'AAVE',
    price: 285.30,
    change24h: 5.7,
    balance: 12.8,
    value: 3651.84,
    color: '#B6509E',
    sparkline: [265, 270, 275, 272, 280, 278, 283, 285],
  },
  {
    id: '6',
    name: 'Uniswap',
    symbol: 'UNI',
    price: 12.85,
    change24h: -0.8,
    balance: 180.0,
    value: 2313.00,
    color: '#FF007A',
    sparkline: [13.2, 13.0, 12.9, 13.1, 12.8, 12.9, 12.85, 12.85],
  },
  {
    id: '7',
    name: 'Lido DAO',
    symbol: 'LDO',
    price: 2.34,
    change24h: 3.1,
    balance: 850.0,
    value: 1989.00,
    color: '#00A3FF',
    sparkline: [2.2, 2.25, 2.28, 2.3, 2.27, 2.31, 2.33, 2.34],
  },
  {
    id: '8',
    name: 'Arbitrum',
    symbol: 'ARB',
    price: 1.42,
    change24h: 6.2,
    balance: 1200.0,
    value: 1704.00,
    color: '#28A0F0',
    sparkline: [1.3, 1.32, 1.35, 1.33, 1.38, 1.4, 1.41, 1.42],
  },
];

export interface DeFiPosition {
  id: string;
  protocol: string;
  type: 'liquidity' | 'lending' | 'borrowing' | 'staking';
  pair?: string;
  supplied?: number;
  borrowed?: number;
  apy: number;
  healthFactor?: number;
  unclaimedFees?: number;
  tvl: number;
  chain: string;
  risk: 'low' | 'medium' | 'high';
}

export const defiPositions: DeFiPosition[] = [
  {
    id: '1',
    protocol: 'Uniswap V3',
    type: 'liquidity',
    pair: 'ETH/USDC',
    apy: 18.5,
    unclaimedFees: 342.50,
    tvl: 24500,
    chain: 'Ethereum',
    risk: 'medium',
  },
  {
    id: '2',
    protocol: 'Aave V3',
    type: 'lending',
    supplied: 15000,
    apy: 4.2,
    healthFactor: 2.45,
    tvl: 15000,
    chain: 'Ethereum',
    risk: 'low',
  },
  {
    id: '3',
    protocol: 'Aave V3',
    type: 'borrowing',
    borrowed: 5200,
    apy: 3.8,
    healthFactor: 2.45,
    tvl: 5200,
    chain: 'Ethereum',
    risk: 'low',
  },
  {
    id: '4',
    protocol: 'Curve Finance',
    type: 'liquidity',
    pair: 'stETH/ETH',
    apy: 5.8,
    unclaimedFees: 128.90,
    tvl: 18200,
    chain: 'Ethereum',
    risk: 'low',
  },
  {
    id: '5',
    protocol: 'Lido',
    type: 'staking',
    supplied: 8500,
    apy: 3.9,
    tvl: 8500,
    chain: 'Ethereum',
    risk: 'low',
  },
  {
    id: '6',
    protocol: 'GMX',
    type: 'liquidity',
    pair: 'GLP Pool',
    apy: 22.4,
    unclaimedFees: 89.20,
    tvl: 6800,
    chain: 'Arbitrum',
    risk: 'high',
  },
  {
    id: '7',
    protocol: 'Compound V3',
    type: 'lending',
    supplied: 8000,
    apy: 3.5,
    healthFactor: 3.12,
    tvl: 8000,
    chain: 'Ethereum',
    risk: 'low',
  },
  {
    id: '8',
    protocol: 'Balancer V2',
    type: 'liquidity',
    pair: 'wstETH/WETH',
    apy: 7.2,
    unclaimedFees: 56.40,
    tvl: 12300,
    chain: 'Ethereum',
    risk: 'medium',
  },
];

export interface Transaction {
  id: string;
  type: 'swap' | 'send' | 'receive' | 'approve' | 'stake' | 'unstake' | 'claim';
  tokenFrom?: string;
  tokenTo?: string;
  amountFrom?: number;
  amountTo?: number;
  token?: string;
  amount?: number;
  timestamp: string;
  hash: string;
  status: 'confirmed' | 'pending' | 'failed';
  gasFee: number;
}

export const transactions: Transaction[] = [
  {
    id: '1',
    type: 'swap',
    tokenFrom: 'ETH',
    tokenTo: 'USDC',
    amountFrom: 2.5,
    amountTo: 8114.55,
    timestamp: '2026-02-14T22:30:00Z',
    hash: '0x8f3a...b2c1',
    status: 'confirmed',
    gasFee: 12.45,
  },
  {
    id: '2',
    type: 'stake',
    token: 'ETH',
    amount: 5.0,
    timestamp: '2026-02-14T18:15:00Z',
    hash: '0x4d2e...a8f3',
    status: 'confirmed',
    gasFee: 8.20,
  },
  {
    id: '3',
    type: 'claim',
    token: 'UNI',
    amount: 45.2,
    timestamp: '2026-02-13T14:22:00Z',
    hash: '0x7b1c...d4e2',
    status: 'confirmed',
    gasFee: 5.80,
  },
  {
    id: '4',
    type: 'receive',
    token: 'WBTC',
    amount: 0.15,
    timestamp: '2026-02-13T09:45:00Z',
    hash: '0x2a9f...c7b4',
    status: 'confirmed',
    gasFee: 0,
  },
  {
    id: '5',
    type: 'swap',
    tokenFrom: 'USDC',
    tokenTo: 'AAVE',
    amountFrom: 3000,
    amountTo: 10.52,
    timestamp: '2026-02-12T20:10:00Z',
    hash: '0x5e8d...f1a6',
    status: 'confirmed',
    gasFee: 15.30,
  },
  {
    id: '6',
    type: 'approve',
    token: 'USDC',
    amount: 999999,
    timestamp: '2026-02-12T20:08:00Z',
    hash: '0x1c4b...e9d3',
    status: 'confirmed',
    gasFee: 3.10,
  },
  {
    id: '7',
    type: 'send',
    token: 'ETH',
    amount: 1.2,
    timestamp: '2026-02-11T16:30:00Z',
    hash: '0x9a3e...b5c8',
    status: 'confirmed',
    gasFee: 6.50,
  },
  {
    id: '8',
    type: 'swap',
    tokenFrom: 'ARB',
    tokenTo: 'ETH',
    amountFrom: 500,
    amountTo: 0.22,
    timestamp: '2026-02-10T11:20:00Z',
    hash: '0x6d7f...a2e1',
    status: 'pending',
    gasFee: 2.10,
  },
];

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  time: string;
  read: boolean;
}

export const notifications: Notification[] = [
  {
    id: '1',
    title: 'Price Alert',
    message: 'ETH has crossed $3,200. Your target price has been reached.',
    type: 'success',
    read: false,
  },
  {
    id: '2',
    title: 'Health Factor Warning',
    message: 'Your Aave V3 position health factor is approaching 2.0. Consider adding collateral.',
    type: 'warning',
    read: false,
  },
  {
    id: '3',
    title: 'Yield Opportunity',
    message: 'New high-yield pool available on Curve: stETH/ETH at 8.2% APY.',
    type: 'info',
    read: false,
  },
  {
    id: '4',
    title: 'Transaction Confirmed',
    message: 'Your swap of 2.5 ETH to USDC has been confirmed on-chain.',
    type: 'success',
    read: true,
  },
  {
    id: '5',
    title: 'Gas Price Drop',
    message: 'Ethereum gas prices have dropped to 12 Gwei. Good time for transactions.',
    type: 'info',
    read: true,
  },
];

export interface YieldStrategy {
  id: string;
  name: string;
  protocol: string;
  apy: number;
  tvl: string;
  risk: 'low' | 'medium' | 'high';
  chain: string;
  description: string;
  tokens: string[];
}

export const yieldStrategies: YieldStrategy[] = [
  {
    id: '1',
    name: 'ETH Staking',
    protocol: 'Lido',
    apy: 3.9,
    tvl: '$14.2B',
    risk: 'low',
    chain: 'Ethereum',
    description: 'Stake ETH and receive stETH while earning staking rewards.',
    tokens: ['ETH', 'stETH'],
  },
  {
    id: '2',
    name: 'Stable Yield',
    protocol: 'Aave V3',
    apy: 4.2,
    tvl: '$8.5B',
    risk: 'low',
    chain: 'Ethereum',
    description: 'Supply USDC to earn lending interest with minimal risk.',
    tokens: ['USDC'],
  },
  {
    id: '3',
    name: 'LP Farming',
    protocol: 'Uniswap V3',
    apy: 18.5,
    tvl: '$3.2B',
    risk: 'medium',
    chain: 'Ethereum',
    description: 'Provide concentrated liquidity to ETH/USDC pair.',
    tokens: ['ETH', 'USDC'],
  },
  {
    id: '4',
    name: 'GLP Vault',
    protocol: 'GMX',
    apy: 22.4,
    tvl: '$420M',
    risk: 'high',
    chain: 'Arbitrum',
    description: 'Earn fees from perpetual trading as a liquidity provider.',
    tokens: ['GLP'],
  },
  {
    id: '5',
    name: 'Curve Pool',
    protocol: 'Curve Finance',
    apy: 5.8,
    tvl: '$2.1B',
    risk: 'low',
    chain: 'Ethereum',
    description: 'Provide liquidity to the stETH/ETH pool for stable yields.',
    tokens: ['stETH', 'ETH'],
  },
  {
    id: '6',
    name: 'Leveraged Yield',
    protocol: 'Compound V3',
    apy: 8.5,
    tvl: '$1.8B',
    risk: 'medium',
    chain: 'Ethereum',
    description: 'Supply and borrow in a loop for enhanced COMP rewards.',
    tokens: ['USDC', 'COMP'],
  },
];
