import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../config';

interface Web3ContextType {
  address: string | null;
  contract: ethers.Contract | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  contract: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);

      const crowdfundingContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setContract(crowdfundingContract);

      // Set up event listeners
      crowdfundingContract.on('CampaignCreated', (campaignId, creator, name, targetAmount) => {
        console.log('Campaign Created:', { campaignId, creator, name, targetAmount });
      });

      crowdfundingContract.on('ContributionMade', (campaignId, contributor, amount) => {
        console.log('Contribution Made:', { campaignId, contributor, amount });
      });

      crowdfundingContract.on('FundsReleased', (campaignId, creator, amount) => {
        console.log('Funds Released:', { campaignId, creator, amount });
      });

      crowdfundingContract.on('RefundIssued', (campaignId, contributor, amount) => {
        console.log('Refund Issued:', { campaignId, contributor, amount });
      });

      crowdfundingContract.on('MilestoneVoteReceived', (campaignId, milestoneIndex, voter) => {
        console.log('Milestone Vote Received:', { campaignId, milestoneIndex, voter });
      });

      crowdfundingContract.on('RewardRedeemed', (campaignId, backer) => {
        console.log('Reward Redeemed:', { campaignId, backer });
      });

      crowdfundingContract.on('CampaignStatusUpdated', (campaignId, status) => {
        console.log('Campaign Status Updated:', { campaignId, status });
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    if (contract) {
      // Remove all event listeners
      contract.removeAllListeners();
    }
    setAddress(null);
    setContract(null);
  };

  useEffect(() => {
    // Check if wallet is already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        })
        .catch(console.error);
    }
  }, []);

  return (
    <Web3Context.Provider value={{ address, contract, connectWallet, disconnectWallet }}>
      {children}
    </Web3Context.Provider>
  );
}; 