'use client';

import { useState } from 'react';
import { useCrowdfunding } from '../../hooks/useCrowdfunding';
import { ethers } from 'ethers';

export default function CampaignsPage() {
  const { campaigns, loading, error, loadCampaigns, createCampaign } = useCrowdfunding();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    deadline: '',
    driveLink: '',
    fundingMode: 0,
    email: '',
    additionalInfo: '',
    milestoneDescriptions: [] as string[],
    milestoneAmounts: [] as number[],
    rewardCodes: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // Convert target amount to Wei
      const targetAmountWei = ethers.parseEther(formData.targetAmount);
      
      // Convert deadline to timestamp
      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);

      await createCampaign({
        name: formData.name,
        description: formData.description,
        targetAmount: Number(formData.targetAmount),
        deadline: new Date(formData.deadline),
        driveLink: formData.driveLink,
        fundingMode: formData.fundingMode,
        email: formData.email,
        additionalInfo: formData.additionalInfo,
        milestoneDescriptions: formData.milestoneDescriptions,
        milestoneAmounts: formData.milestoneAmounts,
        rewardCodes: formData.rewardCodes
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        targetAmount: '',
        deadline: '',
        driveLink: '',
        fundingMode: 0,
        email: '',
        additionalInfo: '',
        milestoneDescriptions: [],
        milestoneAmounts: [],
        rewardCodes: []
      });
    } catch (err) {
      console.error('Error creating campaign:', err);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading campaigns...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={loadCampaigns}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Crowdfunding Campaigns</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {isCreating ? 'Cancel' : 'Create Campaign'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 border rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Create New Campaign</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Campaign Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Target Amount (ETH)</label>
              <input
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Drive Link</label>
              <input
                type="url"
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Additional Info</label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isCreating ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign, index) => (
          <div key={index} className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{campaign.name}</h2>
            <p className="text-gray-600 mb-4">{campaign.description}</p>
            <div className="space-y-2">
              <p>Target: {ethers.formatEther(campaign.targetAmount)} ETH</p>
              <p>Raised: {ethers.formatEther(campaign.raisedAmount)} ETH</p>
              <p>Deadline: {new Date(Number(campaign.deadline) * 1000).toLocaleDateString()}</p>
              <p>Status: {campaign.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 