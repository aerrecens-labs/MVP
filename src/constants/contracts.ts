/**
 * Zeinyra — Deployed Contract Addresses & ABIs (Base Mainnet)
 * All contracts deployed via Zeinyra-foundry / DeployBase.s.sol
 */

// ── Configuration ─────────────────────────────────────────────────────────────
export const AGENT_ID = 0n;

// ── Zeinyra Suite (Base Mainnet) ──────────────────────────────────────────────────────────────────

export const Zeinyra_AGENT_NFT_ADDRESS =
  '0x5eCeC712ab5a1DFfaeab0086f04124574D5913Ec' as const;

export const Zeinyra_ACCOUNT_ADDRESS =
  '0x8e31f83987E7034949C865DFac3089B5634E604a' as const;

export const Zeinyra_ACCOUNT_FACTORY_ADDRESS =
  '0x52bdc8eb286b279aab769fc3ec433cc8df61ce43' as const;

export const INTENT_REGISTRY_ADDRESS =
  '0x142f2c70fb19a46b2c71052cf0f5c72210bd737b' as const;

export const SESSION_MODULE_ADDRESS =
  '0x94044d6cdf49f1278f4a097776f40dd6e5943820' as const;

export const ENTRY_POINT_ADDRESS =
  '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as const;

// ── Mainnet Protocol Addresses ────────────────────────────────────────────────

export const PROTOCOL_SAFE_ADDRESS =
  '0x51C02040F21e0a1aABB2c94b7019F85dCb75845F' as const;

export const UNISWAP_V3_NFPM = 
  '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1' as const;

export const WETH_ADDRESS =
  '0x4200000000000000000000000000000000000006' as const;

export const USDC_ADDRESS =
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

export const REI_ADDRESS = 
  '0x7bAc3ef8D8AbE37d45e99852230E6a5D26EEF177' as const;

export const AAVE_V3_POOL = 
  '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as const;

export const COMPOUND_V3_USDC_COMET = 
  '0xb12442345e54dC0aCf1f5C6e031802Bc58Db63A1' as const;

export const AERODROME_V3_NFPM = 
  '0xa990C6a764B73BF43Cee5BB40339C3322fb9D55f' as const;

// Gauge contract that currently holds your staked REI/WETH NFT #3570965
export const AERODROME_WETH_REI_GAUGE =
  '0x7A01529B70DD997D7723D4AA2EEC0CC301E0E6CF' as const;

export const AERODROME_BASE_DEPLOY_BLOCK = 14506359n; // Slipstream launch on Base

// REI/WETH Concentrated Liquidity Pool on Base (for slot0 price queries)
// VERIFIED via Gauge.pool() on BaseScan: 0x34E3334E845d101205394e0Bd8821fDdc7Cd5559
export const REI_WETH_POOL_ADDRESS =
  '0x34E3334E845d101205394e0Bd8821fDdc7Cd5559' as const;

export const UNISWAP_V3_FACTORY = 
  '0x33128a8fC170d56ED8068694826a670eA064B44c' as const;

export const AERODROME_FACTORY = 
  '0x5e2Af7303A4f38C047642731F03960337b545454' as const;

// ── Standard ABIs ─────────────────────────────────────────────────────────────

export const erc20Abi = [
  { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "stateMutability": "view", "type": "function" }
] as const;

