"use client";

import { useState } from "react";
import { useCrowdfunding } from "@/context/CrowdfundingContext";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface Milestone {
  description: string;
  amount: string;
  deadline: string;
}

export default function CreateCampaign() {
  const router = useRouter();
  const { contract } = useCrowdfunding();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    deadline: "",
    driveLink: "",
    fundingMode: "0",
    email: "",
    additionalInfo: "",
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { description: "", amount: "", deadline: "" },
    ]);
  };

  const handleMilestoneChange = (
    index: number,
    field: keyof Milestone,
    value: string
  ) => {
    setMilestones((prev) =>
      prev.map((milestone, i) =>
        i === index ? { ...milestone, [field]: value } : milestone
      )
    );
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setLoading(true);

      const targetAmount = ethers.parseEther(formData.targetAmount);
      const deadline = Math.floor(new Date(formData.deadline).getTime() / 1000);

      let tx;
      if (formData.fundingMode === "1" && milestones.length > 0) {
        // Create milestone-based campaign
        const milestoneData = milestones.map((milestone) => ({
          description: milestone.description,
          amount: ethers.parseEther(milestone.amount),
          deadline: Math.floor(new Date(milestone.deadline).getTime() / 1000),
        }));

        tx = await contract.createMilestoneCampaign(
          formData.name,
          formData.description,
          targetAmount,
          deadline,
          formData.driveLink,
          formData.email,
          formData.additionalInfo,
          milestoneData
        );
      } else {
        // Create direct campaign
        tx = await contract.createDirectCampaign(
          formData.name,
          formData.description,
          targetAmount,
          deadline,
          formData.driveLink,
          formData.email,
          formData.additionalInfo
        );
      }

      await tx.wait();
      toast.success("Campaign created successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Create New Campaign
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Campaign Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="targetAmount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Target Amount (ETH)
                </label>
                <input
                  type="number"
                  id="targetAmount"
                  name="targetAmount"
                  required
                  step="0.000000000000000001"
                  value={formData.targetAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="deadline"
                  className="block text-sm font-medium text-gray-700"
                >
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  required
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="fundingMode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Funding Mode
                </label>
                <select
                  id="fundingMode"
                  name="fundingMode"
                  required
                  value={formData.fundingMode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="0">Direct Funding</option>
                  <option value="1">Milestone-Based</option>
                  <option value="2">Equity</option>
                  <option value="3">Debit</option>
                </select>
              </div>

              {formData.fundingMode === "1" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Milestones
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Milestone
                    </button>
                  </div>

                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium text-gray-900">
                            Milestone {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveMilestone(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor={`milestone-description-${index}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Description
                            </label>
                            <textarea
                              id={`milestone-description-${index}`}
                              required
                              value={milestone.description}
                              onChange={(e) =>
                                handleMilestoneChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`milestone-amount-${index}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Amount (ETH)
                            </label>
                            <input
                              type="number"
                              id={`milestone-amount-${index}`}
                              required
                              step="0.000000000000000001"
                              value={milestone.amount}
                              onChange={(e) =>
                                handleMilestoneChange(
                                  index,
                                  "amount",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`milestone-deadline-${index}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Deadline
                            </label>
                            <input
                              type="datetime-local"
                              id={`milestone-deadline-${index}`}
                              required
                              value={milestone.deadline}
                              onChange={(e) =>
                                handleMilestoneChange(
                                  index,
                                  "deadline",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="driveLink"
                  className="block text-sm font-medium text-gray-700"
                >
                  Google Drive Link (Optional)
                </label>
                <input
                  type="url"
                  id="driveLink"
                  name="driveLink"
                  value={formData.driveLink}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contact Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="additionalInfo"
                  className="block text-sm font-medium text-gray-700"
                >
                  Additional Information (Optional)
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows={4}
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 