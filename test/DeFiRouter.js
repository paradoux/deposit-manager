const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
describe("DeFiRouter", () => {
  const POOL_ADDRESS_PROVIDER = "0x5343b5ba672ae99d627a1c87866b8e53f47db2e6";
  const AAVE_DAI = "0x9a753f0f7886c9fbf63cf59d0d4423c5eface95b";
  const AAVE_ADAI = "0xdd4f3ee61466c4158d394d57f3d4c397e91fbc51";
  let owner, defiRouter, lendingPool, aaveDai, aaveADai;
  const provider = ethers.getDefaultProvider();
  before(async () => {
    // [owner] = await ethers.getSigners();

    const address = "0x2ED8c989E2f995387cf4f2c560F25Dd15c0EFEE5";
    await helpers.impersonateAccount(address);
    owner = await ethers.getSigner(address);
    const PoolAddressProvider = await ethers.getContractAt(
      "IPoolAddressProvider",
      POOL_ADDRESS_PROVIDER
    );

    const CURRENT_POOL_ADDRESS = await PoolAddressProvider.getPool();

    lendingPool = await ethers.getContractAt("IPool", CURRENT_POOL_ADDRESS);

    aaveDai = await ethers.getContractAt("IERC20", AAVE_DAI);
    aaveADai = await ethers.getContractAt("IERC20", AAVE_ADAI);
    const DeFiRouter = await ethers.getContractFactory("DeFiRouter");
    defiRouter = await DeFiRouter.deploy();
    await defiRouter.deployed();

    // defiRouter = await ethers.getContractAt(
    //   "DeFiRouter",
    //   "0x0e2111EfBf553E3c1dAe4bb818c1d8Ef42eDeC86"
    // );
  });

  it("add deposit to AAVE ", async () => {
    const deposit = ethers.utils.parseEther("0.01");
    const tx = await defiRouter
      .connect(owner)
      .addDepositToAAVE({ value: deposit });
    await tx.wait();
    const aaDaiBalance = await aaveADai.balanceOf(owner.address);
    console.log(aaDaiBalance);
  });

  it.only("remove deposit from AAVE ", async () => {
    const vaultAddress = owner.address;

    const txTokenOut = await lendingPool
      .connect(owner)
      .withdraw(AAVE_DAI, ethers.constants.MaxUint256, vaultAddress);

    await txTokenOut.wait();
    const AaveDaiBalance = await aaveDai.connect(owner).balanceOf(vaultAddress);

    const txApprove = await aaveDai
      .connect(owner)
      .approve(defiRouter.address, AaveDaiBalance);
    await txApprove.wait();

    let allowance = await aaveDai
      .connect(owner)
      .allowance(owner.address, defiRouter.address);
    console.log(allowance);
    console.log("________");

    const tx = await defiRouter.connect(owner).swapToMatic();
    await tx.wait();

    const balance = await ethers.provider.getBalance(vaultAddress);
    console.log("balance", balance);
  });
});
