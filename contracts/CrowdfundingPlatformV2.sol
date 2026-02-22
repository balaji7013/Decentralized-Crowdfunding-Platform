// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CrowdfundingPlatformV2
 * @dev An upgraded version of the decentralized crowdfunding platform with enhanced features
 */
contract CrowdfundingPlatformV2 is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _campaignIds;

    // Enums
    enum FundingMode { 
        Donation,    // Simple donation
        Debit,      // Debit/loan based funding
        Reward,     // Reward based funding
        Equity      // Equity based funding
    }

    enum CampaignStatus {
        Active,
        Completed,
        Expired,
        UnderVoting,
        Failed
    }

    // Structs
    struct Campaign {
        address creator;
        string name;
        string description;
        uint256 targetAmount;
        uint256 deadline;
        uint256 originalDeadline; // Store the original deadline
        uint256 raisedAmount;
        bool fundsReleased;
        string driveLink;
        FundingMode[] allowedModes;
        uint256 backersCount;
        uint256 votingDeadline;
        bool isAllOrNothing;
        uint256 votesForAllOrNothing;
        uint256 votesForKeepRaised;
        CampaignStatus status;
        uint256 minContribution;
        uint256 maxContribution;
        bool votingEnabled;
        uint256 totalVotes;
        uint256 requiredVotes;
        uint256 votingEndTime;
        FundingMode currentMode;
        address[] backers;
    }

    struct Contribution {
        uint256 amount;
        uint256 timestamp;
        bool refunded;
        FundingMode mode;
    }

    struct Vote {
        bool hasVoted;
        bool votedForAllOrNothing;
    }

    // State variables
    uint256 public campaignCount;
    uint256 public platformFee = 25; // 2.5% fee (in basis points)
    uint256 public constant VOTING_DURATION = 7 days;
    
    // Mappings
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => Contribution[])) public contributions;
    mapping(uint256 => mapping(address => Vote)) public campaignVotes;
    mapping(uint256 => mapping(address => FundingMode)) public backerFundingModes;
    mapping(uint256 => mapping(address => bool)) public voterHasVoted;
    mapping(uint256 => mapping(address => uint256)) public voteWeight;
    mapping(uint256 => mapping(address => FundingMode)) public votes;

    // Events
    event CampaignCreated(
        uint256 indexed campaignId, 
        address indexed creator, 
        string name, 
        uint256 targetAmount,
        FundingMode[] allowedModes
    );
    event ContributionMade(
        uint256 indexed campaignId, 
        address indexed contributor, 
        uint256 amount, 
        FundingMode mode
    );
    event VoteCast(
        uint256 indexed campaignId, 
        address indexed voter, 
        FundingMode mode,
        uint256 weight
    );
    event CampaignStatusUpdated(
        uint256 indexed campaignId, 
        CampaignStatus status
    );
    event FundsReleased(
        uint256 indexed campaignId, 
        address indexed creator, 
        uint256 amount
    );
    event RefundIssued(
        uint256 indexed campaignId, 
        address indexed contributor, 
        uint256 amount
    );
    event VotingStarted(uint256 indexed campaignId, uint256 endTime);
    event VotingEnded(uint256 indexed campaignId, FundingMode winningMode);
    event CampaignCompleted(uint256 indexed campaignId);

    modifier onlyCreator(uint256 campaignId) {
        require(msg.sender == campaigns[campaignId].creator, "Not campaign creator");
        _;
    }

    modifier campaignExists(uint256 campaignId) {
        require(campaignId < _campaignIds.current(), "Campaign does not exist");
        _;
    }

    modifier campaignActive(uint256 campaignId) {
        require(campaigns[campaignId].status == CampaignStatus.Active, "Campaign not active");
        _;
    }

    /**
     * @dev Creates a new crowdfunding campaign with specified funding modes
     */
    function createCampaign(
        string memory name,
        string memory description,
        uint256 targetAmount,
        uint256 deadline,
        string memory driveLink,
        FundingMode[] memory allowedModes,
        uint256 minContribution,
        uint256 maxContribution
    ) external returns (uint256) {
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(allowedModes.length > 0, "Must specify at least one funding mode");
        require(minContribution <= maxContribution, "Min contribution must be <= max");

        uint256 campaignId = _campaignIds.current();
        Campaign storage campaign = campaigns[campaignId];
        
        campaign.creator = msg.sender;
        campaign.name = name;
        campaign.description = description;
        campaign.targetAmount = targetAmount;
        campaign.deadline = deadline;
        campaign.originalDeadline = deadline; // Store the original deadline
        campaign.driveLink = driveLink;
        campaign.allowedModes = allowedModes;
        campaign.status = CampaignStatus.Active;
        campaign.minContribution = minContribution;
        campaign.maxContribution = maxContribution;
        campaign.votingDeadline = deadline + VOTING_DURATION;

        _campaignIds.increment();
        campaignCount += 1;
        
        emit CampaignCreated(campaignId, msg.sender, name, targetAmount, allowedModes);
        return campaignId;
    }

    /**
     * @dev Contribute to a campaign with specified funding mode
     */
    function contribute(uint256 campaignId) external payable {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.status == CampaignStatus.Active, "Campaign is not active");
        require(msg.value > 0, "Contribution must be greater than 0");
        require(block.timestamp <= campaign.deadline, "Campaign has ended");

        // Record contribution
        contributions[campaignId][msg.sender] += msg.value;
        campaign.raisedAmount += msg.value;
        campaign.backersCount += 1;
        campaign.backers.push(msg.sender);

        // Check if campaign has reached target amount
        if (campaign.raisedAmount >= campaign.targetAmount) {
            campaign.status = CampaignStatus.Completed;
            campaign.deadline = block.timestamp; // End the campaign immediately
            emit CampaignCompleted(campaignId);
        }

        emit ContributionReceived(campaignId, msg.sender, msg.value);
    }

    /**
     * @dev Start voting for a campaign
     */
    function startVoting(uint256 campaignId) external {
        Campaign storage campaign = campaigns[campaignId];
        require(msg.sender == campaign.creator, "Only creator can start voting");
        require(!campaign.votingEnabled, "Voting already started");
        require(campaign.raisedAmount >= campaign.targetAmount, "Target not reached");
        
        campaign.votingEnabled = true;
        campaign.votingEndTime = block.timestamp + 7 days; // 7 days voting period
        campaign.requiredVotes = campaign.backersCount / 2; // 50% of backers must vote
        
        emit VotingStarted(campaignId, campaign.votingEndTime);
    }

    /**
     * @dev Vote on campaign funding model (All or Nothing vs Keep What's Raised)
     */
    function vote(uint256 campaignId, FundingMode mode) external {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.votingEnabled, "Voting not started");
        require(block.timestamp <= campaign.votingEndTime, "Voting ended");
        require(!voterHasVoted[campaignId][msg.sender], "Already voted");
        require(contributions[campaignId][msg.sender].length > 0, "No contribution found");
        
        uint256 weight = contributions[campaignId][msg.sender][0].amount;
        votes[campaignId][msg.sender] = mode;
        voteWeight[campaignId][msg.sender] = weight;
        voterHasVoted[campaignId][msg.sender] = true;
        campaign.totalVotes += weight;
        
        emit VoteCast(campaignId, msg.sender, mode, weight);
        
        // Check if voting can be ended
        if (campaign.totalVotes >= campaign.requiredVotes) {
            endVoting(campaignId);
        }
    }

    /**
     * @dev End voting for a campaign
     */
    function endVoting(uint256 campaignId) internal {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.votingEnabled, "Voting not started");
        
        // Calculate winning mode
        uint256[4] memory modeVotes; // Array to store votes for each mode
        address[] memory backers = getCampaignBackers(campaignId);
        
        for (uint256 i = 0; i < backers.length; i++) {
            if (voterHasVoted[campaignId][backers[i]]) {
                uint256 modeIndex = uint256(votes[campaignId][backers[i]]);
                modeVotes[modeIndex] += voteWeight[campaignId][backers[i]];
            }
        }
        
        // Find mode with highest votes
        uint256 maxVotes = 0;
        FundingMode winningMode = FundingMode(0); // Default to first mode
        
        for (uint256 i = 0; i < 4; i++) {
            if (modeVotes[i] > maxVotes) {
                maxVotes = modeVotes[i];
                winningMode = FundingMode(i);
            }
        }
        
        // Update campaign funding mode
        campaign.currentMode = winningMode;
        campaign.votingEnabled = false;
        
        emit VotingEnded(campaignId, winningMode);
    }

    /**
     * @dev Get campaign backers
     */
    function getCampaignBackers(uint256 campaignId) public view returns (address[] memory) {
        Campaign storage campaign = campaigns[campaignId];
        address[] memory backers = new address[](campaign.backersCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < campaign.backersCount; i++) {
            address backer = campaign.backers[i];
            if (contributions[campaignId][backer].length > 0) {
                backers[index] = backer;
                index++;
            }
        }
        
        return backers;
    }

    /**
     * @dev Finalize campaign and determine fund distribution
     */
    function finalizeCampaign(uint256 campaignId) 
        external 
        campaignExists(campaignId) 
        nonReentrant 
    {
        Campaign storage campaign = campaigns[campaignId];
        require(block.timestamp > campaign.votingDeadline, "Voting period not ended");
        require(campaign.status == CampaignStatus.UnderVoting, "Campaign not in voting state");
        require(!campaign.fundsReleased, "Funds already released");

        bool isAllOrNothing = campaign.votesForAllOrNothing > campaign.votesForKeepRaised;
        campaign.isAllOrNothing = isAllOrNothing;

        if (isAllOrNothing && campaign.raisedAmount < campaign.targetAmount) {
            campaign.status = CampaignStatus.Failed;
            emit CampaignStatusUpdated(campaignId, CampaignStatus.Failed);
        } else {
            uint256 fee = (campaign.raisedAmount * platformFee) / 1000;
            uint256 amount = campaign.raisedAmount - fee;
            
            campaign.fundsReleased = true;
            campaign.status = CampaignStatus.Completed;
            
            payable(campaign.creator).transfer(amount);
            payable(owner()).transfer(fee);
            
            emit FundsReleased(campaignId, campaign.creator, amount);
            emit CampaignStatusUpdated(campaignId, CampaignStatus.Completed);
        }
    }

    /**
     * @dev Request refund for failed campaign
     */
    function requestRefund(uint256 campaignId) 
        external 
        campaignExists(campaignId) 
        nonReentrant 
    {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.status == CampaignStatus.Failed, "Refunds not available");

        Contribution[] storage userContributions = contributions[campaignId][msg.sender];
        uint256 refundAmount = 0;

        for (uint256 i = 0; i < userContributions.length; i++) {
            if (!userContributions[i].refunded) {
                refundAmount += userContributions[i].amount;
                userContributions[i].refunded = true;
            }
        }

        require(refundAmount > 0, "No refund available");
        
        campaign.raisedAmount -= refundAmount;
        payable(msg.sender).transfer(refundAmount);
        
        emit RefundIssued(campaignId, msg.sender, refundAmount);
    }

    /**
     * @dev Update campaign status based on current state
     */
    function updateCampaignStatus(uint256 campaignId) 
        external 
        campaignExists(campaignId) 
    {
        Campaign storage campaign = campaigns[campaignId];
        
        if (campaign.status == CampaignStatus.Active && block.timestamp >= campaign.deadline) {
            campaign.status = CampaignStatus.UnderVoting;
            emit CampaignStatusUpdated(campaignId, CampaignStatus.UnderVoting);
        }
    }

    /**
     * @dev Get campaign details
     */
    function getCampaign(uint256 campaignId) 
        external 
        view 
        returns (
            address creator,
            string memory name,
            string memory description,
            uint256 targetAmount,
            uint256 deadline,
            uint256 raisedAmount,
            bool fundsReleased,
            string memory driveLink,
            FundingMode[] memory allowedModes,
            CampaignStatus status,
            uint256 votingDeadline,
            uint256 votesForAllOrNothing,
            uint256 votesForKeepRaised
        ) 
    {
        require(campaignId < _campaignIds.current(), "Campaign does not exist");
        Campaign storage campaign = campaigns[campaignId];
        
        return (
            campaign.creator,
            campaign.name,
            campaign.description,
            campaign.targetAmount,
            campaign.deadline,
            campaign.raisedAmount,
            campaign.fundsReleased,
            campaign.driveLink,
            campaign.allowedModes,
            campaign.status,
            campaign.votingDeadline,
            campaign.votesForAllOrNothing,
            campaign.votesForKeepRaised
        );
    }

    /**
     * @dev Get user contributions for a campaign
     */
    function getContributions(uint256 campaignId, address contributor) 
        external 
        view 
        returns (Contribution[] memory) 
    {
        return contributions[campaignId][contributor];
    }

    /**
     * @dev Get user's vote for a campaign
     */
    function getVote(uint256 campaignId, address voter) 
        external 
        view 
        returns (bool hasVoted, bool votedForAllOrNothing) 
    {
        Vote memory voterVote = campaignVotes[campaignId][voter];
        return (voterVote.hasVoted, voterVote.votedForAllOrNothing);
    }

    /**
     * @dev Check if an address has voted on a campaign
     */
    function hasVoted(uint256 campaignId, address voter) 
        external 
        view 
        campaignExists(campaignId) 
        returns (bool) 
    {
        return campaignVotes[campaignId][voter].hasVoted;
    }

    /**
     * @dev Get voting statistics for a campaign
     */
    function getVoteStats(uint256 campaignId) 
        external 
        view 
        campaignExists(campaignId) 
        returns (uint256 totalVotes, uint256 approvalVotes, uint256 rejectionVotes) 
    {
        Campaign storage campaign = campaigns[campaignId];
        return (
            campaign.votesForAllOrNothing + campaign.votesForKeepRaised,
            campaign.votesForAllOrNothing,
            campaign.votesForKeepRaised
        );
    }
} 