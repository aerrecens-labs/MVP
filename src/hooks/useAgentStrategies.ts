import { useQuery } from '@tanstack/react-query';

const AGENT_BASE_URL = import.meta.env.VITE_AGENT_API_URL ?? 'http://localhost:8000';

export interface AgentOpportunityItem {
  protocol: string;
  target_protocol: string;
  current_protocol: string;
  pair: string;
  token: string;
  apy: number;
  target_apy: number;
  current_apy: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_tier: string;
  trust_tier?: number;
  security_note?: string;
  liquidity_depth: number;
  amount_usd: number;
  min_expected_apy_bps: number;
  upgrade_apy_bps: number;
  description: string;
  vault_address: string;
  is_recommended: boolean;
  token_id?: string | null;
}

export interface SplitEntry {
  protocol: string;
  pair: string;
  apy: number;
  risk_level: 'low' | 'medium' | 'high';
  trust_tier?: number;
  amount_usd: number;
  weight_pct: number;
}

export interface UserPreferences {
  min_apy_target: number;
  risk_tolerance: string;
  total_capital: number;
  is_active: boolean;
  activated_at: string | null;
}

export interface AgentStrategy {
  agent_id: number;
  last_updated: string;
  eth_price: number;
  vault_balances: {
    eth: number;
    usdc: number;
  };
  uniswap_v3: {
    token0: string;
    token1: string;
    fee: number;
    tickLower: number;
    tickUpper: number;
    liquidity: string;
    nft_id?: number;
  };
  analysis: {
    thesis: string;
    efficiency_score: number;
  };
  opportunities: AgentOpportunityItem[];
  split_strategy: SplitEntry[];
  user_preferences: UserPreferences;
}

import { useEnvironment } from '@/contexts/EnvironmentContext';
import { mockAgentStrategy } from '@/constants/mockData';

export function useAgentStrategies() {
  const { isMockMode } = useEnvironment();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AgentStrategy, Error>({
    queryKey: ['agentStrategies'],
    refetchInterval: 60000, // Poll every 60s to prevent 429 errors
    enabled: !isMockMode,
    queryFn: async () => {
      const res = await fetch(`${AGENT_BASE_URL}/strategies`);
      if (!res.ok) {
        throw new Error(`Agent API error: ${res.status} ${res.statusText}`);
      }
      return res.json() as Promise<AgentStrategy>;
    },
  });

  return {
    data: isMockMode ? (mockAgentStrategy as any) : (data ?? null),
    isLoading: !isMockMode && isLoading,
    isError: !isMockMode && isError,
    error: error as Error | null,
    refetch,
  };
}
