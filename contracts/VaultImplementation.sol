pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";

// Add pausable for when vault closed at the end of the flow?

contract VaultImplementation {
    using Address for address;

    ///
    /// VARIABLES
    ///

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

    ///
    /// STRUCTS
    ///

    struct Initialization {
        address _factoryOwner;
        uint256 _vaultImplementationVersion;
        uint256 _vaultId;
        address _propertyOwner;
        address _propertyRenter;
        uint256 _deposit;
    }

    ///
    /// EVENTS
    ///

    event Received(address sender, uint256 amount);

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

    modifier onlyIfPropertyRenter() {
        require(msg.sender == propertyRenter || propertyRenter == address(0), "The caller is not the property renter");
        _;
    }

    modifier onlyIfDepositNotStored() {
        require(isDepositStored == false, "The deposit is already stored");
        _;
    }

    modifier onlyIfEqualToDeposit() {
        require(msg.value == deposit, "Incorrect amount sent");
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
        propertyRenter = initialization._propertyRenter;
        deposit = initialization._deposit;
    }

    function storeDeposit() external payable onlyIfPropertyRenter onlyIfDepositNotStored onlyIfEqualToDeposit{
        if (propertyRenter == address(0)) {
            propertyRenter = msg.sender;
        }
        isDepositStored = true;
    }



    ///
    /// FALLBACK FUNCTIONS
    ///

    // Called for empty calldata (and any value)
    receive() external payable {
        // TODO is current contract is Model, send to _factroy
        emit Received(msg.sender, msg.value);
    }

    // Called when no other function matches (not even the receive function). Optionally payablee
    fallback() external payable {
        // TODO is current contract is Model, send to _factroy
        emit Received(msg.sender, msg.value);
    }

}