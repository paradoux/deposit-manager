const hre = require("hardhat");
const ethers = hre.ethers;

const VAULT_FACTORY_ADDRESS = "0xb7449B6eBd89F8e40040FA8FDD4E587A4e5747a6";

const requiredDeposit = ethers.utils.parseEther("0.0001");
const rentalEnd = Math.floor(Date.now() / 1000);
let vaultAddr, vaultDeposit, vaultImplementation;
async function main() {
  await createAvault();
  await sendDepositToVault();
}

const initialSetting = async () => {
  const VaultFactory = await hre.ethers.getContractFactory("VaultFactory");
  const vaultFactory = await VaultFactory.attach(VAULT_FACTORY_ADDRESS);
  const [landloard, renter] = await hre.ethers.getSigners();
  return { vaultFactory, landloard, renter };
};

const createAvault = async () => {
  const { vaultFactory, landloard, renter } = await initialSetting();

  console.log("1.Create a vault");
  const tx = await vaultFactory
    .connect(landloard)
    .createNewVault(requiredDeposit, renter.address, rentalEnd);
  await tx.wait();
  const filter = vaultFactory.filters.VaultCreated();
  const event = await vaultFactory.queryFilter(filter);
  const {
    vaultId,
    vaultAddress,
    latestVaultImplementationVersionId,
    factoryAddress,
    propertyOwner,
    propertyRenter,
    rentalPeriodEnd,
    deposit,
  } = event[0].args;
  vaultAddr = vaultAddress;
  vaultDeposit = deposit;
};
const sendDepositToVault = async () => {
  const { vaultFactory, landloard, renter } = await initialSetting();
  const VaultImplementation = await hre.ethers.getContractFactory(
    "VaultImplementation"
  );
  vaultImplementation = await VaultImplementation.attach(vaultAddr);
  const tx = await vaultImplementation
    .connect(renter)
    .storeDeposit({ value: requiredDeposit });
  await tx.wait();
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
