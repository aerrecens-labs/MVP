/**
 * usePortfolioHistory — Real portfolio value history.
 *
 * Strategy: fetch real ETH price history from CoinGecko's free public API,
 * then multiply each data point by the current ETH balance.
 *
 * This gives an accurate answer to "what was my portfolio worth over time?"
 * assuming the current ETH balance was held for the whole period (a reasonable
 * approximation for a wallet that has mostly held ETH).
 *
 * CoinGecko endpoint (no API key required):
 *   GET /api/v3/coins/ethereum/market_chart
 *     ?vs_currency=usd&days=<N>&precision=4
 *   Returns: { prices: [[timestampMs, priceUsd], ...] }
 *   - ≤90 days → hourly granularity
 *   - >90 days  → daily granularity
 */

import { useQuery } from '@tanstack/react-query';

export interface ChartPoint {
  date: string;
  value: number;   // portfolio USD value at this timestamp
  price: number;   // raw ETH price
}

type TimeRange = '24H' | '7D' | '30D' | '90D' | '1Y' | 'ALL';

// CoinGecko `days` param per time range
const DAYS: Record<TimeRange, string> = {
  '24H': '1',
  '7D':  '7',
  '30D': '30',
  '90D': '90',
  '1Y':  '365',
  'ALL': 'max',
};

// How many data points to display (subsample for readability)
const MAX_POINTS: Record<TimeRange, number> = {
  '24H': 24,
  '7D':  28,
  '30D': 30,
  '90D': 45,
  '1Y':  52,
  'ALL': 60,
};

function formatLabel(ts: number, range: TimeRange): string {
  const d = new Date(ts);
  if (range === '24H') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (range === '7D' || range === '30D') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  // 90D, 1Y, ALL
  return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
}

function subsample<T>(arr: T[], maxLen: number): T[] {
  if (arr.length <= maxLen) return arr;
  const step = Math.ceil(arr.length / maxLen);
  const result: T[] = [];
  for (let i = 0; i < arr.length; i += step) result.push(arr[i]);
  // Always include last point
  if (result[result.length - 1] !== arr[arr.length - 1]) {
    result.push(arr[arr.length - 1]);
  }
  return result;
}

async function fetchEthHistory(days: string): Promise<[number, number][]> {
  const url = `/api/coingecko-proxy?path=/coins/ethereum/market_chart` +
    `&vs_currency=usd&days=${days}&precision=4`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko market_chart: ${res.status}`);
  const json = await res.json() as { prices: [number, number][] };
  return json.prices;
}

import { useEnvironment } from '@/contexts/EnvironmentContext';
import { mockPortfolioHistory } from '@/constants/mockData';

export function usePortfolioHistory(
  ethBalance: number,
  range: TimeRange,
): {
  data: ChartPoint[];
  isLoading: boolean;
  isError: boolean;
  changePercent: number | null;
  changeDollar: number | null;
} {
  const { isMockMode } = useEnvironment();
  const days = DAYS[range];

  const { data: rawPrices, isLoading, isError } = useQuery<[number, number][]>({
    queryKey: ['eth-history', days],
    staleTime: 5 * 60 * 1000,  // 5 min cache
    gcTime: 15 * 60 * 1000,
    retry: 2,
    queryFn: () => fetchEthHistory(days),
    enabled: !isMockMode,
  });

  if (isMockMode) {
    const first = mockPortfolioHistory[0]?.value ?? 0;
    const last  = mockPortfolioHistory[mockPortfolioHistory.length - 1]?.value ?? 0;
    const changeDollar = last - first;
    const changePercent = first > 0 ? (changeDollar / first) * 100 : null;

    return { 
      data: mockPortfolioHistory, 
      isLoading: false, 
      isError: false, 
      changePercent, 
      changeDollar 
    };
  }

  if (!rawPrices || rawPrices.length === 0) {
    return { data: [], isLoading, isError, changePercent: null, changeDollar: null };
  }

  // Subsample for chart readability
  const sampled = subsample(rawPrices, MAX_POINTS[range]);

  const chartData: ChartPoint[] = sampled.map(([ts, price]) => ({
    date: formatLabel(ts, range),
    value: parseFloat((price * ethBalance).toFixed(2)),
    price,
  }));

  // Period change
  const first = chartData[0]?.value ?? 0;
  const last  = chartData[chartData.length - 1]?.value ?? 0;
  const changeDollar = last - first;
  const changePercent = first > 0 ? (changeDollar / first) * 100 : null;

  return { data: chartData, isLoading, isError, changePercent, changeDollar };
}
