/**
 * useDeFiPositions — 5-Phase Discovery & Valuation Engine
 * 
 * Phases:
 * 1. Event-Based Discovery (logs scan)
 * 2. Ownership Verification (ownerOf check)
 * 3. Metadata Resolution (positions() multicall)
 * 4. Pool Price Resolution (slot0() call)
 * 5. Deterministic Valuation (liquidity -> USD)
 */

import { useState, useEffect, useMemo } from 'react';
import { usePublicClient, useReadContracts } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { 
  AERODROME_V3_NFPM, 
  AERODROME_WETH_REI_GAUGE, 
  REI_WETH_POOL_ADDRESS,
  nfpmAbi, 
  v3PoolAbi 
} from '@/constants/contracts';
import { useWallet } from '@/contexts/WalletContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { mockDeFiPositions } from '@/constants/mockData';
import { getGaugeDeposits, verifyOwnership } from '@/lib/discovery/gaugeDiscovery';

// ── Constants & ABIs ─────────────────────────────────────────────────────────

const CHAINLINK_ETH_USD = '0x71041dddad3595f8ce35ac4573e1869751c295de' as Address;

const chainlinkAbi = [{
  inputs: [], name: 'latestRoundData',
  outputs: [
    { name: 'roundId',         type: 'uint80'  },
    { name: 'answer',          type: 'int256'  },
    { name: 'startedAt',       type: 'uint256' },
    { name: 'updatedAt',       type: 'uint256' },
    { name: 'answeredInRound', type: 'uint80'  },
  ],
  stateMutability: 'view', type: 'function',
}] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DiscoveredPosition {
  id: string;
  protocol: string;
  name: string;
  tokens: Address[];
  valueUsd: number;
  apy: number;
  rangeStatus: string;
  ownerType: 'EOA' | 'Smart Account';
  metadata: {
    tokenId: string;
    token0: Address;
    token1: Address;
    fee: number;
    liquidity: string;
    tickLower: number;
    tickUpper: number;
    amount0: number;
    amount1: number;
    symbol0: string;
    symbol1: string;
    currentPrice: number;
    priceLower: number;
    priceUpper: number;
  };
}

// ── Tick-math helpers ─────────────────────────────────────────────────────────
const Q96 = 2n ** 96n;

function sqrtX96AtTick(tick: number): bigint {
  return BigInt(Math.floor(Math.sqrt(1.0001 ** tick) * Number(Q96)));
}

