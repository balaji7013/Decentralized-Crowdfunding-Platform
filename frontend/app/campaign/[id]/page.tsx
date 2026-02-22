'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWeb3 } from '../../../context/Web3Context';
import { useCrowdfunding } from '../../../hooks/useCrowdfunding';
import Navigation from '../../../components/Navigation';
import { Campaign, FundingMode, CampaignStatus, VotingStatus } from '../../../types/campaign';

export default function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const { address, isConnected } = useWeb3();
  const { 
    getCampaign, 
    contribute, 
    releaseFunds, 
    startVoting,
    voteForFundingMode,
    getVotingStatus 
  } = useCrowdfunding();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadCampaignDetails();
    }
  }, [isConnected, params.id]);

  const loadCampaignDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const campaignData = await getCampaign(Number(params.id));
      if (campaignData) {
        setCampaign(campaignData);
        const status = await getVotingStatus(Number(params.id));
        setVotingStatus(status);
      }
    } catch (err) {
      console.error('Error loading campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!campaign) return;
    
    try {
      await contribute(campaign.id, parseFloat(contributionAmount));
      await loadCampaignDetails();
      setContributionAmount('');
    } catch (err) {
      console.error('Error contributing:', err);
      setError(err instanceof Error ? err.message : 'Failed to contribute');
    }
  };

  const handleReleaseFunds = async () => {
    if (!campaign) return;
    
    try {
      await releaseFunds(campaign.id);
      await loadCampaignDetails();
    } catch (err) {
      console.error('Error releasing funds:', err);
      setError(err instanceof Error ? err.message : 'Failed to release funds');
    }
  };

  const handleStartVoting = async () => {
    if (!campaign) return;
    
    try {
      setIsVoting(true);
      await startVoting(campaign.id);
      await loadCampaignDetails();
    } catch (err) {
      console.error('Error starting voting:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voting');
    } finally {
      setIsVoting(false);
    }
  };

  const handleVote = async (mode: FundingMode) => {
    if (!campaign || isVoting) return;
    
    try {
      setIsVoting(true);
      await voteForFundingMode(Number(params.id), mode);
      const status = await getVotingStatus(Number(params.id));
      setVotingStatus(status);
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const canStartVoting = useMemo(() => {
    if (!campaign) return false;
    const hasReachedTarget = Number(campaign.raisedAmount) >= Number(campaign.targetAmount);
    const isDeadlineReached = Number(campaign.deadline) <= Math.floor(Date.now() / 1000);
    return hasReachedTarget || isDeadlineReached;
  }, [campaign]);

  const timeLeft = useMemo(() => {
    if (!campaign) return '';
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
  }, [campaign]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : campaign ? (
            <div className="bg-white shadow rounded-lg p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{campaign.name}</h1>
              <p className="text-gray-600 mb-4">{campaign.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="font-medium text-gray-700">Target Amount:</span>
                  <span className="ml-2 text-gray-600">{campaign.targetAmount} ETH</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Raised Amount:</span>
                  <span className="ml-2 text-gray-600">{campaign.raisedAmount} ETH</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-gray-600">
                    {CampaignStatus[campaign.status]}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Deadline:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDate(Number(campaign.deadline))}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time Left:</span>
                  <span className="ml-2 text-gray-600">{timeLeft}</span>
                </div>
              </div>

              {/* Voting Section */}
              {campaign && campaign.votingEnabled && (
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-4">Vote on Funding Mode</h2>
                  {votingStatus && (
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Total Votes: {votingStatus.totalVotes}</span>
                        <span>Required Votes: {votingStatus.requiredVotes}</span>
                      </div>
                      
                      {votingStatus.hasVoted ? (
                        <div className="text-green-600 font-medium">
                          You have already voted for {FundingMode[votingStatus.currentMode]}
                        </div>
                      ) : votingStatus.votingEnded ? (
                        <div className="text-red-600 font-medium">
                          Voting period has ended
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => handleVote(FundingMode.Donation)}
                            disabled={isVoting}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                          >
                            Vote for Donation Mode
                          </button>
                          <button
                            onClick={() => handleVote(FundingMode.Reward)}
                            disabled={isVoting}
                            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
                          >
                            Vote for Reward Mode
                          </button>
                          <button
                            onClick={() => handleVote(FundingMode.Debit)}
                            disabled={isVoting}
                            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
                          >
                            Vote for Debit Mode
                          </button>
                          <button
                            onClick={() => handleVote(FundingMode.Equity)}
                            disabled={isVoting}
                            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
                          >
                            Vote for Equity Mode
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Start Voting Button (for campaign creator) */}
              {campaign.creator === address && !campaign.votingEnabled && canStartVoting && (
                <div className="mt-4">
                  <button
                    onClick={handleStartVoting}
                    disabled={isVoting}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    Start Voting
                  </button>
                </div>
              )}

              {/* Contribution Section */}
              {campaign.status === CampaignStatus.Active && (
                <div className="mt-8 border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Contribute to Campaign</h2>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="Amount in ETH"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleContribute}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Contribute
                    </button>
                  </div>
                </div>
              )}

              {/* Campaign Status Message */}
              {campaign.status === CampaignStatus.Completed && (
                <div className="mt-8 border-t pt-6">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Campaign Completed</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>This campaign has successfully reached its target amount of {campaign.targetAmount} ETH.</p>
                          {Number(campaign.deadline) < Number(campaign.originalDeadline) && (
                            <p className="mt-2 text-yellow-700">
                              Campaign ended early on {formatDate(Number(campaign.deadline))} due to reaching the target amount.
                              Original deadline was {formatDate(Number(campaign.originalDeadline))}.
                            </p>
                          )}
                          {campaign.creator === address && (
                            <p className="mt-2">As the campaign creator, you can now release the funds to your wallet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Release Funds Button (for completed campaigns) */}
              {campaign.status === CampaignStatus.Completed && campaign.creator === address && (
                <div className="mt-4">
                  <button
                    onClick={handleReleaseFunds}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  >
                    Release Funds
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">Campaign not found</div>
          )}
        </div>
      </div>
    </div>
  );
} 