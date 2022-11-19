const hre = require("hardhat");

async function main() {
  const VAULT_SORTED_LIST_ADDRESS =
    "0x86C6389cE6B243561144cD8356c94663934d127a";
  const VAULT_IMPLEMENTATION_ADDRESS =
    "0x11eb8Cec495EE5731Fc723A16E37dff4c226D324";

  const DEFAULT_ADMIN_ROLE = hre.ethers.constants.HashZero;
  const VaultFactory = await hre.ethers.getContractFactory("VaultFactory");
  const vaultFactory = await VaultFactory.deploy(VAULT_IMPLEMENTATION_ADDRESS);
  await vaultFactory.deployed();

  const VaultSortedList = await hre.ethers.getContractFactory(
    "VaultSortedList"
  );
  const vaultSortedList = await VaultSortedList.attach(
    VAULT_SORTED_LIST_ADDRESS
  );
  vaultSortedList.grantRole(DEFAULT_ADMIN_ROLE, vaultFactory.address);
  console.log(`vaultFactory deployed to ${vaultFactory.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
