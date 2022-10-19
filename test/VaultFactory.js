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
  secondVaultImplementationContract,
  VaultFactoryContract,
  vaultFactoryContract

const depositAmount = ethers.utils.parseEther("0.1")
const oneWeekInSeconds = 604800
const rentalEnd = Math.floor(Date.now() / 1000) + oneWeekInSeconds

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

  context("VaultImplementation deployed", function () {
    describe("when an account tries to initialize the base contract", function () {
      it("should revert with the correct reason", async function () {
        VaultImplementationContract = await ethers.getContractFactory(
          "VaultImplementation"
        )
        vaultImplementationContract = await VaultImplementationContract.deploy()
        await vaultImplementationContract.deployed()

        await expectRevert(
          vaultImplementationContract.initialize({
            _factoryOwner: factoryOwner.address,
            _vaultImplementationVersion: "0",
            _vaultId: "0",
            _propertyOwner: propertyOwner.address,
            _propertyRenter: propertyRenter.address,
            _rentalPeriodEnd: rentalEnd,
            _deposit: depositAmount
          }),
          "The implementation contract can't be initialized"
        )
      })
    })

    describe("when the creator tries to initialize a vault already initialized", function () {
      it("should revert with the correct message", async function () {
        await createAndDeployContracts()
        await vaultFactoryContract
          .connect(secondAccount)
          .createNewVault(depositAmount, propertyRenter.address, rentalEnd)
        const clonedContract = await vaultFactoryContract.deployedVaults(0)
        const clonedVaultContract = await VaultImplementationContract.attach(
          clonedContract.deployedAddress
        )

        await expectRevert(
          clonedVaultContract.initialize({
            _factoryOwner: factoryOwner.address,
            _vaultImplementationVersion: "0",
            _vaultId: "0",
            _propertyOwner: propertyOwner.address,
            _propertyRenter: propertyRenter.address,
            _rentalPeriodEnd: rentalEnd,
            _deposit: depositAmount
          }),
          "Contract already initialized"
        )
      })
    })
  })

  describe("VaultFactory constructor", function () {
    describe("when VaultFactory gets deployed", function () {
      it("should set the correct values to state variables", async function () {
        await createAndDeployContracts()

        const responseLatestVaultImplementationVersionId =
          await vaultFactoryContract.latestVaultImplementationVersionId()
        const responseVaultImplementation =
          await vaultFactoryContract.vaultImplementations(
            responseLatestVaultImplementationVersionId
          )

        const responseFactoryOwner = await vaultFactoryContract.owner()

        expect(responseFactoryOwner).to.be.equal(factoryOwner.address)
        expect(responseLatestVaultImplementationVersionId).to.be.equal("0")
        expect(responseVaultImplementation.deployedAddress).to.be.equal(
          vaultImplementationContract.address
        )
      })
    })
  })

  describe("VaultFactory createNewVault", function () {
    describe("when contract is paused", function () {
      it("should revert with correct message", async function () {
        await createAndDeployContracts()
        await vaultFactoryContract.connect(factoryOwner).pause()

        await expectRevert(
          vaultFactoryContract
            .connect(secondAccount)
            .createNewVault(depositAmount, propertyRenter.address, rentalEnd),
          "Pausable: paused"
        )
      })
    })

    describe("when new vault gets created", function () {
      it("should create a new vault with the correct data", async function () {
        await createAndDeployContracts()
        await vaultFactoryContract
          .connect(propertyOwner)
          .createNewVault(depositAmount, propertyRenter.address, rentalEnd)

        const newVault = await vaultFactoryContract.deployedVaults(0)

        const clonedVaultContract = await VaultImplementationContract.attach(
          newVault.deployedAddress
        )

        const responseGeneralAdmin = await clonedVaultContract.generalAdmin()
        const responsePropertyOwner = await clonedVaultContract.propertyOwner()
        const responseFactory = await clonedVaultContract.factory()
        const responseVaultId = await clonedVaultContract.vaultId()
        const responseVaultImplementationVersion =
          await clonedVaultContract.vaultImplementationVersion()
        const responsePropertyRenter =
          await clonedVaultContract.propertyRenter()

        expect(responseGeneralAdmin).to.be.equal(factoryOwner.address)
        expect(responsePropertyOwner).to.be.equal(propertyOwner.address)
        expect(responseFactory).to.be.equal(vaultFactoryContract.address)
        expect(responseVaultId).to.be.equal("0")
        expect(responseVaultImplementationVersion).to.be.equal("0")
        expect(responseVaultId).to.be.equal("0")
        expect(responsePropertyRenter).to.be.equal(propertyRenter.address)
      })

      it("should add the new vault in deployedVaults", async function () {
        await createAndDeployContracts()
        await vaultFactoryContract
          .connect(propertyOwner)
          .createNewVault(depositAmount, propertyRenter.address, rentalEnd)
        await vaultFactoryContract
          .connect(propertyOwner)
          .createNewVault(depositAmount, propertyRenter.address, rentalEnd)

        const firstVault = await vaultFactoryContract.deployedVaults(0)
        const secondVault = await vaultFactoryContract.deployedVaults(1)

        expect(firstVault.id).to.be.equal("0")
        expect(firstVault.versionId).to.be.equal("0")
        expect(firstVault.creator).to.be.equal(propertyOwner.address)
        expect(secondVault.id).to.be.equal("1")
        expect(secondVault.versionId).to.be.equal("0")
        expect(secondVault.creator).to.be.equal(propertyOwner.address)
      })

      it("should emit the VaultCreated event with the correct data", async function () {
        await createAndDeployContracts()
        await expect(
          vaultFactoryContract
            .connect(propertyOwner)
            .createNewVault(depositAmount, propertyRenter.address, rentalEnd)
        )
          .to.emit(vaultFactoryContract, "VaultCreated")
          .withArgs(
            "0",
            anyValue,
            "0",
            factoryOwner.address,
            vaultFactoryContract.address,
            propertyOwner.address,
            propertyRenter.address,
            rentalEnd,
            depositAmount
          )
      })
    })

    describe("when new vault gets created without a renter provided", function () {
      it("should revert with the correct message", async function () {
        await createAndDeployContracts()

        await expectRevert(
          vaultFactoryContract
            .connect(propertyOwner)
            .createNewVault(
              depositAmount,
              "0x0000000000000000000000000000000000000000",
              rentalEnd
            ),
          "Renter address needed"
        )
      })
    })
  })

  describe("VaultFactory getDeployedVaults", function () {
    it("should return all the deployed vaults", async function () {
      await createAndDeployContracts()
      await vaultFactoryContract
        .connect(propertyOwner)
        .createNewVault(depositAmount, propertyRenter.address, rentalEnd)
      await vaultFactoryContract
        .connect(propertyOwner)
        .createNewVault(depositAmount, propertyRenter.address, rentalEnd)

      const deployedVaults = await vaultFactoryContract
        .connect(secondAccount)
        .getDeployedVaults()

      expect(deployedVaults.length).to.be.equal(2)
    })
  })

  describe("VaultFactory setAdmin", function () {
    describe("when called by non admin", function () {
      it("should revert with correct message", async function () {
        await createAndDeployContracts()
        await expectRevert(
          vaultFactoryContract
            .connect(thirdAccount)
            .setAdmin(thirdAccount.address),
          "Caller is not the admin"
        )
      })
    })

    describe("when called by admin", function () {
      it("should transfer the administration to given address", async function () {
        await createAndDeployContracts()
        await vaultFactoryContract
          .connect(factoryOwner)
          .setAdmin(thirdAccount.address)
        const newAdmin = await vaultFactoryContract.owner()

        expect(newAdmin).to.be.equal(thirdAccount.address)
      })
    })
  })

  describe("VaultFactory withdrawFunds", function () {
    describe("when called by non admin", function () {
      it("should revert with correct message", async function () {
        await createAndDeployContracts()
        await expectRevert(
          vaultFactoryContract
            .connect(thirdAccount)
            .withdrawFunds(thirdAccount.address),
          "Caller is not the admin"
        )
      })
    })
  })

  describe("VaultFactory setNewVaultImplementation", function () {
    describe("when called by non admin", function () {
      it("should revert with correct message", async function () {
        await createAndDeployContracts()
        await expectRevert(
          vaultFactoryContract
            .connect(thirdAccount)
            .setNewVaultImplementation(vaultImplementationContract.address),
          "Caller is not the admin"
        )
      })
    })

    describe("when called by admin", function () {
      it("should add the new implementation version to vaultImplementations", async function () {
        await createAndDeployContracts()
        secondVaultImplementationContract =
          await VaultImplementationContract.deploy()
        await secondVaultImplementationContract.deployed()

        await vaultFactoryContract
          .connect(factoryOwner)
          .setNewVaultImplementation(secondVaultImplementationContract.address)
        const responseVaultImplementations1 =
          await vaultFactoryContract.vaultImplementations("0")
        const responseVaultImplementations2 =
          await vaultFactoryContract.vaultImplementations("1")

        expect(responseVaultImplementations1.id).to.be.equal("0")
        expect(responseVaultImplementations1.deployedAddress).to.be.equal(
          vaultImplementationContract.address
        )
        expect(responseVaultImplementations2.id).to.be.equal("1")
        expect(responseVaultImplementations2.deployedAddress).to.be.equal(
          secondVaultImplementationContract.address
        )
      })
    })
  })
})

const createAndDeployContracts = async () => {
  VaultFactoryContract = await ethers.getContractFactory("VaultFactory")
  VaultImplementationContract = await ethers.getContractFactory(
    "VaultImplementation"
  )
  vaultImplementationContract = await VaultImplementationContract.deploy()
  await vaultImplementationContract.deployed()
  vaultFactoryContract = await VaultFactoryContract.connect(
    factoryOwner
  ).deploy(vaultImplementationContract.address)
  await vaultFactoryContract.deployed()
}
