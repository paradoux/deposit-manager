const { ethers } = require("hardhat")
const { expect } = require("chai")

let factoryOwner,
  secondAccount,
  thirdAccount,
  propertyOwner,
  propertyRenter,
  rentalEnd,
  VaultImplementationContract,
  vaultImplementationContract,
  VaultFactoryContract,
  vaultFactoryContract,
  deployedVault

const depositAmount = ethers.utils.parseEther("0.1")
const depositChunkReturnedToRenter = ethers.utils.parseEther("0.05")
const aboveDepositAmount = ethers.utils.parseEther("0.2")
const incorrectDepositAmount = ethers.utils.parseEther("0.01")
const oneWeekInSeconds = 604800

context("VaultFactoryContract", function () {
  beforeEach(async function () {
    ;[
      factoryOwner,
      secondAccount,
      thirdAccount,
      propertyRenter,
      propertyOwner
    ] = await ethers.getSigners()
    const startedBlock = await ethers.provider.getBlock()
    const startedBlockTimestamp = startedBlock.timestamp
    rentalEnd = startedBlockTimestamp + oneWeekInSeconds
  })
  context("Contract Initialization", function () {
    describe("when factoryOwner has deployed the Factory Contract", async function () {
      it("should be set as the generalAdmin of the created vault", async function () {
        await createAndDeployContracts(factoryOwner)
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address,
          rentalEnd
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
          propertyRenter.address,
          rentalEnd
        )
        const responsePropertyOwner = await deployedVault.propertyOwner()
        expect(responsePropertyOwner).to.equal(propertyOwner.address)
      })

      it("should set the other vault variables to the correct values", async function () {
        await createAndDeployContracts(factoryOwner)
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address,
          rentalEnd
        )
        const responseVaultId = await deployedVault.vaultId()
        const responsePropertyRenter = await deployedVault.propertyRenter()
        const responseDeposit = await deployedVault.deposit()

        const responseAmountToReturn = await deployedVault.amountToReturn()
        const responseIsDepositStored = await deployedVault.isDepositStored()
        const responseIsRenterChunkReturned =
          await deployedVault.isRenterChunkReturned()
        const responseIsOwnerChunkReturned =
          await deployedVault.isOwnerChunkReturned()

        const responseIsAmountAccepted = await deployedVault.isAmountAccepted()

        expect(responseVaultId).to.equal("0")
        expect(responsePropertyRenter).to.equal(propertyRenter.address)
        expect(responseDeposit).to.equal(depositAmount)

        expect(responseAmountToReturn).to.equal("0")

        expect(responseIsDepositStored).to.be.false
        expect(responseIsRenterChunkReturned).to.be.false
        expect(responseIsOwnerChunkReturned).to.be.false
        expect(responseIsAmountAccepted).to.be.false
      })
    })
  })

  context("Deposit storing", function () {
    beforeEach(async function () {
      await createAndDeployContracts(factoryOwner)
    })

    describe("when sender is not the property renter", function () {
      it("should revert with the correct message", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address,
          rentalEnd
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
          propertyRenter.address,
          rentalEnd
        )

        await expect(
          deployedVault
            .connect(propertyRenter)
            .storeDeposit({ value: incorrectDepositAmount })
        ).to.be.revertedWith("Incorrect amount sent")
      })
    })

    describe("when deposit has already been stored", function () {
      it("should revert with the correct message", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address,
          rentalEnd
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
      it("should set the msg sender as the property renter", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address,
          rentalEnd
        )

        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        const responsePropertyRenter = await deployedVault.propertyRenter()

        expect(responsePropertyRenter).to.equal(propertyRenter.address)
      })
    })

    describe("when there was a specified property renter", function () {
      it("should not change the property renter", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address,
          rentalEnd
        )

        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        const responsePropertyRenter = await deployedVault.propertyRenter()

        expect(responsePropertyRenter).to.equal(propertyRenter.address)
      })
    })

    describe("when the deposit is stored in the vault smart contract", function () {
      it("should increase the smart contract balance by the correct amount", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address,
          rentalEnd
        )
        const initialContractBalance = await ethers.provider.getBalance(
          deployedVault.address
        )

        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        const updatedContractBalance = await ethers.provider.getBalance(
          deployedVault.address
        )

        expect(updatedContractBalance).to.equal(
          initialContractBalance.add(depositAmount)
        )
      })

      it("should set isDepositStored to true", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address,
          rentalEnd
        )

        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        const responseIsDepositStored = await deployedVault.isDepositStored()

        expect(responseIsDepositStored).to.equal(true)
      })

      it("should emit the DepositStored event", async function () {
        await initializeVault(
          propertyOwner,
          depositAmount,
          propertyRenter.address,
          rentalEnd
        )

        await expect(
          deployedVault
            .connect(propertyRenter)
            .storeDeposit({ value: depositAmount })
        )
          .to.emit(deployedVault, "DepositStored")
          .withArgs(
            "0",
            propertyOwner.address,
            propertyRenter.address,
            depositAmount
          )
      })
    })
  })

  context("Amount to return setting", function () {
    beforeEach(async function () {
      await createAndDeployContracts(factoryOwner)
      await initializeVault(
        propertyOwner,
        depositAmount,
        propertyRenter.address,
        rentalEnd
      )
    })

    describe("when the caller is not the property owner", function () {
      it("should revert with the correct message", async function () {
        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])
        await expect(
          deployedVault.connect(thirdAccount).setAmountToReturn(depositAmount)
        ).to.be.revertedWith("The caller is not the property owner")
      })
    })

    describe("when no deposit has been stored", function () {
      it("should revert with the correct message", async function () {
        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])
        await expect(
          deployedVault.connect(propertyOwner).setAmountToReturn(depositAmount)
        ).to.be.revertedWith("No deposit has been stored")
      })
    })

    describe("when the proposed amount is bigger than the original deposit", function () {
      it("should revert with the correct message", async function () {
        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])

        await expect(
          deployedVault
            .connect(propertyOwner)
            .setAmountToReturn(aboveDepositAmount)
        ).to.be.revertedWith("Incorrect proposed amount")
      })
    })

    describe("when a proposed amount has already been accepted by the renter", function () {
      it("should revert with the correct message", async function () {
        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])

        await deployedVault
          .connect(propertyOwner)
          .setAmountToReturn(depositChunkReturnedToRenter)

        await deployedVault.connect(propertyRenter).acceptProposedAmount()

        await expect(
          deployedVault.connect(propertyOwner).setAmountToReturn(depositAmount)
        ).to.be.revertedWith("An amount has already been accepted")
      })
    })

    describe("when the rental period has not ended", function () {
      it("should revert with the correct message", async function () {
        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd - 1])
        await expect(
          deployedVault.connect(propertyOwner).setAmountToReturn(depositAmount)
        ).to.be.revertedWith("Rental period not ended")
      })
    })

    describe("when a proposed amount is set", function () {
      it("should update the amountToReturn with the proposedAmount", async function () {
        const responseInitialAmountToReturn =
          await deployedVault.amountToReturn()

        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])

        await deployedVault
          .connect(propertyOwner)
          .setAmountToReturn(depositChunkReturnedToRenter)
        const responseAmountToReturn = await deployedVault.amountToReturn()

        expect(responseInitialAmountToReturn).to.equal("0")
        expect(responseAmountToReturn).to.equal(depositChunkReturnedToRenter)
      })

      it("should emit the AmountToReturnUpdate event", async function () {
        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])

        const responseInitialAmountToReturn =
          await deployedVault.amountToReturn()
        await expect(
          deployedVault
            .connect(propertyOwner)
            .setAmountToReturn(depositChunkReturnedToRenter)
        )
          .to.emit(deployedVault, "AmountToReturnUpdate")
          .withArgs(
            "0",
            propertyOwner.address,
            propertyRenter.address,
            depositAmount,
            responseInitialAmountToReturn,
            depositChunkReturnedToRenter
          )
      })
    })
  })

  context("Amount to return rejection", function () {
    beforeEach(async function () {
      await createAndDeployContracts(factoryOwner)
      await initializeVault(
        propertyOwner,
        depositAmount,
        propertyRenter.address,
        rentalEnd
      )
      await deployedVault
        .connect(propertyRenter)
        .storeDeposit({ value: depositAmount })
      await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])
    })

    describe("when the caller is not the propertyRenter", function () {
      it("should revert with the correct message", async function () {
        await expect(
          deployedVault.connect(thirdAccount).rejectProposedAmount()
        ).to.be.revertedWith("The caller is not the property renter")
      })
    })

    describe("when no amount to return has been set", function () {
      it("should revert with the correct message", async function () {
        await expect(
          deployedVault.connect(propertyRenter).acceptProposedAmount()
        ).to.be.revertedWith("No amount to return has been proposed")
      })
    })

    describe("when a proposed amount is rejected", function () {
      it("should emit the AmountToReturnRejected event", async function () {
        await deployedVault
          .connect(propertyOwner)
          .setAmountToReturn(depositChunkReturnedToRenter)

        await expect(
          deployedVault.connect(propertyRenter).rejectProposedAmount()
        )
          .to.emit(deployedVault, "AmountToReturnRejected")
          .withArgs(
            "0",
            propertyOwner.address,
            propertyRenter.address,
            depositAmount,
            depositChunkReturnedToRenter
          )
      })
    })
  })

  context("Amount to return acception", function () {
    beforeEach(async function () {
      await createAndDeployContracts(factoryOwner)
      await initializeVault(
        propertyOwner,
        depositAmount,
        propertyRenter.address,
        rentalEnd
      )
      await deployedVault
        .connect(propertyRenter)
        .storeDeposit({ value: depositAmount })
      await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])
    })

    describe("when the caller is not the propertyRenter", function () {
      it("should revert with the correct message", async function () {
        await expect(
          deployedVault.connect(thirdAccount).acceptProposedAmount()
        ).to.be.revertedWith("The caller is not the property renter")
      })
    })

    describe("when no amount to return has been set", function () {
      it("should revert with the correct message", async function () {
        await expect(
          deployedVault.connect(propertyRenter).acceptProposedAmount()
        ).to.be.revertedWith("No amount to return has been proposed")
      })
    })

    describe("when a proposed amount is accepted", function () {
      it("should set isAmountAccepted to true", async function () {
        await deployedVault
          .connect(propertyOwner)
          .setAmountToReturn(depositChunkReturnedToRenter)

        await deployedVault.connect(propertyRenter).acceptProposedAmount()

        const responseIsAmountAccepted = await deployedVault.isAmountAccepted()

        expect(responseIsAmountAccepted).to.be.true
      })

      it("should emit the AmountToReturnAccepted event", async function () {
        await deployedVault
          .connect(propertyOwner)
          .setAmountToReturn(depositChunkReturnedToRenter)

        await expect(
          deployedVault.connect(propertyRenter).acceptProposedAmount()
        )
          .to.emit(deployedVault, "AmountToReturnAccepted")
          .withArgs(
            "0",
            propertyOwner.address,
            propertyRenter.address,
            depositAmount,
            depositChunkReturnedToRenter
          )
      })
    })
  })

  context("Renter deposit chunk withdrawal", function () {
    beforeEach(async function () {
      await createAndDeployContracts(factoryOwner)
      await initializeVault(
        propertyOwner,
        depositAmount,
        propertyRenter.address,
        rentalEnd
      )
    })

    describe("when the caller is not the property renter", function () {
      it("should revert with the correct message", async function () {
        await expect(
          deployedVault.connect(propertyOwner).claimRenterDeposit()
        ).to.be.revertedWith("The caller is not the property renter")
      })
    })

    describe("when the deposit has not been stored yet", function () {
      it("should revert with the correct message", async function () {
        await expect(
          deployedVault.connect(propertyRenter).claimRenterDeposit()
        ).to.be.revertedWith("No deposit has been stored")
      })
    })

    describe("when the proposed amount to return has not been accepted", function () {
      it("should revert with the correct message", async function () {
        deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        await expect(
          deployedVault.connect(propertyRenter).claimRenterDeposit()
        ).to.be.revertedWith("No amount has been accepted")
      })
    })

    describe("when the renter withdraws its deposit chunk", function () {
      beforeEach(async function () {
        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })
        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])

        await deployedVault
          .connect(propertyOwner)
          .setAmountToReturn(depositChunkReturnedToRenter)
        await deployedVault.connect(propertyRenter).acceptProposedAmount()
      })

      it("should reduce the contract's balance by the correct amount", async function () {
        const initialContractBalance = await ethers.provider.getBalance(
          deployedVault.address
        )

        await deployedVault.connect(propertyRenter).claimRenterDeposit()

        const updatedContractBalance = await ethers.provider.getBalance(
          deployedVault.address
        )

        expect(updatedContractBalance).to.be.equal(
          initialContractBalance.sub(depositChunkReturnedToRenter)
        )
      })

      it("should increase the renter's balance by the correct amount", async function () {
        const initialRenterBalance = await ethers.provider.getBalance(
          propertyRenter.address
        )
        const tx = await deployedVault
          .connect(propertyRenter)
          .claimRenterDeposit()

        const receipt = await tx.wait()
        const gasPrice = tx.gasPrice
        const gasUsed = receipt.gasUsed

        const updatedRenterBalance = await ethers.provider.getBalance(
          propertyRenter.address
        )

        expect(updatedRenterBalance).to.be.equal(
          initialRenterBalance
            .add(depositChunkReturnedToRenter)
            .sub(gasPrice.mul(gasUsed))
        )
      })

      it("should set isRenterChunkReturned to true", async function () {
        await deployedVault.connect(propertyRenter).claimRenterDeposit()

        const responseIsRenterChunkReturned =
          await deployedVault.isRenterChunkReturned()

        expect(responseIsRenterChunkReturned).to.be.true
      })

      it("should emit the RenterDepositChunkReturned", async function () {
        await expect(deployedVault.connect(propertyRenter).claimRenterDeposit())
          .to.emit(deployedVault, "RenterDepositChunkReturned")
          .withArgs(
            "0",
            propertyOwner.address,
            propertyRenter.address,
            depositAmount,
            depositChunkReturnedToRenter
          )
      })
    })
  })

  context("Owner deposit chunk withdrawal", function () {
    beforeEach(async function () {
      await createAndDeployContracts(factoryOwner)
      await initializeVault(
        propertyOwner,
        depositAmount,
        propertyRenter.address,
        rentalEnd
      )
    })

    describe("when the caller is not the property owner", function () {
      it("should revert with the correct message", async function () {
        await expect(
          deployedVault.connect(propertyRenter).claimOwnerDeposit()
        ).to.be.revertedWith("The caller is not the property owner")
      })
    })

    describe("when the deposit has not been stored yet", function () {
      it("should revert with the correct message", async function () {
        await expect(
          deployedVault.connect(propertyOwner).claimOwnerDeposit()
        ).to.be.revertedWith("No deposit has been stored")
      })
    })

    describe("when the proposed amount to return has not been accepted", function () {
      it("should revert with the correct message", async function () {
        deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })
        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])

        await expect(
          deployedVault.connect(propertyOwner).claimOwnerDeposit()
        ).to.be.revertedWith("No amount has been accepted")
      })
    })

    describe("when the owner withdraws its deposit chunk", function () {
      beforeEach(async function () {
        await deployedVault
          .connect(propertyRenter)
          .storeDeposit({ value: depositAmount })

        await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])

        await deployedVault
          .connect(propertyOwner)
          .setAmountToReturn(depositChunkReturnedToRenter)
        await deployedVault.connect(propertyRenter).acceptProposedAmount()
      })

      it("should reduce the contract's balance by the correct amount", async function () {
        const expectedOwnerChunk = depositAmount.sub(
          depositChunkReturnedToRenter
        )

        const initialContractBalance = await ethers.provider.getBalance(
          deployedVault.address
        )

        await deployedVault.connect(propertyOwner).claimOwnerDeposit()

        const updatedContractBalance = await ethers.provider.getBalance(
          deployedVault.address
        )

        expect(updatedContractBalance).to.be.equal(
          initialContractBalance.sub(expectedOwnerChunk)
        )
      })

      it("should increase the owner's balance by the correct amount", async function () {
        const expectedOwnerChunk = depositAmount.sub(
          depositChunkReturnedToRenter
        )

        const initialOwnerBalance = await ethers.provider.getBalance(
          propertyOwner.address
        )
        const tx = await deployedVault
          .connect(propertyOwner)
          .claimOwnerDeposit()

        const receipt = await tx.wait()
        const gasPrice = tx.gasPrice
        const gasUsed = receipt.gasUsed

        const updatedOwnerBalance = await ethers.provider.getBalance(
          propertyOwner.address
        )

        expect(updatedOwnerBalance).to.be.equal(
          initialOwnerBalance.add(expectedOwnerChunk).sub(gasPrice.mul(gasUsed))
        )
      })

      it("should set isOwnerChunkReturned to true", async function () {
        await deployedVault.connect(propertyOwner).claimOwnerDeposit()

        const responseIsOwnerChunkReturned =
          await deployedVault.isOwnerChunkReturned()

        expect(responseIsOwnerChunkReturned).to.be.true
      })

      it("should emit the OwnerDepositChunkReturned", async function () {
        const expectedOwnerChunk = depositAmount.sub(
          depositChunkReturnedToRenter
        )
        await expect(deployedVault.connect(propertyOwner).claimOwnerDeposit())
          .to.emit(deployedVault, "OwnerDepositChunkReturned")
          .withArgs(
            "0",
            propertyOwner.address,
            propertyRenter.address,
            depositAmount,
            expectedOwnerChunk
          )
      })
    })
  })

  context("Vault termination", function () {
    beforeEach(async function () {
      await createAndDeployContracts(factoryOwner)
      await initializeVault(
        propertyOwner,
        depositAmount,
        propertyRenter.address,
        rentalEnd
      )
      await deployedVault
        .connect(propertyRenter)
        .storeDeposit({ value: depositAmount })
      await ethers.provider.send("evm_setNextBlockTimestamp", [rentalEnd + 1])

      await deployedVault
        .connect(propertyOwner)
        .setAmountToReturn(depositChunkReturnedToRenter)
      await deployedVault.connect(propertyRenter).acceptProposedAmount()
    })

    describe("when both renter and owner claimed their chunk", function () {
      it("should pause the vault", async function () {
        await deployedVault.connect(propertyOwner).claimOwnerDeposit()
        await deployedVault.connect(propertyRenter).claimRenterDeposit()

        const responseIsPaused = await deployedVault.paused()
        expect(responseIsPaused).to.be.true
      })
    })

    describe("when only the renter claimed his chunk", function () {
      it("should not pause the vault", async function () {
        await deployedVault.connect(propertyRenter).claimRenterDeposit()

        const responseIsPaused = await deployedVault.paused()
        expect(responseIsPaused).to.be.false
      })
    })

    describe("when only the owner claimed his chunk", function () {
      it("should not pause the vault", async function () {
        await deployedVault.connect(propertyOwner).claimOwnerDeposit()

        const responseIsPaused = await deployedVault.paused()
        expect(responseIsPaused).to.be.false
      })
    })
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
    .createNewVault(depositAmount, renter, rentalEnd)
  const clonedContract = await vaultFactoryContract.deployedVaults("0")
  deployedVault = await VaultImplementationContract.attach(
    clonedContract.deployedAddress
  )
}
