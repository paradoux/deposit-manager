pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// Add pausable for when vault closed at the end of the flow?

contract VaultImplementation is Pausable{
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
    address public propertyRenter;
    uint256 public amountToReturn;
    bool public isDepositStored;
    bool public isAmountAccepted;
    bool public isRenterChunkReturned;
    bool public isOwnerChunkReturned;

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

    event DepositStored(uint256 vaultId, address propertyOwner, address propertyRenter, uint256 deposit);
    event AmountToReturnUpdate(uint256 vaultId, address propertyOwner, address propertyRenter, uint256 initialDeposit, uint256 previousAmount, uint256 newAmount);
    event AmountToReturnRejected(uint256 vaultId, address propertyOwner, address propertyRenter, uint256 initialDeposit, uint256 rejectedAmount);
    event AmountToReturnAccepted(uint256 vaultId, address propertyOwner, address propertyRenter, uint256 initialDeposit, uint256 acceptedAmount);
    event RenterDepositChunkReturned(uint256 vaultId, address propertyOwner, address propertyRenter, uint256 initialDeposit, uint256 renterDepositChunk);
    event OwnerDepositChunkReturned(uint256 vaultId, address propertyOwner, address propertyRenter, uint256 initialDeposit, uint256 ownerDepositChunk);
    event FailedTransfer(address receiver, uint256 amount);
    event Received(address sender, uint256 amount);

    ///
    /// MODIFIERS
    ///

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

    modifier onlyAdmin() {
        require(msg.sender == generalAdmin, "Caller is not the admin");
        _;
    }

    modifier onlyIfPropertyRenterOrNotSet() {
        require(msg.sender == propertyRenter || propertyRenter == address(0), "The caller is not the property renter");
        _;
    }

    modifier onlyIfPropertyRenter() {
        require(msg.sender == propertyRenter || propertyRenter == address(0), "The caller is not the property renter");
        _;
    }

    modifier onlyIfPropertyOwner() {
        require(msg.sender == propertyOwner, "The caller is not the property owner");
        _;
    }

    modifier onlyIfDepositStored() {
        require(isDepositStored == true, "No deposit has been stored");
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

    modifier onlyWithinDepositAmount(uint256 proposedAmount) {
        require(0 <= proposedAmount && proposedAmount <= deposit, "Incorrect proposed amount");
        _;
    }

    modifier onlyIfAmountNotAccepted() {
        require(isAmountAccepted == false, "An amount has already been accepted");
        _;
    }

    modifier onlyIfAmountAccepted() {
        require(isAmountAccepted == true, "No amount has been accepted");
        _;
    }

    modifier onlyIfAmountToReturnSet() {
        require(amountToReturn != 0 ether, "No amount to return has been proposed");
        _;
    }

    // TODO: ADD THESE MODIFIERS + TEST CASE
    modifier onlyIfOwnerChunkNotClaimed() {
        require(isOwnerChunkReturned == false, "Owner already claimed his chunk");
        _;
    }

    modifier onlyIfRenterChunkNotClaimed() {
        require(isRenterChunkReturned == false, "Renter already claimed his chunk");
        _;
    }

    ///
    /// INITIALIZATION FUNCTIONS
    ///

    constructor() {
        isBase = true;
    }
    

    function initialize(Initialization calldata initialization) external onlyIfNotBase onlyIfNotAlreadyInitialized whenNotPaused {
        generalAdmin = initialization._factoryOwner;
        factory = msg.sender;
        vaultImplementationVersion = initialization._vaultImplementationVersion;
        
        vaultId = initialization._vaultId;
        propertyOwner = initialization._propertyOwner;
        propertyRenter = initialization._propertyRenter;
        deposit = initialization._deposit;
    }


    ///
    /// BUSINESS LOGIC FUNCTIONS
    ///

    function storeDeposit() external payable onlyIfPropertyRenterOrNotSet onlyIfDepositNotStored onlyIfEqualToDeposit whenNotPaused{
        if (propertyRenter == address(0)) {
            propertyRenter = msg.sender;
        }
        isDepositStored = true;
        emit DepositStored(vaultId, propertyOwner, propertyRenter, deposit);
    }

    function setAmountToReturn(uint256 proposedAmount) external onlyIfPropertyOwner onlyIfDepositStored onlyIfAmountNotAccepted onlyWithinDepositAmount(proposedAmount) whenNotPaused{
        uint256 previousAmount = amountToReturn;
        amountToReturn = proposedAmount;

        emit AmountToReturnUpdate(vaultId, propertyOwner, propertyRenter, deposit, previousAmount, amountToReturn);
    }

    function rejectProposedAmount() external onlyIfPropertyRenter onlyIfAmountToReturnSet whenNotPaused{
        emit AmountToReturnRejected(vaultId, propertyOwner, propertyRenter, deposit, amountToReturn);
    }

    function acceptProposedAmount() external onlyIfPropertyRenter onlyIfAmountToReturnSet whenNotPaused {
        isAmountAccepted = true;
        emit AmountToReturnAccepted(vaultId, propertyOwner, propertyRenter, deposit, amountToReturn);
    }

    function claimRenterDeposit() external onlyIfPropertyRenter onlyIfDepositStored onlyIfAmountAccepted whenNotPaused{
        isRenterChunkReturned = true;
        _safeTransfer(msg.sender, amountToReturn);
        emit RenterDepositChunkReturned(vaultId, propertyOwner, propertyRenter, deposit, amountToReturn);

        if (isOwnerChunkReturned == true) {
            _pause();
        }
    }

    function claimOwnerDeposit() external onlyIfPropertyOwner onlyIfDepositStored onlyIfAmountAccepted whenNotPaused {
        isOwnerChunkReturned = true;
        uint256 ownerChunk = deposit - amountToReturn;
        _safeTransfer(msg.sender, ownerChunk);
        emit OwnerDepositChunkReturned(vaultId, propertyOwner, propertyRenter, deposit, ownerChunk);

        if (isRenterChunkReturned == true) {
            _pause();
        }
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

    function pause() public onlyAdmin whenNotPaused {
        _pause();
    }

    function unpause() public onlyAdmin whenPaused {
        _unpause();
    }

    ///
    /// FALLBACK FUNCTIONS
    ///

    // Called for empty calldata (and any value)
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    // Called when no other function matches (not even the receive function).
    fallback() external payable {
        emit Received(msg.sender, msg.value);
    }
}