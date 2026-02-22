'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../config';

interface Web3ContextType {
  address: string | null;
  contract: ethers.Contract | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshStats: () => Promise<void>;
  stats: {
    totalCampaigns: number;
    totalFundsRaised: string;
    completedCampaigns: number;
    contractBalance: string;
    recentTransactions: {
      type: 'contribution' | 'creation' | 'release';
      campaignId: number;
      amount: string;
      timestamp: number;
      from: string;
      to: string;
    }[];
  };
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  contract: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  refreshStats: async () => {},
  stats: {
    totalCampaigns: 0,
    totalFundsRaised: '0',
    completedCampaigns: 0,
    contractBalance: '0',
    recentTransactions: []
  }
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalFundsRaised: '0',
    completedCampaigns: 0,
    contractBalance: '0',
    recentTransactions: [] as {
      type: 'contribution' | 'creation' | 'release';
      campaignId: number;
      amount: string;
      timestamp: number;
      from: string;
      to: string;
    }[]
  });

  const refreshStats = async () => {
    if (!contract) return;
    try {
      const campaignCount = await contract.campaignCount();
      
      // Get contract balance
      const provider = contract.runner?.provider as ethers.Provider;
      const balance = await provider.getBalance(contractAddress);

      // Get all campaigns to calculate stats
      const campaignPromises = Array.from({ length: Number(campaignCount) }, (_, i) => 
        contract.campaigns(i)
      );
      const campaigns = await Promise.all(campaignPromises);

      // Calculate total funds raised and completed campaigns
      const totalFundsRaised = campaigns.reduce((acc, campaign) => 
        acc + campaign.raisedAmount, BigInt(0)
      );
      
      const completedCampaigns = campaigns.filter(campaign => 
        campaign.fundsReleased || 
        campaign.raisedAmount >= campaign.targetAmount
      ).length;

      // Get recent events
      const [contributionEvents, creationEvents, releaseEvents] = await Promise.all([
        contract.queryFilter(contract.filters.ContributionMade(), 0, 'latest'),
        contract.queryFilter(contract.filters.CampaignCreated(), 0, 'latest'),
        contract.queryFilter(contract.filters.FundsReleased(), 0, 'latest')
      ]);

      const recentTransactions = [
        ...contributionEvents.map(event => {
          const log = event as ethers.EventLog;
          return {
            type: 'contribution' as const,
            campaignId: Number(log.args?.[0]),
            amount: ethers.formatEther(log.args?.[1] || 0),
            timestamp: Number(log.blockNumber),
            from: log.args?.[2] || '',
            to: contractAddress
          };
        }),
        ...creationEvents.map(event => {
          const log = event as ethers.EventLog;
          return {
            type: 'creation' as const,
            campaignId: Number(log.args?.[0]),
            amount: '0',
            timestamp: Number(log.blockNumber),
            from: log.args?.[1] || '',
            to: contractAddress
          };
        }),
        ...releaseEvents.map(event => {
          const log = event as ethers.EventLog;
          return {
            type: 'release' as const,
            campaignId: Number(log.args?.[0]),
            amount: ethers.formatEther(log.args?.[1] || 0),
            timestamp: Number(log.blockNumber),
            from: contractAddress,
            to: log.args?.[2] || ''
          };
        })
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

      // Batch state updates
      setStats(prevStats => {
        const newStats = {
          totalCampaigns: Number(campaignCount),
          totalFundsRaised: ethers.formatEther(totalFundsRaised),
          completedCampaigns,
          contractBalance: ethers.formatEther(balance),
          recentTransactions
        };
        
        // Only update if there are actual changes
        if (JSON.stringify(prevStats) === JSON.stringify(newStats)) {
          return prevStats;
        }
        return newStats;
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Initialize contract
      const contractInstance = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      // Batch state updates
      setAddress(accounts[0]);
      setContract(contractInstance);
      setIsConnected(true);
      await refreshStats();

      // Debounce event listeners
      let refreshTimeout: NodeJS.Timeout;
      const debouncedRefresh = () => {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          refreshStats();
        }, 1000); // Wait 1 second before refreshing
      };

      // Listen for account changes
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
          await refreshStats();
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      // Listen for contract events with debouncing
      contractInstance.on('CampaignCreated', debouncedRefresh);
      contractInstance.on('ContributionMade', debouncedRefresh);
      contractInstance.on('FundsReleased', debouncedRefresh);
      contractInstance.on('CampaignStatusUpdated', debouncedRefresh);
      contractInstance.on('RefundIssued', debouncedRefresh);

      // Cleanup function
      return () => {
        clearTimeout(refreshTimeout);
        contractInstance.removeAllListeners();
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    if (contract) {
      // Remove event listeners
      contract.removeAllListeners();
    }
    setAddress(null);
    setContract(null);
    setIsConnected(false);
    setStats({
      totalCampaigns: 0,
      totalFundsRaised: '0',
      completedCampaigns: 0,
      contractBalance: '0',
      recentTransactions: []
    });
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contractInstance = new ethers.Contract(
              contractAddress,
              contractABI,
              signer
            );
            setAddress(accounts[0]);
            setContract(contractInstance);
            setIsConnected(true);
            await refreshStats();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  return (
    <Web3Context.Provider
      value={{
        address,
        contract,
        isConnected,
        connectWallet,
        disconnectWallet,
        refreshStats,
        stats
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}; 