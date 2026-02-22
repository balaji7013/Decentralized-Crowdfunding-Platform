# Crowdfunding Platform

A decentralized crowdfunding platform built with Next.js, Hardhat, and Solidity.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MetaMask](https://metamask.io/) browser extension (for interacting with the blockchain)

## Setup Instructions

1. **Extract the Project**
   - Extract the zip file you received to a folder on your computer
   - Open a terminal/command prompt and navigate to the project directory

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Local Blockchain**
   ```bash
   npm run node
   ```
   - Keep this terminal window open
   - This starts a local Hardhat network
   - The network will run on `http://127.0.0.1:8545`

4. **Deploy Smart Contracts**
   - Open a new terminal window
   - Navigate to the project directory
   - Run the deployment script:
   ```bash
   npm run deploy
   ```
   - Save the deployed contract address that appears in the console

5. **Start the Frontend**
   - Open a new terminal window
   - Navigate to the project directory
   - Start the development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Open your browser and go to `http://localhost:3000`

6. **Configure MetaMask**
   - Open MetaMask
   - Add a new network with these settings:
     - Network Name: Hardhat Local
     - New RPC URL: http://127.0.0.1:8545
     - Chain ID: 31337
     - Currency Symbol: ETH
   - Import one of the test accounts (ask your friend for the private key)

## Project Structure

- `/contracts` - Smart contract source files
- `/frontend` - Next.js frontend application
- `/scripts` - Deployment and other utility scripts
- `/test` - Smart contract test files

## Common Issues and Solutions

1. **If you get dependency errors:**
   - Delete the `node_modules` folder and `package-lock.json`
   - Run `npm install` again

2. **If MetaMask isn't connecting:**
   - Make sure you're on the Hardhat Local network
   - Check if MetaMask is unlocked
   - Verify the network settings are correct

3. **If the frontend isn't loading:**
   - Make sure the local blockchain is running
   - Verify that contracts are deployed
   - Check the browser console for errors

## Need Help?

If you encounter any issues or need assistance:
1. Check the error messages in the terminal
2. Make sure all prerequisites are installed correctly
3. Contact your friend (the project owner) for support

## License

This project is licensed under the ISC License - see the LICENSE file for details. 