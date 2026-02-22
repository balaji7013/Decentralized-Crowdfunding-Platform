import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../config';

interface Campaign {
  creator: string;
  name: string;
  description: string;
  targetAmount: bigint;
  deadline: bigint;
  raisedAmount: bigint;
  fundsReleased: boolean;
  driveLink: string;
  fundingMode: number;
  backersCount: bigint;
  rewardQuota: bigint;
  rewardsRedeemed: bigint;
  email: string;
  additionalInfo: string;
  status: number;
}

interface CreateCampaignParams {
  name: string;
  description: string;
  targetAmount: number;
  deadline: Date;
  driveLink: string;
  fundingMode: number;
  email: string;
  additionalInfo: string;
  milestoneDescriptions?: string[];
  milestoneAmounts?: number[];
  rewardCodes?: string[];
}

export function useCrowdfunding() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      // Get campaign count using the correct function
      const count = await contract.getCampaignCount();
      
      // Load all campaigns
      const loadedCampaigns: Campaign[] = [];
      for (let i = 0; i < count; i++) {
        const campaign = await contract.getCampaign(i);
        loadedCampaigns.push(campaign);
      }

      setCampaigns(loadedCampaigns);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async ({
    name,
    description,
    targetAmount,
    deadline,
    driveLink,
    fundingMode,
    email,
    additionalInfo,
    milestoneDescriptions = [],
    milestoneAmounts = [],
    rewardCodes = []
  }: CreateCampaignParams) => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Convert target amount to Wei
      const targetAmountWei = ethers.parseEther(targetAmount.toString());

      // Convert deadline to timestamp
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      // Create campaign transaction
      const tx = await contract.createCampaign(
        name,
        description,
        targetAmountWei,
        deadlineTimestamp,
        driveLink,
        fundingMode,
        email,
        additionalInfo,
        milestoneDescriptions,
        milestoneAmounts.map(amount => ethers.parseEther(amount.toString())),
        rewardCodes
      );

      // Wait for transaction to be mined
      await tx.wait();

      // Reload campaigns after creation
      await loadCampaigns();

      return tx.hash;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error creating campaign:', err);
      throw err;
    }
  }, [loadCampaigns]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return {
    campaigns,
    loading,
    error,
    loadCampaigns,
    createCampaign
  };
} 