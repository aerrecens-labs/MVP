import { useReadContract } from 'wagmi';
import { useWallet } from '@/contexts/WalletContext';
import { SESSION_MODULE_ADDRESS, sessionModuleAbi, AGENT_ID } from '@/constants/contracts';

/**
 * useAgentSession - Unifies on-chain agent session tracking.
 * 
 * Checks:
 * 1. agentOperators(1) -> Is an operator registered for Agent #1?
 * 2. isSessionActive(user, 1) -> Does the user have a currently valid session?
 */
export function useAgentSession() {
  const { eoaAddress, smartAccountAddress } = useWallet();
  const address = smartAccountAddress || eoaAddress;

  // 1. Fetch Agent Operator
  const { data: operatorAddress, isLoading: operatorLoading, refetch: refetchOperator } = useReadContract({
    address: SESSION_MODULE_ADDRESS,
    abi: sessionModuleAbi,
    functionName: 'agentOperators',
    args: [AGENT_ID],
    query: {
      enabled: !!address,
    }
  });

  // 2. Fetch Session Status
  const { data: onChainActive, isLoading: sessionLoading, refetch: refetchSession } = useReadContract({
    address: SESSION_MODULE_ADDRESS,
    abi: sessionModuleAbi,
    functionName: 'isSessionActive',
    args: address ? [address as `0x${string}`, AGENT_ID] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 15000, // Refresh every 15s when session is potential
    }
  });

  const isZeroAddress = operatorAddress === '0x0000000000000000000000000000000000000000';
  const hasOperator = !!operatorAddress && !isZeroAddress;
  const isSessionActive = !!onChainActive;

  return {
    address,
    hasOperator,
    isSessionActive,
    operatorAddress: operatorAddress as `0x${string}` | undefined,
    isLoading: operatorLoading || sessionLoading,
    refetch: () => {
      refetchOperator();
      refetchSession();
    }
  };
}
