import { Address } from 'viem';
import { wagmiConfig } from '@/wagmi';
import { AERODROME_V3_NFPM, clGaugeAbi, nfpmAbi } from '@/constants/contracts';
import { getPublicClient } from '@wagmi/core';

/**
 * Get all gauge deposits (staked NFT positions) for a user
 * @param userAddress - The user's wallet address
 * @param gaugeAddress - The gauge contract address
 * @returns Array of token IDs that are staked in the gauge
 */
export async function getGaugeDeposits(
  userAddress: Address,
  gaugeAddress: Address
): Promise<bigint[]> {
  try {
    const publicClient = getPublicClient(wagmiConfig, { chainId: 8453 }); // Base mainnet

    const stakedTokenIds = await publicClient.readContract({
      address: gaugeAddress,
      abi: clGaugeAbi,
      functionName: 'stakedValues',
      args: [userAddress],
    });

    return stakedTokenIds as bigint[];
  } catch (error) {
    console.error('Failed to get gauge deposits:', error);
    return [];
  }
}

/**
 * Verify ownership of an NFT position
 * @param tokenId - The NFT token ID to verify
 * @param expectedOwner - The expected owner address
 * @returns True if the expected owner owns the token, false otherwise
 */
export async function verifyOwnership(
  tokenId: bigint,
  expectedOwner: Address
): Promise<boolean> {
  try {
    const publicClient = getPublicClient(wagmiConfig, { chainId: 8453 }); // Base mainnet

    const owner = await publicClient.readContract({
      address: AERODROME_V3_NFPM,
      abi: nfpmAbi,
      functionName: 'ownerOf',
      args: [tokenId],
    });

    return owner.toLowerCase() === expectedOwner.toLowerCase();
  } catch (error) {
    console.error('Failed to verify ownership:', error);
    return false;
  }
}