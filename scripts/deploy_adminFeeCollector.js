const hre = require("hardhat");

async function main() {
  const AdminFeeCollector = await hre.ethers.getContractFactory(
    "AdminFeeCollector"
  );
  const adminFeeCollector = await AdminFeeCollector.deploy();
  await adminFeeCollector.deployed();
  console.log(`AdminFeeCollector deployed to ${adminFeeCollector.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
