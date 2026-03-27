'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Coins,
  Gift,
  LoaderCircle,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wallet,
} from 'lucide-react'
import {
  BaseError,
  bytesToHex,
  formatEther,
  formatUnits,
  Hex,
  keccak256,
  parseEther,
  toHex,
} from 'viem'
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  usePublicClient,
  useSendTransaction,
  useSwitchChain,
} from 'wagmi'
import { base } from 'wagmi/chains'

import { appConfig } from '@/lib/appConfig'
import {
  luckSpinAbi,
  readLuckySpinContracts,
  buildClaimTransaction,
  buildPlayTransaction,
  buildRevealTransaction,
} from '@/lib/luckySpin'

const rewardTiers = [
  { label: 'Jackpot', color: 'from-amber-300 to-yellow-500', weight: '1x' },
  { label: 'Epic', color: 'from-orange-300 to-orange-500', weight: '3x' },
  { label: 'Rare', color: 'from-teal-300 to-cyan-500', weight: '6x' },
  { label: 'Replay', color: 'from-fuchsia-300 to-pink-500', weight: '10x' },
] as const

const featureCards = [
  {
    title: 'Provable cadence',
    text: 'Commit your spin, wait one block, then reveal with transparent onchain resolution.',
    icon: ShieldCheck,
  },
  {
    title: 'Pool momentum',
    text: 'Every spin tops up the jackpot pool and keeps the board alive for the next replay.',
    icon: Coins,
  },
  {
    title: 'Instant loop',
    text: 'Low-friction rounds and a visible claim path make it easy to play again immediately.',
    icon: RotateCw,
  },
] as const

