'use client';

import { useCallback, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { contractABI, contractAddress } from '../config';
import { Campaign, FundingMode, CampaignStatus } from '../types/campaign';

interface CreateCampaignData {
  name: string;
  description: string;
  targetAmount: number;
  deadline: Date;
  fundingMode: FundingMode;
  driveLink?: string;
  email?: string;
  additionalInfo?: string;
}

interface RawCampaign {
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

interface VotingStatus {
  hasVoted: boolean;
  totalVotes: number;
  requiredVotes: number;
  currentMode: number;
  votingEnded: boolean;
}

export const useCrowdfunding = () => {
  const { contract, address } = useWeb3();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const count = await contract.campaignCount();
      const campaignPromises = Array.from({ length: Number(count) }, (_, i) => 
        contract.campaigns(i)
      );
      
      const campaignData = await Promise.all(campaignPromises);
      const formattedCampaigns = campaignData.map((campaign: any, index: number) => ({
        id: index,
        creator: campaign.creator,
        name: campaign.name,
        description: campaign.description,
        targetAmount: ethers.formatEther(campaign.targetAmount),
        deadline: new Date(Number(campaign.deadline) * 1000),
        raisedAmount: ethers.formatEther(campaign.raisedAmount),
        fundsReleased: campaign.fundsReleased,
        driveLink: campaign.driveLink,
        fundingMode: campaign.fundingMode as FundingMode,
        backersCount: Number(campaign.backersCount),
        rewardQuota: Number(campaign.rewardQuota),
        rewardsRedeemed: Number(campaign.rewardsRedeemed),
        email: campaign.email,
        additionalInfo: campaign.additionalInfo,
        status: campaign.status as CampaignStatus,
        votingEnabled: campaign.votingEnabled,
        votingStatus: {
          hasVoted: campaign.votingStatus.hasVoted,
          totalVotes: Number(campaign.votingStatus.totalVotes),
          requiredVotes: Number(campaign.votingStatus.requiredVotes),
          currentMode: campaign.votingStatus.currentMode as FundingMode,
          votingEnded: Number(campaign.votingStatus.votingEndTime) < Math.floor(Date.now() / 1000)
        },
        allowedModes: campaign.allowedModes || [],
        milestoneDescriptions: campaign.milestoneDescriptions || [],
        milestoneAmounts: campaign.milestoneAmounts?.map((amount: bigint) => ethers.formatEther(amount)) || [],
        rewardCodes: campaign.rewardCodes || []
      }));
      
      setCampaigns(formattedCampaigns);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const createCampaign = useCallback(async (campaignData: CreateCampaignData) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const deadline = Math.floor(campaignData.deadline.getTime() / 1000);
      const targetAmount = ethers.parseEther(campaignData.targetAmount.toString());
      
      // Ensure funding mode is a number
      const fundingMode = Number(campaignData.fundingMode);

      // Validate funding mode
      if (isNaN(fundingMode)) {
        throw new Error('Invalid funding mode');
      }

      console.log('Creating campaign with:', {
        name: campaignData.name,
        description: campaignData.description,
        targetAmount: targetAmount.toString(),
        deadline,
        fundingMode,
        driveLink: campaignData.driveLink,
        email: campaignData.email,
        additionalInfo: campaignData.additionalInfo
      });

      const tx = await contract.createCampaign(
        campaignData.name,
        campaignData.description,
        targetAmount,
        deadline,
        campaignData.driveLink || '',
        fundingMode,
        campaignData.email || '',
        campaignData.additionalInfo || ''
      );
      
      await tx.wait();
      await loadCampaigns(); // Refresh campaigns after creating
      return true;
    } catch (err) {
      console.error('Error creating campaign:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to create campaign');
    }
  }, [contract, loadCampaigns]);

  const contribute = useCallback(async (campaignId: number, amount: number) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const amountInWei = ethers.parseEther(amount.toString());
      const tx = await contract.contribute(campaignId, { value: amountInWei });
      await tx.wait();
      await loadCampaigns(); // Refresh campaigns after contribution
      return true;
    } catch (err) {
      console.error('Error contributing to campaign:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to contribute');
    }
  }, [contract, loadCampaigns]);

  const releaseFunds = useCallback(async (campaignId: number) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const tx = await contract.releaseFunds(campaignId);
      await tx.wait();
      await loadCampaigns(); // Refresh campaigns after releasing funds
      return true;
    } catch (err) {
      console.error('Error releasing funds:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to release funds');
    }
  }, [contract, loadCampaigns]);

  const voteForFundingMode = useCallback(async (campaignId: number, mode: FundingMode) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const tx = await contract.vote(campaignId, mode);
      await tx.wait();
      await loadCampaigns(); // Refresh campaigns after voting
      return true;
    } catch (err) {
      console.error('Error voting for funding mode:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to vote');
    }
  }, [contract, loadCampaigns]);

  const startVoting = useCallback(async (campaignId: number) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const tx = await contract.startVoting(campaignId);
      await tx.wait();
      await loadCampaigns();
    } catch (err) {
      console.error('Error starting voting:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to start voting');
    }
  }, [contract, loadCampaigns]);

  const vote = useCallback(async (campaignId: number, mode: FundingMode) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const tx = await contract.vote(campaignId, mode);
      await tx.wait();
      await loadCampaigns();
    } catch (err) {
      console.error('Error voting:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to vote');
    }
  }, [contract, loadCampaigns]);

  const getVotingStatus = useCallback(async (campaignId: number): Promise<VotingStatus | null> => {
    if (!contract || !address) return null;
    
    try {
      const [hasVoted, totalVotes, requiredVotes, currentMode, votingEnded] = await Promise.all([
        contract.voterHasVoted(campaignId, address),
        contract.campaigns(campaignId).then(c => c.totalVotes),
        contract.campaigns(campaignId).then(c => c.requiredVotes),
        contract.campaigns(campaignId).then(c => c.currentMode),
        contract.campaigns(campaignId).then(c => c.votingEndTime).then(endTime => 
          BigInt(endTime) < BigInt(Math.floor(Date.now() / 1000))
        )
      ]);

      return {
        hasVoted,
        totalVotes: Number(totalVotes),
        requiredVotes: Number(requiredVotes),
        currentMode,
        votingEnded
      };
    } catch (err) {
      console.error('Error getting voting status:', err);
      return null;
    }
  }, [contract, address]);

  const getCampaignCount = useCallback(async (): Promise<number> => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      console.log('Getting campaign count...');
      const count = await contract.campaignCount();
      console.log('Raw campaign count:', count);
      
      // Handle BigInt conversion
      if (typeof count === 'bigint') {
        return Number(count);
      }
      
      // Handle string conversion
      if (typeof count === 'string') {
        return parseInt(count, 10);
      }
      
      // Handle number
      if (typeof count === 'number') {
        return count;
      }
      
      console.error('Invalid campaign count value:', count);
      return 0;
    } catch (err) {
      console.error('Error getting campaign count:', err);
      return 0;
    }
  }, [contract]);

  const getCampaign = useCallback(async (campaignId: number): Promise<Campaign | null> => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      console.log('Getting campaign:', campaignId);
      const campaign = await contract.campaigns(campaignId);
      console.log('Raw campaign data:', campaign);
      
      // Check if the campaign exists by checking if it has a creator address
      if (!campaign || !campaign.creator || campaign.creator === ethers.ZeroAddress) {
        return null;
      }
      
      return {
        id: campaignId,
        creator: campaign.creator,
        name: campaign.name,
        description: campaign.description,
        targetAmount: ethers.formatEther(campaign.targetAmount),
        deadline: new Date(Number(campaign.deadline) * 1000),
        raisedAmount: ethers.formatEther(campaign.raisedAmount),
        fundsReleased: campaign.fundsReleased,
        driveLink: campaign.driveLink,
        fundingMode: campaign.fundingMode as FundingMode,
        backersCount: Number(campaign.backersCount),
        rewardQuota: Number(campaign.rewardQuota),
        rewardsRedeemed: Number(campaign.rewardsRedeemed),
        email: campaign.email,
        additionalInfo: campaign.additionalInfo,
        status: campaign.status as CampaignStatus,
        allowedModes: campaign.allowedModes || [],
        milestoneDescriptions: campaign.milestoneDescriptions || [],
        milestoneAmounts: campaign.milestoneAmounts?.map((amount: bigint) => ethers.formatEther(amount)) || [],
        rewardCodes: campaign.rewardCodes || [],
        backerVotingEnabled: campaign.backerVotingEnabled || false
      };
    } catch (err) {
      console.error('Error getting campaign:', err);
      return null;
    }
  }, [contract]);

  const getCampaignsByCreator = useCallback(async (creatorAddress: string): Promise<Campaign[]> => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const count = await getCampaignCount();
      const campaignPromises = Array.from({ length: count }, (_, i) => getCampaign(i));
      const allCampaigns = await Promise.all(campaignPromises);
      
      return allCampaigns
        .filter((campaign): campaign is Campaign => campaign !== null)
        .filter(campaign => campaign.creator.toLowerCase() === creatorAddress.toLowerCase());
    } catch (err) {
      console.error('Error getting campaigns by creator:', err);
      return [];
    }
  }, [contract, getCampaignCount, getCampaign]);

  const getCampaignsByBacker = useCallback(async (backerAddress: string): Promise<Campaign[]> => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const count = await getCampaignCount();
      const campaignPromises = Array.from({ length: count }, (_, i) => getCampaign(i));
      const allCampaigns = await Promise.all(campaignPromises);
      
      // For now, we'll return all campaigns since we can't check contributions
      // This should be updated once the contract has the getContribution function
      return allCampaigns.filter((campaign): campaign is Campaign => campaign !== null);
    } catch (err) {
      console.error('Error getting campaigns by backer:', err);
      return [];
    }
  }, [contract, getCampaignCount, getCampaign]);

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    loadCampaigns,
    contribute,
    releaseFunds,
    voteForFundingMode,
    startVoting,
    vote,
    getVotingStatus,
    getCampaignCount,
    getCampaign,
    getCampaignsByCreator,
    getCampaignsByBacker
  };
}; 