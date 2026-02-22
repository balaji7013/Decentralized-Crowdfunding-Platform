'use client';

import { useEffect, useState } from 'react';
import { useCrowdfunding } from '../hooks/useCrowdfunding';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

interface ContractStats {
  totalFundsRaised: string;
  totalCampaigns: number;
  completedCampaigns: number;
  recentTransactions: {
    campaignId: number;
    type: 'contribution' | 'creation' | 'milestone' | 'refund';
    amount?: string;
    timestamp: number;
  }[];
}

export default function ContractStats() {
  const { getCampaignCount, getCampaign } = useCrowdfunding();
  const { address } = useWeb3();
  const [stats, setStats] = useState<ContractStats>({
    totalFundsRaised: '0',
    totalCampaigns: 0,
    completedCampaigns: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const totalCampaigns = await getCampaignCount();
        let totalFunds = BigInt(0);
        let completed = 0;

        // Fetch last 5 campaigns for stats
        for (let i = 0; i < Math.min(5, totalCampaigns); i++) {
          const campaign = await getCampaign(i);
          totalFunds += campaign.raisedAmount;
          if (campaign.status === 1) { // SUCCESSFUL
            completed++;
          }
        }

        setStats({
          totalFundsRaised: ethers.formatEther(totalFunds),
          totalCampaigns: Number(totalCampaigns),
          completedCampaigns: completed,
          recentTransactions: [] // This will be populated from events
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getCampaignCount, getCampaign, address]);

  if (!address) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Connect Wallet</h3>
            <p className="mt-2 text-sm text-gray-500">Please connect your wallet to view statistics</p>
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Funds Raised</h3>
        <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalFundsRaised} ETH</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Total Campaigns</h3>
        <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalCampaigns}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900">Completed Campaigns</h3>
        <p className="mt-2 text-3xl font-bold text-blue-600">{stats.completedCampaigns}</p>
      </div>
    </div>
  );
} 