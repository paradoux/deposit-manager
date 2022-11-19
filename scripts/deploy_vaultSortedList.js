const hre = require("hardhat");

async function main() {
  const VaultSortedList = await hre.ethers.getContractFactory(
    "VaultSortedList"
  );
  const vaultSortedList = await VaultSortedList.deploy();
  await vaultSortedList.deployed();
  console.log(`vaultSortedList deployed to ${vaultSortedList.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
