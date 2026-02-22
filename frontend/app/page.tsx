'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useCrowdfunding } from '../hooks/useCrowdfunding';
import Navigation from '../components/Navigation';
import { Campaign } from '../types/campaign';

export default function HomePage() {
  const { address, stats, refreshStats } = useWeb3();
  const { getCampaignCount, getCampaign } = useCrowdfunding();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      if (!address) return;

      try {
        setLoading(true);
        await refreshStats();
        const count = await getCampaignCount();
        const campaignPromises = Array.from({ length: Number(count) }, (_, i) => getCampaign(i));
        const allCampaigns = await Promise.all(campaignPromises);
        setCampaigns(allCampaigns.filter((campaign): campaign is Campaign => campaign !== null));
      } catch (err) {
        console.error('Error loading campaigns:', err);
        setError('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [address, getCampaignCount, getCampaign, refreshStats]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Crowdfunding Platform
            </h1>
            <p className="text-xl text-gray-600">
              Support innovative projects and ideas with cryptocurrency
            </p>
          </div>

          {!address ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Connect your wallet to view campaigns
              </h2>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Total Campaigns</h3>
                  <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalCampaigns}</p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Total Funds Raised</h3>
                  <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalFundsRaised} ETH</p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Contract Balance</h3>
                  <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.contractBalance} ETH</p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Completed Campaigns</h3>
                  <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.completedCampaigns}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
                  <div className="space-y-4">
                    {stats.recentTransactions.map((tx, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {tx.type === 'contribution' ? 'Contribution' : 
                             tx.type === 'creation' ? 'Campaign Created' : 'Funds Released'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(tx.timestamp * 1000).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          Campaign ID: {tx.campaignId}
                        </div>
                        {tx.amount !== '0' && (
                          <div className="mt-1 text-sm text-gray-600">
                            Amount: {tx.amount} ETH
                          </div>
                        )}
                        <div className="mt-1 text-sm text-gray-600">
                          From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Active Campaigns</h2>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-red-600">{error}</div>
                  ) : campaigns.length === 0 ? (
                    <p className="text-gray-500">No active campaigns found.</p>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign, index) => (
                        <div key={index} className="border-b pb-4 last:border-b-0">
                          <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
                          <div className="mt-2 flex justify-between text-sm">
                            <span className="text-gray-500">Target:</span>
                            <span className="font-medium">{campaign.targetAmount} ETH</span>
                          </div>
                          <div className="mt-1 flex justify-between text-sm">
                            <span className="text-gray-500">Raised:</span>
                            <span className="font-medium">{campaign.raisedAmount} ETH</span>
                          </div>
                          <div className="mt-1 flex justify-between text-sm">
                            <span className="text-gray-500">Deadline:</span>
                            <span className="font-medium">
                              {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 