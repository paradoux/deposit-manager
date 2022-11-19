const hre = require("hardhat");

async function main() {
  const DeFiRouter = await hre.ethers.getContractFactory("DeFiRouter");
  const deFiRouter = await DeFiRouter.deploy();
  await deFiRouter.deployed();
  console.log(`deFiRouter deployed to ${deFiRouter.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
