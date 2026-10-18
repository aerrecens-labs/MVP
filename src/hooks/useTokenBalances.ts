import { useBalance, useReadContracts } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { usePriceData } from '@/hooks/usePriceData';
import { USDC_ADDRESS, WETH_ADDRESS } from '@/constants/contracts';

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Metadata for tokens we track
const TOKEN_META = [
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
    decimals: 18,
    // ETH comes from useBalance, not useReadContracts
  },
  {
    id: 'weth',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    color: '#627EEA',
    address: WETH_ADDRESS,
    decimals: 18,
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    color: '#2775CA',
    address: 'dynamic', // Decided in hook
    decimals: 6,
  },
] as const;

export interface LiveToken {
  id: string;
  symbol: string;
  name: string;
  color: string;
  /** raw balance as a human-readable string */
  balance: number;
  /** placeholder — no price oracle wired yet */
  price: number;
  usdValue: number;
  change24h: number;
  sparkline: number[];
}

export function useTokenBalances(accountAddress?: `0x${string}` | null): {
  tokens: LiveToken[];
  isLoading: boolean;
  totalUsd: number;
} {
  const enabled = !!accountAddress;

  const { targetChain, environment, isMockMode } = useEnvironment();
  const currentUsdcAddress = USDC_ADDRESS;

  // ── ETH balance ────────────────────────────────────────────────────────────
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: accountAddress ?? undefined,
    chainId: targetChain.id,
    query: { enabled: enabled && !isMockMode },
  });

  // ── ERC-20 balances (WETH + USDC) ─────────────────────────────────────────
  const { data: erc20Results, isLoading: erc20Loading } = useReadContracts({
    contracts: [
      {
        address: WETH_ADDRESS,
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [accountAddress ?? '0x0000000000000000000000000000000000000000'],
        chainId: targetChain.id,
      },
      {
        address: currentUsdcAddress,
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [accountAddress ?? '0x0000000000000000000000000000000000000000'],
        chainId: targetChain.id,
      },
    ],
    query: { enabled: enabled && !isMockMode },
  });

  const isLoading = !isMockMode && (ethLoading || erc20Loading);

  // ── Live prices from CoinGecko ──────────────────────────────────────────────
  const { ethPriceUsd } = usePriceData();

  // ── Build LiveToken array ────────────────────────────────────────────────────
  const ethBalanceNum = isMockMode ? 1.57 : (ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0);
  const wethBalanceNum = isMockMode ? 0.0 : (erc20Results?.[0]?.result != null ? parseFloat(formatUnits(erc20Results[0].result as bigint, 18)) : 0);
  const usdcDecimals = 6;
  const usdcBalanceNum = isMockMode ? 3850.0 : (erc20Results?.[1]?.result != null ? parseFloat(formatUnits(erc20Results[1].result as bigint, usdcDecimals)) : 0);

  // Live prices: ETH and WETH track the real market price; USDC is always $1.
  const ETH_PRICE_USD = isMockMode ? 2580.42 : ethPriceUsd;
  const WETH_PRICE_USD = isMockMode ? 2580.42 : ethPriceUsd;
  const USDC_PRICE_USD = 1;

  const tokens: LiveToken[] = [
    {
      id: 'eth',
      symbol: 'ETH',
      name: 'Ethereum',
      color: '#627EEA',
      balance: ethBalanceNum,
      price: ETH_PRICE_USD,
      usdValue: ethBalanceNum * ETH_PRICE_USD,
      change24h: 2.45,
      sparkline: [ETH_PRICE_USD * 0.98, ETH_PRICE_USD * 1.02, ETH_PRICE_USD],
    },
    {
      id: 'weth',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      color: '#627EEA',
      balance: wethBalanceNum,
      price: WETH_PRICE_USD,
      usdValue: wethBalanceNum * WETH_PRICE_USD,
      change24h: 2.45,
      sparkline: [WETH_PRICE_USD * 0.98, WETH_PRICE_USD * 1.02, WETH_PRICE_USD],
    },
    {
      id: 'usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      color: '#2775CA',
      balance: usdcBalanceNum,
      price: USDC_PRICE_USD,
      usdValue: usdcBalanceNum * USDC_PRICE_USD,
      change24h: 0,
      sparkline: [1, 1, 1],
    },
  ];

  const totalUsd = tokens.reduce((sum, t) => sum + t.usdValue, 0);

  return { tokens, isLoading, totalUsd };
}
