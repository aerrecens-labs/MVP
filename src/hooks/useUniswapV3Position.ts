import { useReadContract, useReadContracts } from 'wagmi';
import { useMemo } from 'react';
import { formatUnits } from 'viem';

const UNISWAP_V3_NFPM = '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1';
const POOL_WETH_USDC_500 = '0x4C36388bE6F416A29C8d8Eee81C771cE6bE14B18';

const NFPM_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "positions",
    "outputs": [
      { "internalType": "uint96", "name": "nonce", "type": "uint96" },
      { "internalType": "address", "name": "operator", "type": "address" },
      { "internalType": "address", "name": "token0", "type": "address" },
      { "internalType": "address", "name": "token1", "type": "address" },
      { "internalType": "uint24", "name": "fee", "type": "uint24" },
      { "internalType": "int24", "name": "tickLower", "type": "int24" },
      { "internalType": "int24", "name": "tickUpper", "type": "int24" },
      { "internalType": "uint128", "name": "liquidity", "type": "uint128" },
      { "internalType": "uint256", "name": "feeGrowthInside0LastX128", "type": "uint256" },
      { "internalType": "uint256", "name": "feeGrowthInside1LastX128", "type": "uint256" },
      { "internalType": "uint128", "name": "tokensOwed0", "type": "uint128" },
      { "internalType": "uint128", "name": "tokensOwed1", "type": "uint128" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const POOL_ABI = [
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
      { "internalType": "int24", "name": "tick", "type": "int24" },
      { "internalType": "uint16", "name": "observationIndex", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinality", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16" },
      { "internalType": "uint8", "name": "feeProtocol", "type": "uint8" },
      { "internalType": "bool", "name": "unlocked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ── Tick Math ─────────────────────────────────────────────────────────────────

const Q96 = 2n ** 96n;

function getSqrtRatioAtTick(tick: number): bigint {
  const ratio = Math.sqrt(1.0001 ** tick);
  return BigInt(Math.floor(ratio * Number(Q96)));
}

function getAmount0ForLiquidity(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    const temp = sqrtRatioAX96;
    sqrtRatioAX96 = sqrtRatioBX96;
    sqrtRatioBX96 = temp;
  }
  const numerator1 = liquidity << 96n;
  const numerator2 = sqrtRatioBX96 - sqrtRatioAX96;
  return (numerator1 * numerator2) / sqrtRatioBX96 / sqrtRatioAX96;
}

function getAmount1ForLiquidity(sqrtRatioAX96: bigint, sqrtRatioBX96: bigint, liquidity: bigint): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    const temp = sqrtRatioAX96;
    sqrtRatioAX96 = sqrtRatioBX96;
    sqrtRatioBX96 = temp;
  }
  return (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / Q96;
}

function getAmountsForLiquidity(
  sqrtRatioX96: bigint,
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint
): [bigint, bigint] {
  let sqrtA = sqrtRatioAX96;
  let sqrtB = sqrtRatioBX96;
  
  if (sqrtA > sqrtB) {
    sqrtA = sqrtRatioBX96;
    sqrtB = sqrtRatioAX96;
  }

  let amount0 = 0n;
  let amount1 = 0n;

  if (sqrtRatioX96 <= sqrtA) {
    amount0 = getAmount0ForLiquidity(sqrtA, sqrtB, liquidity);
  } else if (sqrtRatioX96 < sqrtB) {
    amount0 = getAmount0ForLiquidity(sqrtRatioX96, sqrtB, liquidity);
    amount1 = getAmount1ForLiquidity(sqrtA, sqrtRatioX96, liquidity);
  } else {
    amount1 = getAmount1ForLiquidity(sqrtA, sqrtB, liquidity);
  }

  return [amount0, amount1];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useUniswapV3Position(tokenId: number) {
  const { data: positionsData } = useReadContract({
    address: UNISWAP_V3_NFPM,
    abi: NFPM_ABI,
    functionName: 'positions',
    args: [BigInt(tokenId)],
    chainId: 8453,
  });

  const { data: slot0Data } = useReadContract({
    address: POOL_WETH_USDC_500,
    abi: POOL_ABI,
    functionName: 'slot0',
    chainId: 8453,
  });

  return useMemo(() => {
    if (!positionsData || !slot0Data) {
      return {
        amount0: 0,
        amount1: 0,
        tickLower: 0,
        tickUpper: 0,
        currentTick: 0,
        inRange: false,
        isLoading: true
      };
    }

    const [
      nonce, operator, token0, token1, fee, tickLower, tickUpper, liquidity
    ] = positionsData as any;

    const [sqrtPriceX96, tick] = slot0Data as any;

    const sqrtRatioAX96 = getSqrtRatioAtTick(tickLower);
    const sqrtRatioBX96 = getSqrtRatioAtTick(tickUpper);

    const [amt0, amt1] = getAmountsForLiquidity(
      BigInt(sqrtPriceX96),
      sqrtRatioAX96,
      sqrtRatioBX96,
      BigInt(liquidity)
    );

    // token0 is WETH (0x42000), token1 is USDC (0x83358)
    const formattedWeth = Number(formatUnits(amt0, 18));
    const formattedUsdc = Number(formatUnits(amt1, 6));

    const getPrice = (t: number) => (1.0001 ** t) * 1e12;
    const currentPrice = getPrice(Number(tick));
    const priceLower = getPrice(Number(tickLower));
    const priceUpper = getPrice(Number(tickUpper));

    const totalValue = (formattedWeth * currentPrice) + formattedUsdc;
    const inRange = tick >= tickLower && tick <= tickUpper;

    return {
      amountWeth: formattedWeth,
      amountUsdc: formattedUsdc,
      currentPrice,
      priceLower,
      priceUpper,
      totalValue,
      inRange,
      isLoading: false
    };
  }, [positionsData, slot0Data]);
}
