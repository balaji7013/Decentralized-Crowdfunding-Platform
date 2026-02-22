"use client";

import { useEffect, useState } from "react";
import { useCrowdfunding } from "@/context/CrowdfundingContext";
import { ethers } from "ethers";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface Campaign {
  id: number;
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

interface Milestone {
  id: number;
  description: string;
  amount: bigint;
  deadline: bigint;
  completed: boolean;
  votes: bigint;
  approved: boolean;
}

export default function CampaignDetails() {
  const { id } = useParams();
  const { contract, address } = useCrowdfunding();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [contributionAmount, setContributionAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (contract && id) {
      loadCampaignDetails();
    }
  }, [contract, id]);

  const loadCampaignDetails = async () => {
    try {
      if (!contract) return;
      
      const campaignData = await contract.campaigns(Number(id));
      setCampaign(campaignData);

      if (campaignData.fundingMode === 1) {
        const milestoneCount = await contract.getMilestoneCount(Number(id));
        const milestonePromises = [];
        
        for (let i = 0; i < milestoneCount; i++) {
          milestonePromises.push(contract.milestones(Number(id), i));
        }
        
        const milestoneData = await Promise.all(milestonePromises);
        setMilestones(milestoneData);
      }
    } catch (error) {
      console.error("Error loading campaign details:", error);
      toast.error("Failed to load campaign details");
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!contract || !campaign || !contributionAmount) return;

    try {
      const amount = ethers.parseEther(contributionAmount);
      const tx = await contract.contribute(campaign.id, {
        value: amount,
      });
      await tx.wait();
      toast.success("Contribution successful!");
      loadCampaignDetails();
    } catch (error) {
      console.error("Error contributing:", error);
      toast.error("Failed to contribute");
    }
  };

  const handleVote = async (milestoneId: number) => {
    if (!contract || !campaign || voting) return;

    try {
      setVoting(true);
      const tx = await contract.voteForMilestone(campaign.id, milestoneId);
      await tx.wait();
      toast.success("Vote recorded successfully!");
      loadCampaignDetails();
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!contract || !campaign) return;

    try {
      const tx = await contract.releaseFunds(campaign.id);
      await tx.wait();
      toast.success("Funds released successfully!");
      loadCampaignDetails();
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast.error("Failed to release funds");
    }
  };

  const handleRedeemReward = async () => {
    if (!contract || !campaign) return;

    try {
      const tx = await contract.redeemReward(campaign.id);
      await tx.wait();
      toast.success("Reward redeemed successfully!");
      loadCampaignDetails();
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast.error("Failed to redeem reward");
    }
  };

  const fundingModeLabels = ["Donation", "Reward", "Equity", "Debit"];
  const statusLabels = ["Active", "Successful", "Failed", "Cancelled", "Completed"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading campaign details...</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Campaign not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <div className="flex space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {fundingModeLabels[campaign.fundingMode]}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {statusLabels[campaign.status]}
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">{campaign.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Campaign Progress
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(
                        (Number(campaign.raisedAmount) /
                          Number(campaign.targetAmount)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (Number(campaign.raisedAmount) /
                            Number(campaign.targetAmount)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {ethers.formatEther(campaign.raisedAmount)} ETH raised
                    </span>
                    <span className="text-gray-500">
                      {ethers.formatEther(campaign.targetAmount)} ETH goal
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Campaign Details
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creator</span>
                    <span className="text-gray-900">
                      {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Backers</span>
                    <span className="text-gray-900">
                      {campaign.backersCount.toString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deadline</span>
                    <span className="text-gray-900">
                      {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {campaign.fundingMode === 1 && milestones.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Milestones
                </h2>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">
                          Milestone {index + 1}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            milestone.completed
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {milestone.completed ? "Completed" : "Pending"}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{milestone.description}</p>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">
                          Amount: {ethers.formatEther(milestone.amount)} ETH
                        </span>
                        <span className="text-gray-500">
                          Deadline:{" "}
                          {new Date(Number(milestone.deadline) * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      {!milestone.completed && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Votes: {milestone.votes.toString()}
                          </span>
                          {address && (
                            <button
                              onClick={() => handleVote(index)}
                              disabled={voting}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              {voting ? "Voting..." : "Vote"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaign.fundingMode === 1 && campaign.creator === address && (
              <div className="mb-6">
                <button
                  onClick={handleReleaseFunds}
                  disabled={campaign.fundsReleased}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {campaign.fundsReleased
                    ? "Funds Already Released"
                    : "Release Funds"}
                </button>
              </div>
            )}

            {campaign.fundingMode === 1 && address && address !== campaign.creator && (
              <div className="mb-6">
                <button
                  onClick={handleRedeemReward}
                  disabled={campaign.rewardsRedeemed >= campaign.rewardQuota}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {campaign.rewardsRedeemed >= campaign.rewardQuota
                    ? "No Rewards Available"
                    : "Redeem Reward"}
                </button>
              </div>
            )}

            {address && address !== campaign.creator && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Contribute to Campaign
                </h2>
                <div className="flex space-x-4">
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="Amount in ETH"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleContribute}
                    disabled={!contributionAmount}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    Contribute
                  </button>
                </div>
              </div>
            )}

            {campaign.driveLink && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Additional Resources
                </h2>
                <a
                  href={campaign.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  View Project Documents
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 