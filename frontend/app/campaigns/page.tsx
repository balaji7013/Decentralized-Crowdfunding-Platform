'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useCrowdfunding } from '../../hooks/useCrowdfunding';
import Navigation from '../../components/Navigation';
import { Campaign } from '../../types/campaign';
import { ethers } from 'ethers';

export default function CampaignsPage() {
  const { isConnected, contract } = useWeb3();
  const { getCampaign, getCampaignCount } = useCrowdfunding();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);

  const handleFund = async (campaignId: number) => {
    if (!contract || !fundingAmount) return;
    
    try {
      const amount = ethers.parseEther(fundingAmount);
      const tx = await contract.contribute(campaignId, { value: amount });
      await tx.wait();
      // Refresh campaigns after funding
      await loadCampaigns();
      setFundingAmount('');
      setSelectedCampaign(null);
    } catch (error) {
      console.error('Error funding campaign:', error);
      alert('Failed to fund campaign. Please try again.');
    }
  };

  const hasReachedTarget = useCallback((campaign: Campaign) => {
    return Number(campaign.raisedAmount) >= Number(campaign.targetAmount);
  }, []);

  const loadCampaigns = useCallback(async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Loading campaigns...');
      
      const count = await getCampaignCount();
      console.log('Total campaign count:', count);
      
      if (count === 0) {
        console.log('No campaigns found');
        setCampaigns([]);
        return;
      }

      const campaignPromises = Array.from({ length: count }, (_, i) => getCampaign(i));
      const campaignResults = await Promise.all(campaignPromises);
      
      // Filter out null results and log the number of valid campaigns
      const validCampaigns = campaignResults.filter((c): c is Campaign => c !== null);
      console.log('Found valid campaigns:', validCampaigns.length);
      
      setCampaigns(validCampaigns);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [isConnected, getCampaign, getCampaignCount]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;
      await loadCampaigns();
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [loadCampaigns]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Please connect your wallet to view campaigns</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Loading campaigns...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600">Error: {error}</h2>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">All Campaigns</h1>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign, index) => (
              <div key={campaign.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{campaign.description}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Target:</span>
                      <span className="font-medium">{campaign.targetAmount} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Raised:</span>
                      <span className="font-medium">{campaign.raisedAmount} ETH</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Deadline:</span>
                      <span className="font-medium">
                        {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <a 
                        href={campaign.driveLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
                          <path d="M10 6a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z"/>
                        </svg>
                        View Project Details
                      </a>
                    </div>
                  </div>
                  {selectedCampaign === index ? (
                    <div className="mt-4 space-y-2">
                      <input
                        type="number"
                        step="0.001"
                        value={fundingAmount}
                        onChange={(e) => setFundingAmount(e.target.value)}
                        placeholder="Amount in ETH"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFund(index)}
                          disabled={!fundingAmount || hasReachedTarget(campaign)}
                          className={`flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                            hasReachedTarget(campaign)
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          }`}
                        >
                          {hasReachedTarget(campaign) ? 'Target Reached' : 'Fund'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCampaign(null);
                            setFundingAmount('');
                          }}
                          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedCampaign(index)}
                      className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Fund Campaign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 