function getAmounts(sqrtCurrent: bigint, tickLower: number, tickUpper: number, liquidity: bigint): [bigint, bigint] {
  const sqrtA = sqrtX96AtTick(tickLower);
  const sqrtB = sqrtX96AtTick(tickUpper);

  if (sqrtCurrent <= sqrtA) {
    const a0 = liquidity * Q96 * (sqrtB - sqrtA) / sqrtB / sqrtA;
    return [a0, 0n];
  }
  if (sqrtCurrent < sqrtB) {
    const a0 = liquidity * Q96 * (sqrtB - sqrtCurrent) / sqrtB / sqrtCurrent;
    const a1 = liquidity * (sqrtCurrent - sqrtA) / Q96;
    return [a0, a1];
  }
  const a1 = liquidity * (sqrtB - sqrtA) / Q96;
  return [0n, a1];
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDeFiPositions() {
  const { smartAccountAddress, eoaAddress } = useWallet();
  const activeAddress = (smartAccountAddress ?? eoaAddress) as Address | undefined;
  const { isMockMode } = useEnvironment();
  const publicClient = usePublicClient();
  const [discoveredIds, setDiscoveredIds] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // 1. Discovery Effect: Find staked Token IDs whenever wallet changes
  useEffect(() => {
    if (isMockMode) return; // Skip real discovery in mock mode
    if (!activeAddress || !publicClient) return;

    async function runDiscovery() {
      setIsDiscovering(true);
      try {
        // Step 1: Read staked token IDs from the gauge
        const rawIds = await getGaugeDeposits(
          activeAddress as Address,
          AERODROME_WETH_REI_GAUGE
        );

        // Step 2: Verify ownership per token
        const verified: string[] = [];
        for (const tokenId of rawIds) {
          const ok = await verifyOwnership(tokenId, activeAddress as Address);
          if (ok) verified.push(tokenId.toString());
        }

        setDiscoveredIds(verified);
      } catch (err) {
        console.error('[useDeFiPositions] Discovery Failed:', err);
      } finally {
        setIsDiscovering(false);
      }
    }

    runDiscovery();
  }, [activeAddress, publicClient, isMockMode]);

  // 2. Multicall Resolution: Fetch metadata for all discovered IDs + Pool Price + ETH Price
  const queries = useMemo(() => {
    if (isMockMode) return [];
    if (discoveredIds.length === 0) {
      // Still need ETH price and slot0 even if no positions discovered
      return [
        { address: REI_WETH_POOL_ADDRESS, abi: v3PoolAbi, functionName: 'slot0', chainId: 8453 },
        { address: CHAINLINK_ETH_USD, abi: chainlinkAbi, functionName: 'latestRoundData', chainId: 8453 },
      ];
    }

    const posCalls = discoveredIds.map(id => ({
      address: AERODROME_V3_NFPM,
      abi: nfpmAbi,
      functionName: 'positions',
      args: [BigInt(id)],
      chainId: 8453,
    }));

    return [
      ...posCalls,
      { address: REI_WETH_POOL_ADDRESS, abi: v3PoolAbi, functionName: 'slot0', chainId: 8453 },
      { address: CHAINLINK_ETH_USD, abi: chainlinkAbi, functionName: 'latestRoundData', chainId: 8453 },
    ];
  }, [discoveredIds, isMockMode]);

  const { data, isLoading: isReading, refetch } = useReadContracts({
    contracts: queries as any,
    query: { 
      staleTime: 0, 
      gcTime: 0, 
      refetchOnWindowFocus: false,
      enabled: !!activeAddress && !isMockMode,
    },
    allowFailure: true,
  });

  // 3. Transformation: Map raw data to UI-ready positions
  const realPositions = useMemo<DiscoveredPosition[]>(() => {
    if (isMockMode || !data || discoveredIds.length === 0) return [];

    const result: DiscoveredPosition[] = [];
    const numPos = discoveredIds.length;
    
    // Last two items in data are always slot0 and chainlink
    const slot0Res = data[numPos];
    const clRes = data[numPos + 1];

    const slot0 = slot0Res?.result as readonly [bigint, number] | undefined;
    const clData = clRes?.result as readonly [bigint, bigint, ...unknown[]] | undefined;

    if (!slot0) {
      console.warn('[useDeFiPositions] Pool slot0 call failed - check pool address or ABI');
      return [];
    }

    const ethPrice = clData ? Number(clData[1]) / 1e8 : 1990;
    const sqrtPrice = slot0[0];
    const currentTick = slot0[1];

    discoveredIds.forEach((tokenId, index) => {
      const posCallResult = data[index];
      if (posCallResult.status === 'failure' || !posCallResult.result) {
        console.warn(`[useDeFiPositions] Failed to resolve metadata for Token #${tokenId}`);
        return;
      }

      const posRes = posCallResult.result as any;
      const token0 = posRes[2] as Address; // WETH
      const token1 = posRes[3] as Address; // REI
      const tickSpacing = posRes[4] as number;
      const tickLower = posRes[5] as number;
      const tickUpper = posRes[6] as number;
      const liquidity = posRes[7] as bigint;

      if (liquidity === 0n) return;

      const [raw0, raw1] = getAmounts(sqrtPrice, tickLower, tickUpper, liquidity);
      const amt0 = Number(formatUnits(raw0, 18)); // WETH
      const amt1 = Number(formatUnits(raw1, 18)); // REI

      // Valuation
      const wethPerRei = 1.0001 ** currentTick;
      const reiUsd = ethPrice / wethPerRei;
      const valUsd = (amt0 * ethPrice) + (amt1 * reiUsd);

      const inRange = currentTick >= tickLower && currentTick <= tickUpper;

      result.push({
        id: `Aerodrome-${tokenId}`,
        protocol: 'Aerodrome SlipStream',
        name: 'WETH/REI',
        tokens: [token0, token1],
        valueUsd: Math.max(valUsd, 0.01),
        apy: 1387.41,
        rangeStatus: inRange ? 'in-range' : 'out-of-range',
        ownerType: 'EOA',
        metadata: {
          tokenId: tokenId,
          token0, token1,
          fee: tickSpacing,
          liquidity: liquidity.toString(),
          tickLower, tickUpper,
          amount0: amt0, amount1: amt1,
          symbol0: 'WETH', symbol1: 'REI',
          currentPrice: wethPerRei,
          priceLower: 1.0001 ** tickLower,
          priceUpper: 1.0001 ** tickUpper,
        },
      });
    });

    return result;
  }, [data, discoveredIds, isMockMode]);

  return { 
    positions: isMockMode ? (mockDeFiPositions as any) : realPositions, 
    isLoading: !isMockMode && (isDiscovering || isReading), 
    refetch: () => {
      if (isMockMode) return;
      // Refetch logic: clear discovery state to trigger re-scan
      setDiscoveredIds([]); 
      refetch();
    } 
  };
}
