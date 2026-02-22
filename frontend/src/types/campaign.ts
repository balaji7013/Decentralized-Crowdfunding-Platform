export enum FundingMode {
    Donation = 0,
    Debit = 1,
    Reward = 2,
    Equity = 3
}

export enum CampaignStatus {
    Active = 0,
    Completed = 1,
    Expired = 2,
    UnderVoting = 3,
    Failed = 4
}

export interface Campaign {
    id: number;
    creator: string;
    name: string;
    description: string;
    targetAmount: string;
    deadline: number;
    raisedAmount: string;
    fundsReleased: boolean;
    driveLink: string;
    allowedModes: FundingMode[];
    backersCount: number;
    votingDeadline: number;
    isAllOrNothing: boolean;
    votesForAllOrNothing: number;
    votesForKeepRaised: number;
    status: CampaignStatus;
    minContribution: string;
    maxContribution: string;
}

export interface Contribution {
    amount: string;
    timestamp: number;
    refunded: boolean;
    mode: FundingMode;
}

export interface Vote {
    hasVoted: boolean;
    votedForAllOrNothing: boolean;
} 