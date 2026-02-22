'use client';

import { useEffect, useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useCrowdfunding } from '../../hooks/useCrowdfunding';
import { CampaignCard } from '../../components/CampaignCard';
import { ethers } from 'ethers';

interface Contribution {
  campaignId: number;
  amount: string;
  timestamp: number;
  campaignName?: string;
}

export default function BackersPage() {
  const { address, isConnecting, connectWallet } = useWeb3();
  const { getCampaignCount, getCampaign, contribute } = useCrowdfunding();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!address) return;

      try {
        setLoading(true);
        setError(null);

        // Load campaigns
        const count = await getCampaignCount();
        const campaignPromises = Array.from({ length: Number(count) }, (_, i) => getCampaign(i));
        const campaignData = await Promise.all(campaignPromises);
        setCampaigns(campaignData);

        // Load contributions (dummy data for now)
        const dummyContributions: Contribution[] = [
          {
            campaignId: 1,
            amount: '0.5',
            timestamp: Date.now() - 3600000,
          },
          {
            campaignId: 2,
            amount: '1.0',
            timestamp: Date.now() - 7200000,
          },
        ];

        // Fetch campaign names for contributions
        const contributionsWithNames = await Promise.all(
          dummyContributions.map(async (contribution) => {
            try {
              const campaign = await getCampaign(contribution.campaignId);
              return {
                ...contribution,
                campaignName: campaign.name,
              };
            } catch (error) {
              console.error(`Error fetching campaign ${contribution.campaignId}:`, error);
              return contribution;
            }
          })
        );

        setContributions(contributionsWithNames);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [address, getCampaignCount, getCampaign]);

  const handleContribute = async () => {
    if (!selectedCampaign || !contributionAmount) return;

    try {
      setError(null);
      await contribute(selectedCampaign, contributionAmount);
      // Refresh data after contribution
      const campaign = await getCampaign(selectedCampaign);
      setCampaigns(prev => prev.map(c => c.id === selectedCampaign ? campaign : c));
      setContributionAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to contribute');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h2>
            <p className="text-gray-600 mb-4">Please connect your wallet to view and contribute to campaigns.</p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Back Campaigns</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Campaigns */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Campaigns</h2>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <p className="text-gray-500">No campaigns available at the moment.</p>
              ) : (
                <div className="space-y-6">
                  {campaigns.map((campaign, index) => (
                    <div key={index} className="border rounded-lg p-6">
                      <CampaignCard
                        campaign={campaign}
                        onClick={() => setSelectedCampaign(index)}
                      />
                      {selectedCampaign === index && (
                        <div className="mt-4 flex gap-4">
                          <input
                            type="number"
                            placeholder="Amount in ETH"
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleContribute}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          >
                            Contribute
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Previous Contributions */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Contributions</h2>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : contributions.length === 0 ? (
                <p className="text-gray-500">You haven't made any contributions yet.</p>
              ) : (
                <div className="space-y-4">
                  {contributions.map((contribution, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <p className="font-medium">
                        {contribution.campaignName || `Campaign #${contribution.campaignId}`}
                      </p>
                      <p className="text-green-600">{contribution.amount} ETH</p>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(contribution.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 