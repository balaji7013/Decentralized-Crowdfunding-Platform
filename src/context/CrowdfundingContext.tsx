"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { CrowdfundingPlatform } from "@/contracts/types/CrowdfundingPlatform";
import CrowdfundingPlatformABI from "@/contracts/abi/CrowdfundingPlatform.json";

interface CrowdfundingContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: CrowdfundingPlatform | null;
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const CrowdfundingContext = createContext<CrowdfundingContextType>({
  provider: null,
  signer: null,
  contract: null,
  address: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export function useCrowdfunding() {
  return useContext(CrowdfundingContext);
}

export function CrowdfundingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<CrowdfundingPlatform | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if window.ethereum is available
    if (typeof window !== "undefined" && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!provider) {
        throw new Error("No provider found");
      }

      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setSigner(signer);
      setAddress(accounts[0]);

      // Initialize contract
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Contract address not found");
      }

      const contract = new ethers.Contract(
        contractAddress,
        CrowdfundingPlatformABI,
        signer
      ) as CrowdfundingPlatform;
      setContract(contract);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setSigner(null);
    setContract(null);
    setAddress(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (provider) {
      provider.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
        }
      });

      provider.on("chainChanged", () => {
        window.location.reload();
      });

      return () => {
        provider.removeAllListeners();
      };
    }
  }, [provider]);

  return (
    <CrowdfundingContext.Provider
      value={{
        provider,
        signer,
        contract,
        address,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </CrowdfundingContext.Provider>
  );
} 