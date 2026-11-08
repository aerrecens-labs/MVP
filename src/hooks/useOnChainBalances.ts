import { useBalance, useReadContracts, useAccount } from 'wagmi';
import { useMemo } from 'react';
import { formatUnits, type Address } from 'viem';
import { 
  USDC_ADDRESS, 
  WETH_ADDRESS, 
  REI_ADDRESS, 
  erc20Abi 
} from '@/constants/contracts';
import { useWallet } from '@/contexts/WalletContext';

export interface WalletAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  price: number;
  color: string;
}

import { useEnvironment } from '@/contexts/EnvironmentContext';

export function useOnChainBalances() {
  const { address } = useAccount();
  const { smartAccountAddress } = useWallet();
  const { isMockMode } = useEnvironment();

  // HIGH-EFFICIENCY ONE-SHOT PASS
  const tokens = useMemo(() => [
    { address: USDC_ADDRESS, symbol: 'USDC', name: 'USD Coin', decimals: 6, color: '#2775CA' },
    { address: WETH_ADDRESS, symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, color: '#627EEA' },
    { address: REI_ADDRESS, symbol: 'REI', name: 'REI Network', decimals: 18, color: '#F97316' },
  ], []);

  const universalFetch = useReadContracts({
    contracts: [
      // Balances for SA
      ...tokens.map(t => ({ address: t.address, abi: erc20Abi, functionName: 'balanceOf' as const, args: [smartAccountAddress as Address], chainId: 8453 })),
      // Balances for EOA
      ...tokens.map(t => ({ address: t.address, abi: erc20Abi, functionName: 'balanceOf' as const, args: [address as Address], chainId: 8453 })),
      // Price for ETH (Chainlink)
      { address: '0x71041dddad3595f8ce35ac4573e1869751c295de', abi: [{ inputs: [], name: 'latestRoundData', outputs: [{ name: 'roundId', type: 'uint80' }, { name: 'answer', type: 'int256' }, { name: 'startedAt', type: 'uint256' }, { name: 'updatedAt', type: 'uint256' }, { name: 'answeredInRound', type: 'uint80' }], stateMutability: 'view', type: 'function' }] as const, functionName: 'latestRoundData', chainId: 8453 },
    ],
    query: { staleTime: 60000, refetchOnWindowFocus: false, enabled: !isMockMode }
  });

  const eoaEth = useBalance({ address: address as Address, chainId: 8453, query: { staleTime: 60000, refetchOnWindowFocus: false, enabled: !isMockMode } });
  const saEth = useBalance({ address: smartAccountAddress as Address, chainId: 8453, query: { staleTime: 60000, refetchOnWindowFocus: false, enabled: !isMockMode } });

  const processed = useMemo(() => {
    if (isMockMode) {
      const mockAssets: WalletAsset[] = [
        { id: 'native-eth', symbol: 'ETH', name: 'Ethereum', balance: 1.57, price: 2580.42, usdValue: 4051.26, color: '#627EEA' },
        { id: USDC_ADDRESS.toLowerCase(), symbol: 'USDC', name: 'USD Coin', balance: 3850, price: 1, usdValue: 3850, color: '#2775CA' },
        { id: 'aero-mock', symbol: 'AERO', name: 'Aerodrome', balance: 15420.5, price: 0.85, usdValue: 13107.42, color: '#00D4FF' },
      ];
      return { assets: mockAssets, ethPrice: 2580.42 };
    }

    const list: WalletAsset[] = [];
    const clRes = universalFetch.data?.[tokens.length * 2]?.result as any;
    const ethPrice = clRes ? Number(clRes[1]) / 1e8 : 3500;

    // 1. Native ETH
    const totalEth = (Number(eoaEth.data?.value || 0n) + Number(saEth.data?.value || 0n)) / 1e18;
    if (totalEth > 0.00001) {
      list.push({ id: 'native-eth', symbol: 'ETH', name: 'Ethereum', balance: totalEth, price: ethPrice, usdValue: totalEth * ethPrice, color: '#627EEA' });
    }

    // 2. ERC20s
    if (universalFetch.data) {
      tokens.forEach((t, i) => {
        const saBalRaw = universalFetch.data![i]?.result as bigint || 0n;
        const eoaBalRaw = universalFetch.data![i + tokens.length]?.result as bigint || 0n;
        const total = Number(formatUnits(saBalRaw + eoaBalRaw, t.decimals));

        if (total > 0.0001) {
          const price = t.symbol === 'USDC' ? 1 : (t.symbol === 'WETH' ? ethPrice : 0.01);
          list.push({ id: t.address.toLowerCase(), symbol: t.symbol, name: t.name, balance: total, price, usdValue: total * price, color: t.color });
        }
      });
    }

    return { assets: list.sort((a, b) => b.usdValue - a.usdValue), ethPrice };
  }, [universalFetch.data, eoaEth.data, saEth.data, tokens, isMockMode]);

  return { assets: processed.assets, ethPrice: processed.ethPrice, isLoading: !isMockMode && (universalFetch.isLoading || eoaEth.isLoading || saEth.isLoading) };
}