export const v3FactoryAbi = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" },
      { "internalType": "uint24", "name": "fee", "type": "uint24" }
    ],
    "name": "getPool",
    "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const v3PoolAbi = [
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
      { "internalType": "int24", "name": "tick", "type": "int24" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidity",
    "outputs": [{ "internalType": "uint128", "name": "", "type": "uint128" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Aerodrome Slipstream NFPM positions() ABI
// NOTE: Field 5 is 'tickSpacing' (int24), NOT 'fee' (uint24) — Aerodrome-specific
export const nfpmAbi = [
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "positions",
    "outputs": [
      { "internalType": "uint96", "name": "nonce", "type": "uint96" },
      { "internalType": "address", "name": "operator", "type": "address" },
      { "internalType": "address", "name": "token0", "type": "address" },
      { "internalType": "address", "name": "token1", "type": "address" },
      { "internalType": "int24", "name": "tickSpacing", "type": "int24" },
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

// Aerodrome CLGauge ABI — for querying staked NFT positions
// stakedValues(address) returns all tokenIds staked by a given user in one call
export const clGaugeAbi = [
  {
    "inputs": [{ "internalType": "address", "name": "depositor", "type": "address" }],
    "name": "stakedValues",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "depositor", "type": "address" }],
    "name": "stakedLength",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ── ZeinyraAccountFactory ABI ────────────────────────────────────────────────
// getAddress(owner, salt) → deterministic smart account address (CREATE2)

export const ZeinyraAccountFactoryAbi = [
  {
    type: 'function',
    name: 'getAddress',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'salt',  type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'createAccount',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'salt',  type: 'uint256' },
    ],
    outputs: [{ name: 'ret', type: 'address' }],
  },
] as const;



// ── IntentRegistry ABI ────────────────────────────────────────────────────────
// Source: Zeinyra-foundry/src/IntentRegistry.sol

export const intentRegistryAbi = [
  {
    type: 'function',
    name: 'registerIntent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      {
        name: 'intent',
        type: 'tuple',
        components: [
          { name: 'targetVault', type: 'address' },
          { name: 'functionSelector', type: 'bytes4' },
          { name: 'minExpectedAPY', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'callData', type: 'bytes' },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'activeIntents',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [
      { name: 'targetVault', type: 'address' },
      { name: 'functionSelector', type: 'bytes4' },
      { name: 'minExpectedAPY', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'callData', type: 'bytes' },
    ],
  },
  {
    type: 'function',
    name: 'agentNftAddress',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'event',
    name: 'IntentRegistered',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'target', type: 'address', indexed: true },
    ],
  },
] as const;

// ── ZeinyraSessionModule ABI ─────────────────────────────────────────────────
// Source: Zeinyra-foundry/src/ZeinyraSessionModule.sol

export const sessionModuleAbi = [
  {
    type: 'function',
    name: 'createSession',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'sessionKey', type: 'address' },
      { name: 'agentId', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'agentOperators',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'setAgentOperator',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isSessionActive',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'agentId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'sessions',
    stateMutability: 'view',
    inputs: [
      { name: 'userWallet', type: 'address' },
      { name: 'sessionKey', type: 'address' },
    ],
    outputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'validateSessionOp',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'sessionKey', type: 'address' },
      { name: 'agentId', type: 'uint256' },
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'event',
    name: 'SessionCreated',
    anonymous: false,
    inputs: [
      { name: 'userWallet', type: 'address', indexed: true },
      { name: 'sessionKey', type: 'address', indexed: true },
      { name: 'agentId', type: 'uint256', indexed: false },
      { name: 'expiry', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SessionValidated',
    anonymous: false,
    inputs: [
      { name: 'userWallet', type: 'address', indexed: true },
      { name: 'sessionKey', type: 'address', indexed: true },
      { name: 'agentId', type: 'uint256', indexed: false },
      { name: 'target', type: 'address', indexed: false },
    ],
  },
] as const;

// ── ZeinyraAccount ABI ───────────────────────────────────────────────────────
// Source: Zeinyra-foundry/src/ZeinyraAccount.sol (key functions only)

export const ZeinyraAccountAbi = [
  {
    type: 'function',
    name: 'execute',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'dest', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'func', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setSessionModule',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_module', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'pubKeyX',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'pubKeyY',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'entryPoint',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'event',
    name: 'SessionModuleSet',
    anonymous: false,
    inputs: [{ name: 'module', type: 'address', indexed: true }],
  },
] as const;
