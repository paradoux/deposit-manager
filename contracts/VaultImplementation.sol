pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";

contract VaultImplementation {
    using Address for address;

    bool private isBase;
    address public generalAdmin;
    address public factory;
    uint256 public vaultImplementationVersion;

    uint256 public vaultId;
    uint256 public deposit;
    address public propertyOwner;
    // string public landlordName;
    // string public propertyAddress;
    address public propertyRenter;
    uint256 public proposedAmountToReturn;
    uint256 public amountToReturn;
    bool public isDepositStored;
    bool public isDepositReturned;
    bool public isAmountAgreed;
    address public designatedAdjudicator;
    bool public isAdjudicatorAccepted;
    bool public disputeResolved;
    // Add option for specific render wallet address


    struct Initialization {
        address _factoryOwner;
        uint256 _vaultImplementationVersion;
        uint256 _vaultId;
        address _propertyOwner;
        address _propertyRenter;
        uint256 _deposit;
    }

    // This makes sure we can't initialize the implementation contract.
    modifier onlyIfNotBase() {
        require(isBase == false, "The implementation contract can't be initialized");
        _;
    }

    // This makes sure we can't initialize a cloned contract twice.
    modifier onlyIfNotAlreadyInitialized() {
        require(propertyOwner == address(0), "Contract already initialized");
        _;
    }

    constructor() {
        isBase = true;
    }

    function initialize(Initialization calldata initialization) external onlyIfNotBase onlyIfNotAlreadyInitialized {
        generalAdmin = initialization._factoryOwner;
        factory = msg.sender;
        vaultImplementationVersion = initialization._vaultImplementationVersion;
        
        vaultId = initialization._vaultId;
        propertyOwner = initialization._propertyOwner;
        if (initialization._propertyRenter != address(0)) {
            propertyRenter = initialization._propertyRenter;
        }
    }
}