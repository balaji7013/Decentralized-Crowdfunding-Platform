'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useCrowdfunding } from '../../hooks/useCrowdfunding';
import Navigation from '../../components/Navigation';
import { Campaign } from '../../types/campaign';

export default function ProfilePage() {
  const { address, stats, refreshStats } = useWeb3();
  const { getCampaignCount, getCampaign, getCampaignsByCreator, getCampaignsByBacker } = useCrowdfunding();
  const [createdCampaigns, setCreatedCampaigns] = useState<Campaign[]>([]);
  const [contributedCampaigns, setContributedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      if (!address) return;

      try {
        setLoading(true);
        await refreshStats();
        
        // Load created campaigns
        const created = await getCampaignsByCreator(address);
        setCreatedCampaigns(created.filter((campaign): campaign is Campaign => campaign !== null));
        
        // Load contributed campaigns
        const contributed = await getCampaignsByBacker(address);
        setContributedCampaigns(contributed.filter((campaign): campaign is Campaign => campaign !== null));
      } catch (err) {
        console.error('Error loading campaigns:', err);
        setError('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [address, getCampaignsByCreator, getCampaignsByBacker, refreshStats]);

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Please connect your wallet to view your profile
              </h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
            <p className="text-gray-600">
              Address: {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>

          {loading ? (
            <div className="space-y-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaigns You Created</h2>
                {createdCampaigns.length === 0 ? (
                  <p className="text-gray-500">You haven't created any campaigns yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdCampaigns.map((campaign, index) => (
                      <div key={index} className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Target:</span>
                            <span className="font-medium">{campaign.targetAmount} ETH</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Raised:</span>
                            <span className="font-medium">{campaign.raisedAmount} ETH</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Status:</span>
                            <span className="font-medium">{campaign.status}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Deadline:</span>
                            <span className="font-medium">
                              {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaigns You Contributed To</h2>
                {contributedCampaigns.length === 0 ? (
                  <p className="text-gray-500">You haven't contributed to any campaigns yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contributedCampaigns.map((campaign, index) => (
                      <div key={index} className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Target:</span>
                            <span className="font-medium">{campaign.targetAmount} ETH</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Raised:</span>
                            <span className="font-medium">{campaign.raisedAmount} ETH</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Status:</span>
                            <span className="font-medium">{campaign.status}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Deadline:</span>
                            <span className="font-medium">
                              {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 