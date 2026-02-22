import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

interface ContributionFormProps {
    campaignId: number;
    minContribution: string;
    maxContribution: string;
    onContribute: () => void;
}

export default function ContributionForm({ campaignId, minContribution, maxContribution, onContribute }: ContributionFormProps) {
    const { contract } = useWeb3();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract) return;

        try {
            setLoading(true);
            setError('');
            
            const amountInEth = Number(amount);
            const minInEth = Number(minContribution);
            const maxInEth = Number(maxContribution);

            if (amountInEth < minInEth) {
                throw new Error(`Contribution must be at least ${minContribution} ETH`);
            }

            if (amountInEth > maxInEth) {
                throw new Error(`Contribution cannot exceed ${maxContribution} ETH`);
            }

            const amountWei = ethers.parseEther(amount);
            const tx = await contract.contribute(campaignId, { value: amountWei });
            await tx.wait();
            setAmount('');
            onContribute();
        } catch (error: any) {
            console.error('Error contributing to campaign:', error);
            setError(error.message || 'Failed to contribute. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Contribute to Campaign</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Amount (ETH)
                    </label>
                    <div className="mt-1">
                        <input
                            type="number"
                            step="0.001"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            min={minContribution}
                            max={maxContribution}
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Min: {minContribution} ETH | Max: {maxContribution} ETH
                    </p>
                </div>

                {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                )}

                <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                    {loading ? 'Contributing...' : 'Contribute'}
                </button>
            </form>
        </div>
    );
} 