const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdfundingPlatform", function () {
  let crowdfunding;
  let owner;
  let addr1;
  let addr2;
  const FundingMode = {
    DIRECT: 0,
    ALL_OR_NOTHING: 1,
    KEEP_IT_ALL: 2,
    MILESTONE_BASED: 3
  };

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const CrowdfundingPlatform = await ethers.getContractFactory("CrowdfundingPlatform");
    crowdfunding = await CrowdfundingPlatform.deploy();
  });

  describe("Campaign Creation", function () {
    it("Should create a new direct funding campaign", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      await crowdfunding.createCampaign(
        "Test Campaign",
        "Test Description",
        ethers.parseEther("1.0"),
        deadline,
        "drive.google.com/link",
        FundingMode.DIRECT,
        "test@example.com",
        "Additional info",
        [], // No milestones for direct funding
        [], // No milestone amounts
        ["REWARD1", "REWARD2"] // Reward codes
      );

      const campaign = await crowdfunding.getCampaign(0);
      
      expect(campaign.name).to.equal("Test Campaign");
      expect(campaign.description).to.equal("Test Description");
      expect(campaign.targetAmount).to.equal(ethers.parseEther("1.0"));
      expect(campaign.deadline).to.equal(deadline);
      expect(campaign.creator).to.equal(owner.address);
      expect(campaign.fundingMode).to.equal(FundingMode.DIRECT);
      expect(campaign.rewardQuota).to.equal(2);
    });

    it("Should create a milestone-based campaign", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const milestones = ["Milestone 1", "Milestone 2"];
      const amounts = [ethers.parseEther("0.5"), ethers.parseEther("0.5")];
      
      await crowdfunding.createCampaign(
        "Milestone Campaign",
        "Test Description",
        ethers.parseEther("1.0"),
        deadline,
        "drive.google.com/link",
        FundingMode.MILESTONE_BASED,
        "test@example.com",
        "Additional info",
        milestones,
        amounts,
        ["REWARD1"]
      );

      const campaign = await crowdfunding.getCampaign(0);
      const campaignMilestones = await crowdfunding.getCampaignMilestones(0);
      
      expect(campaign.fundingMode).to.equal(FundingMode.MILESTONE_BASED);
      expect(campaignMilestones.descriptions).to.deep.equal(milestones);
      expect(campaignMilestones.amounts[0]).to.equal(amounts[0]);
      expect(campaignMilestones.amounts[1]).to.equal(amounts[1]);
    });
  });

  describe("Contributions", function () {
    let campaignId;
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    beforeEach(async function () {
      await crowdfunding.createCampaign(
        "Test Campaign",
        "Test Description",
        ethers.parseEther("1.0"),
        deadline,
        "drive.google.com/link",
        FundingMode.DIRECT,
        "test@example.com",
        "Additional info",
        [],
        [],
        ["REWARD1"]
      );
      campaignId = 0;
    });

    it("Should accept contributions", async function () {
      await crowdfunding.connect(addr1).contribute(campaignId, {
        value: ethers.parseEther("0.5")
      });

      const campaign = await crowdfunding.getCampaign(campaignId);
      const contributions = await crowdfunding.getUserContributions(campaignId, addr1.address);
      
      expect(campaign.raisedAmount).to.equal(ethers.parseEther("0.5"));
      expect(campaign.backersCount).to.equal(1);
      expect(contributions.amounts[0]).to.equal(ethers.parseEther("0.5"));
      expect(contributions.refunded[0]).to.be.false;
    });

    it("Should not accept zero contributions", async function () {
      await expect(
        crowdfunding.connect(addr1).contribute(campaignId, {
          value: 0
        })
      ).to.be.revertedWith("Contribution must be greater than 0");
    });
  });

  describe("Fund Release and Refunds", function () {
    let campaignId;
    const targetAmount = ethers.parseEther("1.0");
    
    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      await crowdfunding.createCampaign(
        "All or Nothing Campaign",
        "Test Description",
        targetAmount,
        deadline,
        "drive.google.com/link",
        FundingMode.ALL_OR_NOTHING,
        "test@example.com",
        "Additional info",
        [],
        [],
        ["REWARD1"]
      );
      campaignId = 0;
    });

    it("Should allow refunds for ALL_OR_NOTHING if target not met", async function () {
      await crowdfunding.connect(addr1).contribute(campaignId, {
        value: ethers.parseEther("0.5")
      });

      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      await crowdfunding.connect(addr1).refund(campaignId);
      
      const contributions = await crowdfunding.getUserContributions(campaignId, addr1.address);
      expect(contributions.refunded[0]).to.be.true;
    });

    it("Should not allow refunds for DIRECT funding", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      await crowdfunding.createCampaign(
        "Direct Campaign",
        "Test Description",
        targetAmount,
        deadline,
        "drive.google.com/link",
        FundingMode.DIRECT,
        "test@example.com",
        "Additional info",
        [],
        [],
        ["REWARD1"]
      );
      const directCampaignId = 1;

      await crowdfunding.connect(addr1).contribute(directCampaignId, {
        value: ethers.parseEther("0.5")
      });

      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      await expect(
        crowdfunding.connect(addr1).refund(directCampaignId)
      ).to.be.revertedWith("Refunds only available for All-or-Nothing campaigns");
    });
  });

  describe("Rewards", function () {
    let campaignId;
    
    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      await crowdfunding.createCampaign(
        "Campaign with Rewards",
        "Test Description",
        ethers.parseEther("1.0"),
        deadline,
        "drive.google.com/link",
        FundingMode.DIRECT,
        "test@example.com",
        "Additional info",
        [],
        [],
        ["REWARD1", "REWARD2"]
      );
      campaignId = 0;
    });

    it("Should allow contributors to redeem rewards", async function () {
      await crowdfunding.connect(addr1).contribute(campaignId, {
        value: ethers.parseEther("0.5")
      });

      await crowdfunding.connect(addr1).redeemReward(campaignId);
      
      const campaign = await crowdfunding.getCampaign(campaignId);
      expect(campaign.rewardsRedeemed).to.equal(1);
      expect(campaign.rewardQuota).to.equal(1);
    });

    it("Should not allow non-contributors to redeem rewards", async function () {
      await expect(
        crowdfunding.connect(addr2).redeemReward(campaignId)
      ).to.be.revertedWith("Must be a contributor to redeem reward");
    });
  });
}); 