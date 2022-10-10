const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs")
const { ethers } = require("hardhat")
const { expectRevert } = require("@openzeppelin/test-helpers")
const { expect } = require("chai")

let factoryOwner,
  secondAccount,
  thirdAccount,
  propertyOwner,
  propertyRenter,
  VaultImplementationContract,
  vaultImplementationContract,
  VaultFactoryContract,
  vaultFactoryContract,
  deployedVault

const depositAmount = ethers.utils.parseEther("0.1")
const incorrectDepositAmount = ethers.utils.parseEther("0.01")

context("VaultFactoryContract", function () {
  beforeEach(async function () {
    ;[
      factoryOwner,
      secondAccount,
      thirdAccount,
      propertyRenter,
      propertyOwner
    ] = await ethers.getSigners()
  })
  context("Contract Initialisation", function () {
    describe("when factoryOwner has deployed the Factory Contract", async function () {
      it("should be set as the generalAdmin of the created vault", async function () {
        await createAndDeployContracts(factoryOwner)
        await initializeVault(
          propertyOwner,
          depositAmount,
          "0x0000000000000000000000000000000000000000"
        )
        const responseGeneralAdmin = await deployedVault.generalAdmin()
        expect(responseGeneralAdmin).to.equal(factoryOwner.address)
      })
    })

    describe("when propertyOwner creates the vault", async function () {
      it("should be set as the propertyOwner of the vault", async function () {
        await createAndDeployContracts(factoryOwner)
        await initializeVault(
          propertyOwner,
          depositAmount,
          "0x0000000000000000000000000000000000000000"
        )
        const responsePropertyOwner = await deployedVault.propertyOwner()
        expect(responsePropertyOwner).to.equal(propertyOwner.address)
      })

      //   it("should set the other vault variables to the correct values", async function () {
      //     await createAndDeployContracts(factoryOwner)
      //     await initializeVault(propertyOwner, depositAmount, propertyRenter)
      //     const responseVaultId = await deployedVault.vaultId()
      //     const responsePropertyRenter = await deployedVault.propertyRenter()
      //     expect(responsePropertyRenter).to.equal(propertyOwner.address)
      //     // it should set the property renter
      //     // it should set the deposit amount
      //     // Should be default value:
      //     // proposedAmountToReturn
      //     // amountToReturn
      //     // isDepositStored
      //     // isDepositReturned
      //     // isAmountAgreed
      //     // designatedAdjudicator
      //     // isAdjudicatorAccepted
      //     // disputeResolved
      //   })
    })
  })

  context.only("Deposit storing", function () {
    beforeEach(async function () {
      await createAndDeployContracts(factoryOwner)
    })

    describe("when sender is not the property renter", function () {
      it("should revert with the correct message", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address
        )

        await expect(
          deployedVault
            .connect(secondAccount)
            .storeDeposit({ value: depositAmount })
        ).to.be.revertedWith("The caller is not the property renter")
      })
    })
    describe("when msg value is not equal to deposit", function () {
      it("should revert with the correct message", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address
        )

        await expect(
          deployedVault
            .connect(propertyRenter)
            .storeDeposit({ value: incorrectDepositAmount })
        ).to.be.revertedWith("Incorrect amount sent")
      })
    })
    describe.only("when deposit has already been stored", function () {
      it("should revert with the correct message", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address
        )

        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        await expect(
          deployedVault
            .connect(propertyRenter)
            .storeDeposit({ value: depositAmount })
        ).to.be.revertedWith("The deposit is already stored")
      })
    })

    describe("when there was no specified property renter", function () {
      it("should allow the msg value to be stored as deposit", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          "0x0000000000000000000000000000000000000000"
        )

        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })
      })
      it("should set the msg sender as the property renter", async function () {})
    })

    describe("when there was a specified property renter", function () {
      it("should not change the property renter", async function () {})
    })

    // It should increase contract balance
    // it should set the isDepositStored to true
  })
})

const createAndDeployContracts = async (generalAdmin) => {
  VaultFactoryContract = await ethers.getContractFactory("VaultFactory")
  VaultImplementationContract = await ethers.getContractFactory(
    "VaultImplementation"
  )
  vaultImplementationContract = await VaultImplementationContract.deploy()
  await vaultImplementationContract.deployed()
  vaultFactoryContract = await VaultFactoryContract.connect(
    generalAdmin
  ).deploy(vaultImplementationContract.address)
  await vaultFactoryContract.deployed()
}

const initializeVault = async (owner, depositAmount, renter) => {
  await vaultFactoryContract
    .connect(owner)
    .createNewVault(depositAmount, renter)
  const clonedContract = await vaultFactoryContract.deployedVaults("0")
  deployedVault = await VaultImplementationContract.attach(
    clonedContract.deployedAddress
  )
}
