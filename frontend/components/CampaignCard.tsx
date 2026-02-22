'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { FundingMode, CampaignStatus, type Campaign } from '../types/campaign';
import { useMemo } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useCrowdfunding } from '../hooks/useCrowdfunding';

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
}

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const { address } = useWeb3();
  const { voteForFundingMode, getVotingStatus } = useCrowdfunding();
  const [votingStatus, setVotingStatus] = useState<{
    hasVoted: boolean;
    totalVotes: number;
    requiredVotes: number;
    currentMode: number;
    votingEnded: boolean;
  } | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasContributed, setHasContributed] = useState(false);

  const progress = useMemo(() => {
    const percentage = Number(campaign.raisedAmount) / Number(campaign.targetAmount) * 100;
    return Math.min(100, Math.max(0, percentage));
  }, [campaign.raisedAmount, campaign.targetAmount]);

  const hasReachedTarget = useMemo(() => {
    return Number(campaign.raisedAmount) >= Number(campaign.targetAmount);
  }, [campaign.raisedAmount, campaign.targetAmount]);

  const timeLeft = useMemo(() => {
    const now = Date.now() / 1000;
    const deadline = Number(campaign.deadline);
    const diff = deadline - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (24 * 60 * 60));
    const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      return `${years}y ${remainingDays}d left`;
    }
    
    return `${days}d ${hours}h left`;
  }, [campaign.deadline]);

  const canStartVoting = useMemo(() => {
    const hasReachedTarget = Number(campaign.raisedAmount) >= Number(campaign.targetAmount);
    const isDeadlineReached = Number(campaign.deadline) <= Math.floor(Date.now() / 1000);
    return hasReachedTarget || isDeadlineReached;
  }, [campaign.raisedAmount, campaign.targetAmount, campaign.deadline]);

  const fundingModeText = useMemo(() => {
    switch (campaign.fundingMode) {
      case FundingMode.DIRECT:
        return 'Direct Funding';
      case FundingMode.ALL_OR_NOTHING:
        return 'All or Nothing';
      case FundingMode.KEEP_IT_ALL:
        return 'Keep it All';
      case FundingMode.MILESTONE_BASED:
        return 'Milestone Based';
      default:
        return 'Unknown';
    }
  }, [campaign.fundingMode]);

  const statusText = useMemo(() => {
    switch (campaign.status) {
      case CampaignStatus.Active:
        return 'Active';
      case CampaignStatus.Completed:
        return 'Completed';
      case CampaignStatus.Expired:
        return 'Expired';
      case CampaignStatus.UnderVoting:
        return 'Under Voting';
      case CampaignStatus.Failed:
        return 'Failed';
      default:
        return 'Unknown';
    }
  }, [campaign.status]);

  const statusColor = useMemo(() => {
    switch (campaign.status) {
      case CampaignStatus.Active:
        return 'bg-blue-100 text-blue-800';
      case CampaignStatus.Completed:
        return 'bg-green-100 text-green-800';
      case CampaignStatus.Expired:
        return 'bg-yellow-100 text-yellow-800';
      case CampaignStatus.UnderVoting:
        return 'bg-purple-100 text-purple-800';
      case CampaignStatus.Failed:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [campaign.status]);

  useEffect(() => {
    const loadVotingStatus = async () => {
      if (!campaign.backerVotingEnabled || !address) return;
      try {
        const status = await getVotingStatus(campaign.id);
        setVotingStatus(status);
      } catch (error) {
        console.error('Error loading voting status:', error);
      }
    };
    loadVotingStatus();
  }, [campaign.id, campaign.backerVotingEnabled, address, getVotingStatus]);

  useEffect(() => {
    const checkContribution = async () => {
      if (!contract || !campaign || !address) return;
      try {
        const contribution = await contract.getContribution(campaign.id, address);
        setHasContributed(contribution > 0n);
      } catch (error) {
        console.error('Error checking contribution:', error);
      }
    };
    checkContribution();
  }, [contract, campaign, address]);

  const handleVote = async (mode: FundingMode) => {
    if (!address || isVoting) return;
    try {
      setIsVoting(true);
      await voteForFundingMode(campaign.id, mode);
      const status = await getVotingStatus(campaign.id);
      setVotingStatus(status);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const formatAmount = (amount: bigint) => {
    return ethers.formatEther(amount);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
        <span className={`text-sm font-medium ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Target Amount:</span>
          <span className="font-medium">{formatAmount(campaign.targetAmount)} ETH</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Raised:</span>
          <span className="font-medium">{formatAmount(campaign.raisedAmount)} ETH</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full"
            style={{ 
              width: `${progress}%` 
            }}
          />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Funding Mode:</span>
          <span className="font-medium">{fundingModeText}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Deadline:</span>
          <span className="font-medium">
            {formatDate(Number(campaign.deadline))}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Time Left:</span>
          <span className="font-medium">{timeLeft}</span>
        </div>
      </div>

      {campaign.backerVotingEnabled && hasContributed && !votingStatus?.votingEnded && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Your Voting Options</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Votes:</span>
              <span className="font-medium">
                {votingStatus?.totalVotes || 0} / {votingStatus?.requiredVotes || 0}
              </span>
            </div>
            {!votingStatus?.hasVoted && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {campaign.allowedModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(mode);
                    }}
                    disabled={isVoting || hasReachedTarget}
                    className={`px-3 py-1 text-sm text-white rounded hover:opacity-90 disabled:opacity-50 ${
                      hasReachedTarget ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600'
                    }`}
                  >
                    {Object.keys(FundingMode).find(key => FundingMode[key as keyof typeof FundingMode] === mode)?.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
            {votingStatus?.hasVoted && (
              <p className="text-sm text-green-600">You have voted</p>
            )}
          </div>
        </div>
      )}

      {/* Drive Link */}
      {campaign.driveLink && (
        <div className="mt-4">
          <a
            href={campaign.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View Campaign Documents
          </a>
        </div>
      )}

      {/* Voting Status */}
      {campaign.votingEnabled && votingStatus && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Voting Progress: {votingStatus.totalVotes}/{votingStatus.requiredVotes}</span>
            <span>{votingStatus.hasVoted ? 'Voted' : 'Not Voted'}</span>
          </div>
          {votingStatus.votingEnded && (
            <div className="text-sm text-red-600 mt-1">
              Voting ended
            </div>
          )}
        </div>
      )}

      {/* Start Voting Button (for campaign creator) */}
      {campaign.creator === address && !campaign.votingEnabled && canStartVoting && (
        <div className="mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStartVoting();
            }}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
          >
            Start Voting
          </button>
        </div>
      )}

      <button
        onClick={() => setSelectedCampaign(index)}
        disabled={hasReachedTarget || campaign.status === CampaignStatus.Completed}
        className={`mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
          hasReachedTarget || campaign.status === CampaignStatus.Completed
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
        }`}
      >
        {hasReachedTarget ? 'Target Reached' : campaign.status === CampaignStatus.Completed ? 'Campaign Completed' : 'Fund Campaign'}
      </button>
    </div>
  );
} 