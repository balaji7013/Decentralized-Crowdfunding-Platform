'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useWeb3 } from '../../../context/Web3Context';
import { Campaign, FundingMode } from '../../../types/campaign';
import { ethers } from 'ethers';
import ContributionForm from '../../../components/ContributionForm';
import WithdrawForm from '../../../components/WithdrawForm';
import VotingSection from '../../../components/VotingSection';

export default function CampaignDetails() {
    const { id } = useParams();
    const { contract, address } = useWeb3();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (contract && id) {
            loadCampaignDetails();
        }
    }, [contract, id]);

    const loadCampaignDetails = async () => {
        try {
            const data = await contract!.campaigns(id);
            const formattedCampaign: Campaign = {
                id: Number(id),
                name: data.name,
                description: data.description,
                creator: data.creator,
                targetAmount: ethers.formatEther(data.targetAmount),
                currentAmount: ethers.formatEther(data.currentAmount),
                deadline: new Date(Number(data.deadline) * 1000),
                isActive: data.isActive,
                driveLink: data.driveLink,
                allowedModes: data.allowedModes,
                minContribution: ethers.formatEther(data.minContribution),
                maxContribution: ethers.formatEther(data.maxContribution),
                contributors: data.contributors,
                hasWithdrawn: data.hasWithdrawn
            };
            setCampaign(formattedCampaign);
        } catch (error) {
            console.error('Error loading campaign details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (!campaign) {
        return <div className="text-center py-8">Campaign not found</div>;
    }

    const isCreator = address?.toLowerCase() === campaign.creator.toLowerCase();
    const isContributor = campaign.contributors.includes(address?.toLowerCase() || '');
    const now = new Date();
    const isExpired = campaign.deadline < now;
    const isFunded = Number(campaign.currentAmount) >= Number(campaign.targetAmount);

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h1 className="text-3xl font-bold mb-4">{campaign.name}</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-gray-600 mb-4">{campaign.description}</p>
                                <div className="space-y-2">
                                    <p><span className="font-semibold">Creator:</span> {campaign.creator}</p>
                                    <p><span className="font-semibold">Target Amount:</span> {campaign.targetAmount} ETH</p>
                                    <p><span className="font-semibold">Current Amount:</span> {campaign.currentAmount} ETH</p>
                                    <p><span className="font-semibold">Deadline:</span> {campaign.deadline.toLocaleString()}</p>
                                    <p><span className="font-semibold">Status:</span> {campaign.isActive ? 'Active' : 'Inactive'}</p>
                                    <p><span className="font-semibold">Drive Link:</span> <a href={campaign.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{campaign.driveLink}</a></p>
                                    <p><span className="font-semibold">Minimum Contribution:</span> {campaign.minContribution} ETH</p>
                                    <p><span className="font-semibold">Maximum Contribution:</span> {campaign.maxContribution} ETH</p>
                                    <div>
                                        <span className="font-semibold">Allowed Funding Modes:</span>
                                        <ul className="list-disc list-inside ml-4">
                                            {campaign.allowedModes.map((mode: number) => (
                                                <li key={mode}>{FundingMode[mode]}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {campaign.isActive && !isExpired && (
                                    <ContributionForm
                                        campaignId={campaign.id}
                                        minContribution={campaign.minContribution}
                                        maxContribution={campaign.maxContribution}
                                        onContribute={loadCampaignDetails}
                                    />
                                )}

                                {isCreator && isFunded && !campaign.hasWithdrawn && (
                                    <WithdrawForm
                                        campaignId={campaign.id}
                                        onWithdraw={loadCampaignDetails}
                                    />
                                )}

                                {isContributor && isExpired && !isFunded && (
                                    <VotingSection
                                        campaignId={campaign.id}
                                        onVote={loadCampaignDetails}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 