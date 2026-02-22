# Decentralized Crowdfunding Platform 🌐💰

A blockchain-based decentralized crowdfunding system built using **Solidity, Hardhat, and Next.js**, designed to provide transparency, security, and trustless fundraising through smart contracts.

---

## 📌 Abstract

Traditional crowdfunding platforms operate under centralized control, leading to high fees, limited transparency, and trust concerns.  

This project introduces a **decentralized crowdfunding platform** powered by Ethereum smart contracts that ensures:

- Transparent fund management  
- Secure transactions  
- Milestone-based fund release  
- Trustless execution  
- Global accessibility

By eliminating intermediaries, the platform provides a more secure and accountable fundraising ecosystem.

---

## 🎯 Objectives

- Eliminate centralized intermediaries  
- Reduce platform fees  
- Ensure transparency through blockchain  
- Enable milestone-based fund release  
- Support multiple funding models  
- Allow global participation

---

## 🚀 Key Features

### 🔹 Decentralized Architecture  
No central authority — all logic executed via smart contracts.

### 🔹 Smart Contract Automation  
Handles:
- Campaign creation  
- Fund contributions  
- Contribution tracking  
- Fund release logic  

### 🔹 Milestone-Based Fund Release  
Funds are released only after milestone completion, increasing accountability.

### 🔹 Secure Transactions  
All contributions are stored and executed on-chain.

### 🔹 Global Access  
Anyone with an Ethereum wallet can participate.

---

## 🛠 Tech Stack

| Layer | Technology |
|--------|------------|
| Blockchain | Ethereum |
| Smart Contracts | Solidity (v0.8.x) |
| Development Framework | Hardhat |
| Frontend | Next.js |
| Blockchain Interaction | Ethers.js |
| Wallet | MetaMask |

---

## 🏗 System Architecture

The platform follows a three-layer architecture:

### 1️⃣ Blockchain Layer  
- Ethereum Network  
- Smart Contracts written in Solidity  
- Handles business logic and fund management  

### 2️⃣ Middleware Layer  
- Ethers.js  
- Connects frontend to smart contracts  

### 3️⃣ Frontend Layer  
- Next.js Application  
- Wallet integration via MetaMask  
- User interface for campaign management  

---

## 📁 Project Structure

```
contracts/     → Smart contract source files  
scripts/       → Deployment scripts  
test/          → Smart contract test files  
frontend/      → Next.js frontend application  
hardhat.config.js  
package.json
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```
git clone https://github.com/balaji7013/Decentralized-Crowdfunding-Platform.git
cd Decentralized-Crowdfunding-Platform
```

---

### 2️⃣ Install Dependencies

```
npm install
```

---

### 3️⃣ Start Local Blockchain

```
npx hardhat node
```

Runs at:  
`http://127.0.0.1:8545`

---

### 4️⃣ Deploy Smart Contracts

```
npx hardhat run scripts/deploy.js --network localhost
```

Save the deployed contract address.

---

### 5️⃣ Start Frontend

```
cd frontend
npm install
npm run dev
```

Open:  
`http://localhost:3000`

---

### 6️⃣ Configure MetaMask

Add a custom network:

- **Network Name:** Hardhat Local  
- **RPC URL:** http://127.0.0.1:8545  
- **Chain ID:** 31337  
- **Currency Symbol:** ETH  

Import one of the Hardhat test accounts.

---

## 🔐 Security Considerations

- Solidity 0.8.x overflow protection  
- Controlled contract functions  
- Proper input validation  
- Isolated local development network  
- Secure wallet authentication

---
## 📸 Screenshots

### 🏠 Homepage (Updated UI)
![Homepage](UpdatedHome.png)

---

### 🔐 Homepage After Wallet Connection
![Homepage After Wallet](HomePageAfterWalletConnection.png)

---

### 📋 All Campaigns
![All Campaigns](AllCampaigns.png)

---

### ➕ Create Campaign Form
![Create Campaign](CampaignForm.png)

---

### 👤 User Profile
![Profile](profile.png)

## 🧪 Testing

Smart contracts are tested using Hardhat:

```
npx hardhat test
```

Testing ensures:
- Correct campaign creation
- Accurate contribution tracking
- Secure fund handling

---

## 📊 Comparison with Traditional Platforms

| Feature | Traditional | This Platform |
|----------|------------|---------------|
| Control | Centralized | Decentralized |
| Transparency | Limited | Fully On-chain |
| Fund Release | Lump Sum | Milestone-Based |
| Fees | High | Minimal |
| Trust Requirement | High | Trustless |

---

## 🎯 Conclusion

This project demonstrates how blockchain technology can transform crowdfunding into a transparent, secure, and decentralized financial ecosystem.

By leveraging Ethereum smart contracts and Web3 integration, it ensures accountability, reduces risk, and removes the need for intermediaries.

---
