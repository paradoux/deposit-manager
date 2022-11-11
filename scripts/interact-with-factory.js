require("dotenv").config()

const contract = require("../artifacts/contracts/VaultFactory.sol/VaultFactory.json")

var customHttpProvider = new ethers.providers.JsonRpcProvider(
  process.env.POLYGON_MUMBAI_RPC_URL
)

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

// Interact
async function main() {
  const message = await factoryContract.getDeployedVaults()
  console.log("The message is: " + message)
}
main()
