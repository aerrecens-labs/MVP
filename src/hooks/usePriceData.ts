/**
 * usePriceData — Real ETH price + 24h change from CoinGecko's free public API.
 * No API key required.
 *
 * Endpoint: https://api.coingecko.com/api/v3/simple/price
 *   ?ids=ethereum&vs_currencies=usd&include_24hr_change=true
 *
 * Returns { ethPriceUsd, eth24hChange, isLoading, isError }
 * Caches for 5 minutes to avoid hitting the free-tier rate limit.
 */

import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import { useMemo } from 'react';

const COINGECKO_URL =
  '/api/coingecko-proxy?path=/simple/price' +
  '&ids=ethereum&vs_currencies=usd&include_24hr_change=true';

const CHAINLINK_ETH_USD = '0x71041dddad3595f8ce35ac4573e1869751c295de';
const CHAINLINK_ABI = [
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      { "internalType": "uint80", "name": "roundId", "type": "uint80" },
      { "internalType": "int256", "name": "answer", "type": "int256" },
      { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
      { "internalType": "uint256", "name": "updatedAt", "type": "uint256" },
      { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface CoinGeckoResponse {
  ethereum: {
    usd: number;
    usd_24h_change: number;
  };
}

export function usePriceData(): {
  ethPriceUsd: number;
  eth24hChangePct: number; // e.g. -1.23 means -1.23%
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useQuery<CoinGeckoResponse>({
    queryKey: ['coingecko-eth-price'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
    queryFn: async () => {
      const res = await fetch(COINGECKO_URL);
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      return res.json() as Promise<CoinGeckoResponse>;
    },
  });

  const { data: chainlinkData, isLoading: clLoading, isError: clError } = useReadContract({
    address: CHAINLINK_ETH_USD,
    abi: CHAINLINK_ABI,
    functionName: 'latestRoundData',
    chainId: 8453,
  });

  const ethPriceUsd = useMemo(() => {
    if (chainlinkData) return Number(chainlinkData[1]) / 1e8;
    return data?.ethereum?.usd ?? 0;
  }, [chainlinkData, data]);

  return {
    ethPriceUsd,
    eth24hChangePct: data?.ethereum?.usd_24h_change ?? 0,
    isLoading: clLoading || isLoading,
    isError: clError || isError,
  };
}
