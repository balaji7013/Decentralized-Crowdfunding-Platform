'use client';

import { useEffect, useState } from 'react';
import { useCrowdfunding } from '../hooks/useCrowdfunding';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

interface Transaction {
  campaignId: number;
  type: 'contribution' | 'creation' | 'milestone' | 'refund';
  amount?: string;
  timestamp: number;
  campaignName?: string;
}

export default function RecentTransactions() {
  const { getCampaign } = useCrowdfunding();
  const { address } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        // In a real implementation, you would fetch events from the contract
        // For now, we'll create some dummy data
        const dummyTransactions: Transaction[] = [
          {
            campaignId: 1,
            type: 'contribution',
            amount: '0.5',
            timestamp: Date.now() - 3600000, // 1 hour ago
          },
          {
            campaignId: 2,
            type: 'creation',
            timestamp: Date.now() - 7200000, // 2 hours ago
          },
          {
            campaignId: 3,
            type: 'milestone',
            timestamp: Date.now() - 10800000, // 3 hours ago
          },
        ];

        // Fetch campaign names for each transaction
        const transactionsWithNames = await Promise.all(
          dummyTransactions.map(async (tx) => {
            try {
              const campaign = await getCampaign(tx.campaignId);
              return {
                ...tx,
                campaignName: campaign.name,
              };
            } catch (error) {
              console.error(`Error fetching campaign ${tx.campaignId}:`, error);
              return tx;
            }
          })
        );

        setTransactions(transactionsWithNames);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [getCampaign, address]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTransactionTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'contribution':
        return 'text-green-600';
      case 'creation':
        return 'text-blue-600';
      case 'milestone':
        return 'text-purple-600';
      case 'refund':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!address) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
        <p className="text-gray-500">Please connect your wallet to view transactions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
      <div className="space-y-4">
        {transactions.map((tx, index) => (
          <div key={index} className="border-b pb-4 last:border-b-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {tx.campaignName || `Campaign #${tx.campaignId}`}
                </p>
                <p className={`text-sm ${getTransactionTypeColor(tx.type)}`}>
                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                </p>
              </div>
              {tx.amount && (
                <p className="font-medium text-green-600">{tx.amount} ETH</p>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formatTimestamp(tx.timestamp)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 