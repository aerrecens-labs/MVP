import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Droplet, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useQueryClient } from '@tanstack/react-query';
import { useWaitForTransactionReceipt } from 'wagmi';

const ProvisioningModal: React.FC = () => {
    const { environment } = useEnvironment();
    const { smartAccountAddress } = useWallet();
    const queryClient = useQueryClient();

    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'provisioning' | 'success' | 'confirmed' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

    // Check localStorage and conditionally open modal when entering SANDBOX
    useEffect(() => {
        if (environment === 'SANDBOX') {
            const hasProvisioned = localStorage.getItem('Zeinyra_sandbox_provisioned');
            if (!hasProvisioned) {
                // Small delay so it doesn't pop instantly on page load
                const timer = setTimeout(() => setIsOpen(true), 1500);
                return () => clearTimeout(timer);
            }
        } else {
            setIsOpen(false);
        }
    }, [environment]);

    // Listen for manual trigger events from elsewhere in the app
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('openProvisioningModal', handleOpen);
        return () => window.removeEventListener('openProvisioningModal', handleOpen);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Remember that the user closed it so we don't nag them again this session
        localStorage.setItem('Zeinyra_sandbox_provisioned', 'true');
    };

    const handleProvision = async () => {
        if (!smartAccountAddress) return;

        setStatus('provisioning');
        setProgress(0);

        // Simulate progress bar while API call is "in-flight"
        const interval = setInterval(() => {
            setProgress(p => (p >= 90 ? 90 : p + 15));
        }, 400);

        try {
            // Real API Call to FastAPI Backend
            const agentUrl = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8000';
            const response = await fetch(`${agentUrl}/sandbox/provision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    smart_account_address: smartAccountAddress,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.detail || 'Failed to provision funds');
            }

            const data = await response.json();
            if (data.tx_hash) {
                setTxHash(data.tx_hash);
            }

            clearInterval(interval);
            setProgress(100);
            setStatus('success');
        } catch (e: unknown) {
            clearInterval(interval);
            const msg = e instanceof Error ? e.message : 'Failed to provision funds. Please try again.';
            setErrorMessage(msg);
            setStatus('error');
        }
    };

    // ── Wait for confirmation ────────────────────────────────────────────────────
    const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    useEffect(() => {
        if (isConfirmed && status === 'success') {
            setStatus('confirmed');

            // Fire confetti
            const end = Date.now() + 1.5 * 1000;
            const colors = ['#00D4FF', '#00FFA3', '#F97316'];

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());

            // Invalidate all react-query caches to force wagmi to refetch all balances
            queryClient.invalidateQueries();

            // Auto close after success
            setTimeout(() => {
                handleClose();
            }, 4500);
        }
    }, [isConfirmed, status, queryClient]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={status !== 'provisioning' ? handleClose : undefined}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
                        style={{
                            background: 'linear-gradient(180deg, rgba(30,15,5,0.95) 0%, rgba(20,10,3,0.95) 100%)',
                            border: '1px solid rgba(249,115,22,0.2)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30">
                                    <Droplet size={16} className="text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">Sandbox Environment</h3>
                                    <p className="text-[11px] text-gray-400 font-mono">Base Sepolia Testnet</p>
                                </div>
                            </div>
                            {status !== 'provisioning' && (
                                <button
                                    onClick={handleClose}
                                    className="p-1 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {status === 'idle' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        Welcome to the Zeinyra Sandbox. To interact with the AI Agent and register intent, your Smart Account needs testnet gas.
                                    </p>
                                    <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                        <p className="text-xs text-orange-200">
                                            We will automatically fund your Smart Account:
                                        </p>
                                        <p className="text-[11px] font-mono text-orange-400 break-all mt-1">
                                            {smartAccountAddress || 'Connect wallet to predict address'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(status === 'provisioning' || status === 'success') && (
                                <div className="py-4 space-y-6">
                                    <div className="flex flex-col items-center justify-center text-center gap-3">
                                        {status === 'provisioning' || (status === 'success' && !isConfirmed) ? (
                                            <Loader2 size={32} className="animate-spin text-orange-500" />
                                        ) : (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                                            >
                                                <CheckCircle2 size={40} className="text-[#00FFA3]" />
                                            </motion.div>
                                        )}
                                        <div>
                                            <h4 className="text-base font-semibold text-white">
                                                {status === 'provisioning' || (status === 'success' && !isConfirmed) ? 'Injecting Liquidity...' : 'Provisioning Complete!'}
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {status === 'provisioning' || (status === 'success' && !isConfirmed) ? 'Awaiting on-chain confirmation' : '0.1 ETH has been credited to your Smart Account.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar Container */}
                                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                background: 'linear-gradient(90deg, #F97316 0%, #EAB308 100%)',
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    </div>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="py-4 text-center space-y-2">
                                    <p className="text-sm text-red-400 font-semibold">Provisioning Failed</p>
                                    <p className="text-xs text-red-300/70 leading-relaxed">{errorMessage}</p>
                                    <p className="text-[10px] text-gray-500 mt-1">If the faucet is empty, you can use the public <a href="https://www.coinbase.com/faucets/base-ethereum-goerli-faucet" target="_blank" rel="noopener noreferrer" className="text-[#00D4FF] hover:underline">Base Sepolia Faucet</a> instead.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {status === 'idle' && (
                            <div className="p-5 border-t border-white/[0.06] bg-black/20">
                                <button
                                    onClick={handleProvision}
                                    disabled={!smartAccountAddress}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #F97316 0%, #EAB308 100%)',
                                    }}
                                >
                                    <Droplet size={16} />
                                    Provision Liquidity
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProvisioningModal;
