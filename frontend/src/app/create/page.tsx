'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';
import { FundingMode } from '../../types/campaign';

export default function CreateCampaign() {
    const router = useRouter();
    const { contract } = useWeb3();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        targetAmount: '',
        deadline: '',
        driveLink: '',
        minContribution: '',
        maxContribution: '',
        allowedModes: [] as FundingMode[]
    });
    const [loading, setLoading] = useState(false);

    const handleModeToggle = (mode: FundingMode) => {
        setFormData(prev => {
            const modes = prev.allowedModes.includes(mode)
                ? prev.allowedModes.filter(m => m !== mode)
                : [...prev.allowedModes, mode];
            return { ...prev, allowedModes: modes };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract) return;

        try {
            setLoading(true);
            const targetAmountWei = ethers.parseEther(formData.targetAmount);
            const minContributionWei = ethers.parseEther(formData.minContribution);
            const maxContributionWei = ethers.parseEther(formData.maxContribution);
            const deadlineDate = new Date(formData.deadline).getTime() / 1000;

            const tx = await contract.createCampaign(
                formData.name,
                formData.description,
                targetAmountWei,
                deadlineDate,
                formData.driveLink,
                formData.allowedModes,
                minContributionWei,
                maxContributionWei
            );

            await tx.wait();
            router.push('/campaigns');
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('Failed to create campaign. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
                    <div className="max-w-md mx-auto">
                        <div className="divide-y divide-gray-200">
                            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                <h2 className="text-2xl font-bold mb-8">Create New Campaign</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Target Amount (ETH)</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            required
                                            value={formData.targetAmount}
                                            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Minimum Contribution (ETH)</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            required
                                            value={formData.minContribution}
                                            onChange={(e) => setFormData({ ...formData, minContribution: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Maximum Contribution (ETH)</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            required
                                            value={formData.maxContribution}
                                            onChange={(e) => setFormData({ ...formData, maxContribution: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Deadline</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.deadline}
                                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Drive Link</label>
                                        <input
                                            type="url"
                                            required
                                            value={formData.driveLink}
                                            onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Funding Modes</label>
                                        <div className="space-y-2">
                                            {Object.values(FundingMode)
                                                .filter(mode => typeof mode === 'number')
                                                .map((mode: number) => (
                                                    <label key={mode} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.allowedModes.includes(mode)}
                                                            onChange={() => handleModeToggle(mode)}
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span>{FundingMode[mode]}</span>
                                                    </label>
                                                ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || formData.allowedModes.length === 0}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                                    >
                                        {loading ? 'Creating...' : 'Create Campaign'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 