const hre = require("hardhat");

async function main() {
  const VaultListKeeper = await hre.ethers.getContractFactory(
    "VaultListKeeper"
  );
  const vaultListKeeper = await VaultListKeeper.deploy();
  await vaultListKeeper.deployed();
  console.log(`VaultListKeeper deployed to ${vaultListKeeper.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
