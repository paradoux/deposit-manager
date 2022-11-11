require("dotenv").config()
// const VAULT_ADDRESS = "0x3E4B97Ab5b52A918c106d77e1f408237b9459CaF"
const VAULT_ADDRESS = "0x3E4B97Ab5b52A918c106d77e1f408237b9459CaF"
const contract = require("../artifacts/contracts/VaultImplementation.sol/VaultImplementation.json")

var customHttpProvider = new ethers.providers.JsonRpcProvider(
  process.env.POLYGON_MUMBAI_RPC_URL
)

// Signer
const signer = new ethers.Wallet(
  process.env.OWNER_WALLET_PRIVATE_KEY,
  customHttpProvider
)

// Contract
const vaultContract = new ethers.Contract(VAULT_ADDRESS, contract.abi, signer)

// Interact
async function main() {
  const message = await vaultContract.propertyOwner()
  console.log("The message is: " + message)
}
main()
