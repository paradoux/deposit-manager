require("dotenv").config()

const contract = require("../artifacts/contracts/VaultFactory.sol/VaultFactory.json")

var customHttpProvider = new ethers.providers.JsonRpcProvider(
  process.env.POLYGON_MUMBAI_RPC_URL
)

const main = async () => {
  // Set rentalEnd in 2 minutes
  const rentalEnd = Date.now() + 60 * 2 * 1000
  const depositAmount = ethers.utils.parseEther("1")

  // Signer
  const signer = new ethers.Wallet(
    process.env.OWNER_WALLET_PRIVATE_KEY,
    customHttpProvider
  )

  // Contract
  const factoryContract = new ethers.Contract(
    process.env.FACTORY_DEPLOYED_ADDRESS,
    contract.abi,
    signer
  )

  // Call the function.
  let txn = await factoryContract.createNewVault(
    depositAmount,
    process.env.RENTER_WALLET_ADDRESS,
    rentalEnd
  )
  // Wait for it to be mined.
  await txn.wait()
  console.log({ txn })

  const vaults = await factoryContract.getDeployedVaults()
  console.log({ vaults })
  const newlyCreatedVault = await factoryContract.deployedVaults(
    vaults.length - 1
  )
  console.log({ newlyCreatedVault })
}

const runMain = async () => {
  try {
    await main()
    process.exit(0)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

runMain()
