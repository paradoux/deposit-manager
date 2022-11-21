//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import {VaultImplementation} from "./VaultImplementation.sol";
import {IVaultSortedList} from "./interface/IVaultSortedList.sol";
import {IPoolAddressProvider} from "./interface/IPoolAddressProvider.sol";
contract VaultFactory is Pausable, Ownable  {

    ///
    /// CONSTANT VARIABLES
    ///
    bytes32 constant VAULT_SORTED_LIST_MANAGER = 0x619a10e1d10da142c7a64557af737368a04c9a5658b05c381e703cf6a7a091e9; 
    IVaultSortedList public constant VAULT_SORTED_LIST = IVaultSortedList(0x86C6389cE6B243561144cD8356c94663934d127a);
    IPoolAddressProvider public constant POOL_ADDRESS_PROVIDER = IPoolAddressProvider(0x5343b5bA672Ae99d627A1C87866b8E53F47Db2E6);

    ///
    /// VARIABLES
    ///
    uint256 public latestVaultImplementationVersionId;
    VaultImplementationVersion[] public vaultImplementations;
    uint256 public vaultId = 0;
    Vault[] public deployedVaults;


    ///
    /// STRUCTS
    ///

    struct VaultImplementationVersion {
        uint256 id;
        address deployedAddress;
    }

    struct Vault {
        uint256 id;
        uint256 versionId;
        address creator;
        address renter;
        uint256 rentalPeriodEnd;
        uint256 deposit;
        address deployedAddress;
    }

    ///
    /// MODIFIERS
    ///

    modifier onlyAdmin() {
        require(msg.sender == owner(), "Caller is not the admin");
        _;
    }

    ///
    /// EVENTS
    ///

    event VaultCreated(uint256 vaultId, address vaultAddress, uint256 vaultImplementationVersion, address generalAdmin, address factoryAddress, address propertyOwner, address propertyRenter, uint256 rentalPeriodEnd, uint256 deposit);
    event FailedTransfer(address receiver, uint256 amount);

    constructor(
        address _vaultImplementation
    ) {
        vaultImplementations.push(
            VaultImplementationVersion({id: latestVaultImplementationVersionId, deployedAddress: _vaultImplementation})
        );
    }

    function createNewVault(
        uint256 deposit,
        address renter,
        uint256 rentalPeriodEnd
    )
        external
        whenNotPaused
        returns (address vault)
    {
        address latestVaultImplementationAddress = vaultImplementations[latestVaultImplementationVersionId]
            .deployedAddress;
        address payable newVaultAddress = payable(Clones.clone(latestVaultImplementationAddress));
        
        VaultImplementation(newVaultAddress).initialize(VaultImplementation.Initialization({
            _factoryOwner: owner(),
            _vaultImplementationVersion: latestVaultImplementationVersionId,
            _vaultId: vaultId,
            _propertyOwner: msg.sender,
            _propertyRenter: renter,
            _rentalPeriodEnd: rentalPeriodEnd,
            _deposit: deposit,
            _lendingPool: POOL_ADDRESS_PROVIDER.getPool()
        }));

        deployedVaults.push(
            Vault({
                id: vaultId,
                versionId: latestVaultImplementationVersionId,
                creator: msg.sender,
                renter: renter,
                rentalPeriodEnd: rentalPeriodEnd,
                deposit: deposit,
                deployedAddress: newVaultAddress
            })
        );

        VAULT_SORTED_LIST.grantRole(VAULT_SORTED_LIST_MANAGER, newVaultAddress);
        emit VaultCreated(vaultId, newVaultAddress, latestVaultImplementationVersionId, owner(), address(this), msg.sender, renter, rentalPeriodEnd, deposit);
        vaultId += 1;
        return newVaultAddress;
    }


    ///
    ///ADMIN FUNCTIONS
    ///

    function setAdmin(address _adminAddress) external onlyAdmin {
        transferOwnership(_adminAddress);
    }

    function withdrawFunds(address receiver) external onlyAdmin {
        _safeTransfer(receiver, address(this).balance);
    }

    function setNewVaultImplementation(address _vaultImplementation) external onlyAdmin {
        latestVaultImplementationVersionId += 1;
        vaultImplementations.push(
            VaultImplementationVersion({id: latestVaultImplementationVersionId, deployedAddress: _vaultImplementation})
        );
    }

    function pause() public onlyAdmin whenNotPaused {
        _pause();
    }

    function unpause() public onlyAdmin whenPaused {
        _unpause();
    }

    ///
    ///GETTER FUNCTIONS
    ///

    function getDeployedVaults() external view returns (Vault[] memory) {
        return deployedVaults;
    }

    ///
    ///INTERNAL FUNCTIONS
    ///

    function _safeTransfer(address receiver, uint256 amount) internal {
        uint256 balance = address(this).balance;
        if (balance < amount) require(false, "Not enough in contract balance");

        (bool success, ) = receiver.call{value: amount}("");

        if (!success) {
            emit FailedTransfer(receiver, amount);
            require(false, "Transfer failed.");
        }
    }
}
