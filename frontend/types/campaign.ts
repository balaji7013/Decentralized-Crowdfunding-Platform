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

export interface VotingStatus {
  hasVoted: boolean;
  totalVotes: number;
  requiredVotes: number;
  currentMode: FundingMode;
  votingEnded: boolean;
}

export interface Campaign {
  id: number;
  creator: string;
  name: string;
  description: string;
  targetAmount: string;
  raisedAmount: string;
  deadline: number;
  originalDeadline: number;
  status: CampaignStatus;
  driveLink: string;
  allowedModes: FundingMode[];
  votingEnabled: boolean;
  votingEndTime: number;
  currentMode: FundingMode;
  totalVotes: number;
  requiredVotes: number;
  backersCount: number;
}

export interface Milestone {
  description: string;
  amount: string;
  completed: boolean;
}

export interface UserContribution {
  amount: string;
  timestamp: Date;
  mode: FundingMode;
}

export interface CreateCampaignData {
  name: string;
  description: string;
  targetAmount: string;
  deadline: Date;
  fundingMode: FundingMode;
  driveLink?: string;
  email?: string;
  additionalInfo?: string;
} 