export function SpinExperience() {
  const publicClient = usePublicClient({ chainId: base.id })
  const { address, isConnected } = useAccount()
  const { connectAsync, connectors, isPending: isConnecting } = useConnect()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()
  const chainId = useChainId()
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction()

  const [spinSecret, setSpinSecret] = useState<bigint | null>(null)
  const [status, setStatus] = useState('Connect a Base wallet to start spinning.')
  const [txHash, setTxHash] = useState<Hex | null>(null)
  const [blockReady, setBlockReady] = useState(false)
  const [spinPrice, setSpinPrice] = useState<bigint>(parseEther('0.0005'))
  const [jackpotPool, setJackpotPool] = useState<bigint>(0n)
  const [pendingReward, setPendingReward] = useState<bigint>(0n)
  const [lastWinner, setLastWinner] = useState<string>('Transparent rounds onchain')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: balance } = useBalance({
    address,
    chainId: base.id,
    query: { enabled: Boolean(address) },
  })

  const activeConnector = useMemo(
    () =>
      connectors.filter(
        (connector) => connector.id === 'coinbaseWalletSDK' || connector.id === 'injected',
      ),
    [connectors],
  )

  const refreshContractState = async () => {
    if (!publicClient) return
    setIsRefreshing(true)

    try {
      const results = await publicClient.multicall({
        allowFailure: true,
        contracts: readLuckySpinContracts,
      })

      const [priceResult, poolResult, winnerResult] = results

      if (priceResult.status === 'success') setSpinPrice(priceResult.result)
      if (poolResult.status === 'success') setJackpotPool(poolResult.result)
      if (winnerResult.status === 'success') setLastWinner(winnerResult.result)

      if (address) {
        const rewardResult = await publicClient.readContract({
          address: appConfig.contractAddress,
          abi: luckSpinAbi,
          functionName: 'pendingRewards',
          args: [address],
        })

        setPendingReward(rewardResult)
      } else {
        setPendingReward(0n)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void refreshContractState()
  }, [address, publicClient])

  useEffect(() => {
    if (!txHash || !publicClient) return

    let active = true
    setBlockReady(false)

    publicClient
      .waitForTransactionReceipt({ hash: txHash })
      .then(async (receipt) => {
        if (!active) return
        setStatus(`Transaction confirmed in block ${receipt.blockNumber.toString()}.`)
        const latest = await publicClient.getBlockNumber()
        setBlockReady(latest > receipt.blockNumber)
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      active = false
    }
  }, [publicClient, txHash])

  const ensureBase = async () => {
    if (chainId === base.id) return
    await switchChainAsync({ chainId: base.id })
  }

  const handleConnect = async () => {
    const preferred = activeConnector[0]
    if (!preferred) return
    await connectAsync({ connector: preferred })
  }

  const handleSpin = async () => {
    if (!address || !publicClient) return

    try {
      await ensureBase()

      const randomBuffer = crypto.getRandomValues(new Uint8Array(32))
      const randomSecret = BigInt(bytesToHex(randomBuffer))
      const commitHash = keccak256(toHex(randomSecret, { size: 32 }))
      const transaction = buildPlayTransaction(commitHash, spinPrice)

      setSpinSecret(randomSecret)
      setStatus('Submitting your spin to the Base jackpot contract...')

      const hash = await sendTransactionAsync({
        account: address,
        ...transaction,
      })

      setTxHash(hash)
      setStatus('Spin submitted. Wait for one more block, then reveal the result.')
      await refreshContractState()
    } catch (error) {
      setStatus(normalizeError(error))
    }
  }

  const handleReveal = async () => {
    if (!address || !spinSecret) return

    try {
      await ensureBase()
      setStatus('Revealing your spin result onchain...')

      const hash = await sendTransactionAsync({
        account: address,
        ...buildRevealTransaction(spinSecret),
      })

      setTxHash(hash)
      setStatus('Reveal sent. Your reward state is updating onchain.')
      await refreshContractState()
    } catch (error) {
      setStatus(normalizeError(error))
    }
  }

  const handleClaim = async () => {
    if (!address) return

    try {
      await ensureBase()
      setStatus('Claiming available rewards from the pool...')

      const hash = await sendTransactionAsync({
        account: address,
        ...buildClaimTransaction(),
      })

      setTxHash(hash)
      setStatus('Claim sent. Watch your wallet for the payout.')
      await refreshContractState()
    } catch (error) {
      setStatus(normalizeError(error))
    }
  }

  const balanceText = balance ? Number(formatEther(balance.value)).toFixed(4) : '--'
  const pendingRewardText =
    pendingReward > 0n ? `${formatUnits(pendingReward, 18)} ETH` : 'No pending claim'
  const canReveal = Boolean(spinSecret && blockReady)

  return (
    <main className="relative overflow-hidden px-4 pb-20 pt-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-sm text-orange-100">
                <Sparkles className="h-4 w-4" />
                Base Mini App | Builder {appConfig.builderCode}
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                  Spin the wheel. Feed the pool. Chase the jackpot.
                </h1>
                <p className="max-w-2xl text-balance text-base text-orange-50/80 sm:text-lg">
                  LuckySpin is a replayable Base lottery game where every paid spin grows the
                  onchain prize pool, every reveal stays transparent, and every claim is ready
                  for instant momentum.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile label="Spin price" value={`${formatUnits(spinPrice, 18)} ETH`} />
                <StatTile label="Jackpot pool" value={`${formatUnits(jackpotPool, 18)} ETH`} />
                <StatTile label="Pending reward" value={pendingRewardText} />
              </div>

              <div className="flex flex-wrap gap-3">
                {isConnected ? (
                  <ActionButton
                    onClick={handleSpin}
                    disabled={isSending || isSwitching}
                    icon={Trophy}
                    label={isSending ? 'Sending...' : 'Play Spin'}
                  />
                ) : (
                  <ActionButton
                    onClick={handleConnect}
                    disabled={isConnecting}
                    icon={Wallet}
                    label={isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  />
                )}

                <ActionButton
                  onClick={handleReveal}
                  disabled={!canReveal || isSending || isSwitching}
                  icon={Gift}
                  label="Reveal"
                  variant="secondary"
                />
                <ActionButton
                  onClick={handleClaim}
                  disabled={!isConnected || pendingReward === 0n || isSending || isSwitching}
                  icon={Coins}
                  label="Claim"
                  variant="secondary"
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-orange-50/80">
                <div className="flex items-center justify-between gap-3">
                  <span>{status}</span>
                  <button
                    type="button"
                    onClick={() => void refreshContractState()}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white transition hover:border-orange-300/40 hover:text-orange-200"
                  >
                    {isRefreshing ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCw className="h-3.5 w-3.5" />
                    )}
                    Refresh
                  </button>
                </div>
                {txHash ? (
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-orange-200 underline-offset-4 hover:underline"
                  >
                    View latest transaction
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="w-full max-w-xl space-y-4">
              <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-400/25 via-white/5 to-cyan-300/10 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-orange-100/60">
                      Reward Wheel
                    </p>
                    <p className="text-2xl font-semibold text-white">High-frequency replay loop</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm">
                    {isConnected ? `${balanceText} ETH` : 'Wallet idle'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {rewardTiers.map((tier, index) => (
                    <motion.div
                      key={tier.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 }}
                      className={`rounded-[1.5rem] border border-white/10 bg-gradient-to-br ${tier.color} p-[1px]`}
                    >
                      <div className="rounded-[1.4rem] bg-[#120f18]/90 p-4">
                        <div className="text-sm text-white/60">{tier.weight} window</div>
                        <div className="mt-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
                          {tier.label}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoPill label="Contract" value={shorten(appConfig.contractAddress)} />
                  <InfoPill label="Last visible winner" value={lastWinner} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {featureCards.map((card, index) => (
                  <motion.article
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                    className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4"
                  >
                    <card.icon className="h-8 w-8 text-orange-300" />
                    <h2 className="mt-4 text-lg font-semibold text-white">{card.title}</h2>
                    <p className="mt-2 text-sm text-orange-50/70">{card.text}</p>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr,0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-orange-100/50">How it works</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <FlowCard
                step="01"
                title="Play"
                text="Generate a secret locally, hash it into a commit, and send play(bytes32) with the spin price."
              />
              <FlowCard
                step="02"
                title="Reveal"
                text="After the next block, reveal your secret through reveal(uint256) to resolve the spin."
              />
              <FlowCard
                step="03"
                title="Claim"
                text="If the contract owes you rewards, trigger claim() and route the payout straight back to your wallet."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-orange-100/50">Attribution</p>
            <div className="mt-5 space-y-4 text-sm text-orange-50/75">
              <p>
                Builder code and encoded suffix stay in config so transaction entry points can
                append Base Builder attribution without hardcoding deploy secrets.
              </p>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-orange-100/50">Encoded suffix</p>
                <p className="mt-2 break-all font-mono text-xs text-orange-200">
                  {appConfig.builderCodeEncoded}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-orange-100/50">Wallet support</p>
                <p className="mt-2">Coinbase Wallet + injected wallets on Base mainnet only.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-orange-100/45">{label}</div>
      <div className="mt-3 text-xl font-semibold text-white">{value}</div>
    </div>
  )
}

function ActionButton({
  onClick,
  disabled,
  icon: Icon,
  label,
  variant = 'primary',
}: {
  onClick: () => void | Promise<void>
  disabled?: boolean
  icon: typeof Trophy
  label: string
  variant?: 'primary' | 'secondary'
}) {
  const style =
    variant === 'primary'
      ? 'bg-gradient-to-r from-orange-400 to-amber-300 text-ink'
      : 'border border-white/10 bg-white/5 text-white'

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 ${style}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function FlowCard({
  step,
  title,
  text,
}: {
  step: string
  title: string
  text: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-orange-200">{step}</div>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-orange-50/70">{text}</p>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-orange-100/45">{label}</div>
      <div className="mt-2 text-sm text-white">{value}</div>
    </div>
  )
}

function shorten(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function normalizeError(error: unknown) {
  if (error instanceof BaseError) return error.shortMessage
  if (error instanceof Error) return error.message
  return 'Transaction failed. Check your wallet and try again.'
}

