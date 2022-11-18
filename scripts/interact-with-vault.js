require("dotenv").config()
const VAULT_ADDRESS = "0xF4985e1318943Db7eEC787F3Ef84E99B18c42895"
const contract = require("../artifacts/contracts/VaultImplementation.sol/VaultImplementation.json")

var customHttpProvider = new ethers.providers.JsonRpcProvider(
  process.env.POLYGON_MUMBAI_RPC_URL
)

// Signer
const signer = new ethers.Wallet(
  process.env.RENTER_WALLET_PRIVATE_KEY,
  customHttpProvider
)

// Contract
const vaultContract = new ethers.Contract(VAULT_ADDRESS, contract.abi, signer)

// Interact
async function main() {
  // const message = await vaultContract.getVaultDetails()
  const amount = ethers.utils.parseEther("0.0003")
  const message = await vaultContract.storeDeposit({
    value: amount,
    gasLimit: 5000000,
  })
  console.log({ message })
}
main()
