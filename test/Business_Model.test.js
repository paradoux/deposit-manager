const { ethers } = require("hardhat");
const { expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
describe("Entire_Process_Test_On_Forked_Network", () => {
  const DEFI_ROUTER_ADDRESS = "0xEf200BAE3936CDb18D55bD87DF3F447c89093b95";
  const VAULT_SORTED_LIST_ADDRESS =
    "0x4fF83E677e065da576e33E0279ccBa401B4730c9";
  const ADMIN_FEE_COLLECTOR_ADDRESS =
    "0xf7bA4f37a0C3D4AB46A3b14fdD556c758460E76d";
  const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
  const VAULT_SORTED_LIST_MANAGER =
    "0x619a10e1d10da142c7a64557af737368a04c9a5658b05c381e703cf6a7a091e9";
  const AAVE_DAI = "0x9a753f0f7886c9fbf63cf59d0d4423c5eface95b";
  const AAVE_ADAI = "0xdd4f3ee61466c4158d394d57f3d4c397e91fbc51";
  const OWNER_ADDRESS = "0x2ED8c989E2f995387cf4f2c560F25Dd15c0EFEE5";
  const LANDLOARD_ADDRESS = "0x46D1D7567FE8B8b655CbA269bdD29d1B0a284a47";
  const RENTER_ADDRESS = "0x72545dD7Ee3cb64a4a51F9DfBE3F1B01d2B9B7F8";
  const provider = ethers.getDefaultProvider();
  let owner,
    landloard,
    renter,
    vaultSortedList,
    vaultImplementations,
    vaultFactory,
    defiRouter,
    lendingPool,
    aaveDai,
    aaveADai;

  let currentVaultAddress;

  before(async () => {
    await helpers.impersonateAccount(OWNER_ADDRESS);
    owner = await ethers.getSigner(OWNER_ADDRESS);
    await helpers.impersonateAccount(LANDLOARD_ADDRESS);
    landloard = await ethers.getSigner(LANDLOARD_ADDRESS);
    await helpers.impersonateAccount(RENTER_ADDRESS);
    renter = await ethers.getSigner(RENTER_ADDRESS);

    vaultSortedList = await ethers.getContractAt(
      "VaultSortedList",
      VAULT_SORTED_LIST_ADDRESS
    );

    defiRouter = await ethers.getContractAt("DeFiRouter", DEFI_ROUTER_ADDRESS);
    aaveDai = await ethers.getContractAt("IERC20", AAVE_DAI);
    aaveADai = await ethers.getContractAt("IERC20", AAVE_ADAI);

    const VaultImplementations = await ethers.getContractFactory(
      "VaultImplementation"
    );
    vaultImplementations = await VaultImplementations.deploy();
    await vaultImplementations.deployed();
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    vaultFactory = await VaultFactory.deploy(vaultImplementations.address);
    await vaultFactory.deployed();

    console.log(`Assign a role "DEFAUNT_ADMIN_ROLE" TO vaultFactory`);
    console.log(
      `so that VaultFactory can give a role "VAULT_SORTED_LIST_MANAGER" to a vault when a vault is created.`
    );

    await vaultSortedList
      .connect(owner)
      .grantRole(DEFAULT_ADMIN_ROLE, vaultFactory.address);
  });

  it("1. Create a new Vault", async () => {
    const expectDeposit = ethers.utils.parseEther("0.001");
    const endOfRentalPeriod = Math.floor(
      new Date(2022, 10, 19, 0, 0, 0).getTime() / 1000
    );
    const tx = await vaultFactory
      .connect(landloard)
      .createNewVault(expectDeposit, RENTER_ADDRESS, endOfRentalPeriod);
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
    console.log(event[0].args.propertyOwner);

    console.log(`_______________________________________________`);
    console.log(`CREATE A VAULT`);
    console.log(`vaultId:${vaultId}`);
    console.log(`newVaultAddress:${vaultAddress}`);
    console.log(
      `latestVaultImplementationVersionId:${latestVaultImplementationVersionId}`
    );
    console.log(`factoryAddress:${factoryAddress}`);
    console.log(`propertyOwner:${propertyOwner}`);
    console.log(`propertyRenter:${propertyRenter}`);
    console.log(`rentalPeriodEnd:${rentalPeriodEnd}`);
    console.log(`deposit:${deposit}`);
    console.log(`_______________________________________________`);
    currentVaultAddress = vaultAddress;

    expect(propertyOwner).to.eq(LANDLOARD_ADDRESS);
    expect(propertyRenter).to.eq(RENTER_ADDRESS);
    expect(rentalPeriodEnd).to.eq(endOfRentalPeriod);
    expect(deposit).to.eq(expectDeposit);
  });
  it("2. Renter sends the required dposit", async () => {
    vaultImplementations = await ethers.getContractAt(
      "VaultImplementation",
      currentVaultAddress
    );
    const requiredDeposit = ethers.utils.parseEther("0.001");
    const tx = await vaultImplementations.connect(renter).storeDeposit({
      value: requiredDeposit,
    });
    await tx.wait();
    const filter = vaultImplementations.filters.DepositStored();
    const event = await vaultImplementations.queryFilter(filter);
    const { vaultId, propertyOwner, propertyRenter, deposit } = event[0].args;
    expect(propertyOwner).to.eq(LANDLOARD_ADDRESS);
    expect(propertyRenter).to.eq(RENTER_ADDRESS);
    expect(deposit).to.eq(requiredDeposit);
  });
  it("2-1.Once renter sends the required dposit, the vault is assied VAULT_SORTED_LIST_MANAGER to add itself into the sorted list.", async () => {
    const expectedRole = await vaultSortedList.hasRole(
      VAULT_SORTED_LIST_MANAGER,
      currentVaultAddress
    );
    expect(expectedRole).to.be.true;
  });
  it("2-2.Once renter sends the required dposit, the vault is added into a sorted list", async () => {
    const inputEndOfRentalPeriod = Math.floor(
      new Date(2022, 10, 19, 0, 0, 0).getTime() / 1000
    );
    const endOfRentalPeriod = await vaultSortedList.timeToWithdraw(
      currentVaultAddress
    );
    expect(inputEndOfRentalPeriod).to.eq(endOfRentalPeriod);
  });
  it("2-3.Once renter sends the required dposit, the deposit is deposited to aave's pool under its vault adddress", async () => {
    daiBalanceInBegning = await aaveADai.balanceOf(currentVaultAddress);
    expect(daiBalanceInBegning).to.greaterThan(0);
  });

  it("3.ukeep call a `removeDepositFromAAVE` funcition to withdraw the deposit from aave pool After the rental date", async () => {
    let latestBlock = await hre.ethers.provider.getBlock("latest");
    console.log("latestBlock", latestBlock.number);
    //40k block per day * 365 = 0xdec740
    await hre.network.provider.send("hardhat_mine", ["0xdec740"]);

    latestBlock = await hre.ethers.provider.getBlock("latest");
    console.log("latestBlock", latestBlock.number);

    vaultImplementations = await ethers.getContractAt(
      "VaultImplementation",
      currentVaultAddress
    );
    const depositBalanceBeforeAaveWithdraw = await provider.getBalance(
      currentVaultAddress
    );
    console.log(
      "depositBalanceBeforeAaveWithdraw",
      depositBalanceBeforeAaveWithdraw
    );
    // expect(depositBalanceBeforeAaveWithdraw).to.eq(0);
    const tx = await vaultImplementations.removeDepositFromAAVE();
    await tx.wait();

    latestBlock = await hre.ethers.provider.getBlock("latest");
    console.log("latestBlock", latestBlock.number);
    const aDaiBalanceOf = await aaveADai.balanceOf(currentVaultAddress);
    console.log("aDaiBalanceOf", aDaiBalanceOf);
    expect(aDaiBalanceOf).to.eq(0);
    console.log("currentVaultAddress", currentVaultAddress);
    const depositBalanceAfterAaveWithdraw = await ethers.provider.getBalance(
      currentVaultAddress
    );
    expect(depositBalanceAfterAaveWithdraw).to.greaterThan(0);
  });
  it("3-1.ukeep call a `removeDepositFromAAVE` funcition, the vault will be removed in the sorted list", async () => {
    const endOfRentalPeriod = await vaultSortedList.timeToWithdraw(
      currentVaultAddress
    );
    expect(endOfRentalPeriod).to.eq(0);
  });
});
