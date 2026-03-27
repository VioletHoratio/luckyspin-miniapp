import { concatHex, encodeFunctionData, Hex } from 'viem'

import { appConfig } from '@/lib/appConfig'

export const luckSpinAbi = [
  {
    type: 'function',
    name: 'play',
    stateMutability: 'payable',
    inputs: [{ name: 'commitHash', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'reveal',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'secret', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'spinPrice',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'jackpotPool',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'pendingRewards',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'lastWinnerLabel',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const

export const readLuckySpinContracts = [
  {
    address: appConfig.contractAddress,
    abi: luckSpinAbi,
    functionName: 'spinPrice',
  },
  {
    address: appConfig.contractAddress,
    abi: luckSpinAbi,
    functionName: 'jackpotPool',
  },
  {
    address: appConfig.contractAddress,
    abi: luckSpinAbi,
    functionName: 'lastWinnerLabel',
  },
] as const

function withBuilderSuffix(data: Hex) {
  return concatHex([data, appConfig.builderCodeEncoded as Hex])
}

export function buildPlayTransaction(commitHash: Hex, spinPrice: bigint) {
  return {
    to: appConfig.contractAddress,
    value: spinPrice,
    data: withBuilderSuffix(
      encodeFunctionData({
        abi: luckSpinAbi,
        functionName: 'play',
        args: [commitHash],
      }),
    ),
  }
}

export function buildRevealTransaction(secret: bigint) {
  return {
    to: appConfig.contractAddress,
    data: withBuilderSuffix(
      encodeFunctionData({
        abi: luckSpinAbi,
        functionName: 'reveal',
        args: [secret],
      }),
    ),
  }
}

export function buildClaimTransaction() {
  return {
    to: appConfig.contractAddress,
    data: withBuilderSuffix(
      encodeFunctionData({
        abi: luckSpinAbi,
        functionName: 'claim',
      }),
    ),
  }
}
