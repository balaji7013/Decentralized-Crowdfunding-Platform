'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '../../context/Web3Context';
import { useCrowdfunding } from '../../hooks/useCrowdfunding';
import Navigation from '../../components/Navigation';
import { FundingMode } from '../../types/campaign';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { isConnected } = useWeb3();
  const { createCampaign } = useCrowdfunding();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    deadline: '',
    fundingMode: FundingMode.DONATION,
    allowedModes: [FundingMode.DONATION] as FundingMode[],
    driveLink: '',
    email: '',
    additionalInfo: '',
    rewardCodes: [''],
    rewardDetails: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate funding modes
      if (formData.allowedModes.length === 0) {
        throw new Error('Please select at least one funding mode');
      }

      // Validate mode-specific fields
      if (formData.allowedModes.includes(FundingMode.REWARD) && !formData.rewardDetails) {
        throw new Error('Please specify reward details for reward funding');
      }

      // Convert target amount to number
      const targetAmount = parseFloat(formData.targetAmount);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        throw new Error('Please enter a valid target amount');
      }
      
      // Convert deadline to Date
      const deadline = new Date(formData.deadline);
      if (deadline <= new Date()) {
        throw new Error('Deadline must be in the future');
      }

      // Filter out empty reward codes
      const rewardCodes = formData.rewardCodes.filter(code => code !== '');

      // Use the first selected mode as primary mode
      const primaryMode = formData.allowedModes[0];

      console.log('Creating campaign with:', {
        name: formData.name,
        description: formData.description,
        targetAmount,
        deadline,
        fundingMode: primaryMode,
        driveLink: formData.driveLink,
        email: formData.email,
        additionalInfo: formData.additionalInfo
      });

      await createCampaign({
        name: formData.name,
        description: formData.description,
        targetAmount,
        deadline,
        fundingMode: primaryMode,
        driveLink: formData.driveLink,
        email: formData.email,
        additionalInfo: formData.additionalInfo
      });

      // Show success message
      alert('Campaign created successfully!');
      router.push('/campaigns');
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const addRewardCode = () => {
    setFormData(prev => ({
      ...prev,
      rewardCodes: [...prev.rewardCodes, '']
    }));
  };

  const updateRewardCode = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      rewardCodes: prev.rewardCodes.map((code, i) => 
        i === index ? value : code
      )
    }));
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Please connect your wallet to create a campaign</h2>
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
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Campaign</h1>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Campaign Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Campaign Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Amount (ETH)</label>
                  <input
                    type="number"
                    required
                    step="0.000000000000000001"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Google Drive Link</label>
                  <input
                    type="url"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.driveLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, driveLink: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Information</label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  />
                </div>
              </div>

              {/* Funding Modes Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Funding Modes</h3>
                <p className="text-sm text-gray-500 mb-4">Select one or more funding modes that will be available for backers to choose from:</p>
                <div className="space-y-2">
                  {/* Select All Option */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="select-all-modes"
                      checked={Object.values(FundingMode).filter(mode => typeof mode === 'number').length === formData.allowedModes.length}
                      onChange={(e) => {
                        const allModes = Object.values(FundingMode).filter(mode => typeof mode === 'number') as FundingMode[];
                        setFormData(prev => ({
                          ...prev,
                          allowedModes: e.target.checked ? allModes : []
                        }));
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="select-all-modes" className="ml-2 block text-sm font-semibold text-gray-900">
                      Select All Modes
                    </label>
                  </div>
                  {/* Individual Mode Options */}
                  {Object.entries(FundingMode)
                    .filter(([key, value]) => typeof value === 'number')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`funding-mode-${key}`}
                          checked={formData.allowedModes.includes(value as FundingMode)}
                          onChange={(e) => {
                            const mode = value as FundingMode;
                            const newModes = e.target.checked
                              ? [...formData.allowedModes, mode]
                              : formData.allowedModes.filter(m => m !== mode);
                            setFormData(prev => ({
                              ...prev,
                              allowedModes: newModes
                            }));
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`funding-mode-${key}`} className="ml-2 block text-sm text-gray-900">
                          {key.replace(/_/g, ' ')}
                        </label>
                      </div>
                  ))}
                </div>
                {formData.allowedModes.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">Please select at least one funding mode</p>
                )}
              </div>

              {/* Contact Information Section */}
              {formData.allowedModes.includes(FundingMode.EQUITY) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Reward Information Section */}
              {formData.allowedModes.includes(FundingMode.REWARD) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Reward Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reward Details</label>
                    <textarea
                      required
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.rewardDetails}
                      onChange={(e) => setFormData(prev => ({ ...prev, rewardDetails: e.target.value }))}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Reward Codes</label>
                    {formData.rewardCodes.map((code, index) => (
                      <div key={index} className="mt-2">
                        <input
                          type="text"
                          placeholder="Reward Code"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          value={code}
                          onChange={(e) => updateRewardCode(index, e.target.value)}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addRewardCode}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      + Add Reward Code
                    </button>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Creating Campaign...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 