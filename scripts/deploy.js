const hre = require("hardhat")

async function main() {
  const VaultImplementation = await hre.ethers.getContractFactory(
    "VaultImplementation"
  )
  const vaultImplementation = await VaultImplementation.deploy()

  await vaultImplementation.deployed()

  console.log(`VaultImplementation deployed to ${vaultImplementation.address}`)

  const VaultFactory = await hre.ethers.getContractFactory("VaultFactory")
  const vaultFactory = await VaultFactory.deploy(vaultImplementation.address)

  await vaultFactory.deployed()

  console.log(`VaultFactory deployed to ${vaultFactory.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
