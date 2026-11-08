import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/contexts/WalletContext';

const AGENT_BASE_URL = import.meta.env.VITE_AGENT_API_URL ?? 'http://localhost:8000';

// ── Response types from Zeinyra Agent POST /optimize ─────────────────────────

export interface AgentOpportunity {
  current_protocol: string;
  current_apy: number;
  target_protocol: string;
  target_apy: number;
  token: string;
  amount_usd: number;
  min_expected_apy_bps: number;
  upgrade_apy_bps: number;
  token_id?: string;
  vault_address?: string;
  risk_tier?: string;
  stability_score?: number;
  description?: string;
}

export interface RejectionLog {
  timestamp: number;
  project: string;
  token: string;
  reason: string;
  details: string;
}

export interface AgentPosition {
  protocol: string;
  tokens: string[];
  value_usd: number;
  vault_address: string | null;
  apy_pct: number;
  yield_type: 'Lending' | 'LP' | 'Staked' | 'Wallet';
  yield_protocol: string;
  token_id: string | null;
  staked_amounts: Record<string, number> | null;
  pending_rewards: Record<string, number> | null;
  range_status?: string;
}

export interface AgentResponse {
  wallet_address: string;
  positions_found: number;
  positions?: AgentPosition[];
  opportunities: AgentOpportunity[];
  registration_status?: string;
  rejection_logs?: RejectionLog[];
  autonomous_action?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

import { useEnvironment } from '@/contexts/EnvironmentContext';
import { mockAgentStrategy } from '@/constants/mockData';

export function useAgentData(addressOverride?: string | null): {
  data: AgentResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { eoaAddress } = useWallet();
  const { isMockMode } = useEnvironment();
  const address = addressOverride ?? eoaAddress;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AgentResponse, Error>({
    queryKey: ['agentOptimize', address],
    enabled: !!address && !isMockMode,
    // Only fetch once per session — agent scan takes time
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    queryFn: async () => {
      const res = await fetch(`${AGENT_BASE_URL}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          account: address,
          chainId: 8453, // Strictly Base Mainnet
          env: 'production' 
        }),
      });
      if (!res.ok) {
        throw new Error(`Agent API error: ${res.status} ${res.statusText}`);
      }
      return res.json() as Promise<AgentResponse>;
    },
  });

  const mockResponse: AgentResponse = {
    wallet_address: address || '0x000...000',
    positions_found: 3,
    opportunities: mockAgentStrategy.opportunities as any,
    registration_status: 'registered',
  };

  return {
    data: isMockMode ? mockResponse : (data ?? null),
    isLoading: !isMockMode && isLoading,
    isError: !isMockMode && isError,
    error: error as Error | null,
    refetch,
  };
}
