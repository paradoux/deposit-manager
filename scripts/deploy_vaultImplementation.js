const hre = require("hardhat");

async function main() {
  const VaultImplementation = await hre.ethers.getContractFactory(
    "VaultImplementation"
  );
  const vaultImplementation = await VaultImplementation.deploy();
  await vaultImplementation.deployed();
  console.log(`vaultImplementation deployed to ${vaultImplementation.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
