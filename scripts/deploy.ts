const hre = require("hardhat");

async function main() {
  const CrowdfundingPlatform = await hre.ethers.getContractFactory("CrowdfundingPlatform");
  const crowdfundingPlatform = await CrowdfundingPlatform.deploy();

  await crowdfundingPlatform.waitForDeployment();

  console.log(
    `CrowdfundingPlatform deployed to ${await crowdfundingPlatform.getAddress()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 