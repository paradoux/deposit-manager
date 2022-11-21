//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVaultSortedList} from "./interface/IVaultSortedList.sol";
import {IDeFiRouter} from "./interface/IDeFiRouter.sol";
import {IPool} from "./interface/IPool.sol";

contract VaultImplementation is Pausable{
    using Address for address;

    ///
    /// ERROR
    ///
    error rentalPeriodDoesNotPass(uint256 _rentalPeriodEnd,uint256 _currentTime);

    ///
    /// CONSTANT VARIABLES
    ///
    bytes32 constant VAULT_SORTED_LIST_MANAGER = 0x619a10e1d10da142c7a64557af737368a04c9a5658b05c381e703cf6a7a091e9; 
    address public constant DEFI_ROUTER_ADDRESS = 0x574ebEc067d94E4FcDbCA74DF035c562b7E816A7;  
    address public constant AAVE_MUMBAI_DAI_ADDRESS = 0x9A753f0F7886C9fbF63cF59D0D4423C5eFaCE95B; 
    address public constant ADMIN_FEE_COLLECTOR = 0xECAFBCCec8fc5a50e3D896bFfDeFde0fc0b336d3; 
    IVaultSortedList public constant VAULT_SORTED_LIST = IVaultSortedList(0x86C6389cE6B243561144cD8356c94663934d127a);
    IDeFiRouter public constant DEFI_ROUTER = IDeFiRouter(DEFI_ROUTER_ADDRESS );
    IERC20  public constant AAVE_MUMBAI_DAI = IERC20(AAVE_MUMBAI_DAI_ADDRESS);
    uint256 public constant MAX_UITNT_256 = ~uint256(0); 
    
    ///
    /// VARIABLES
    ///
    
    bool private isBase;
    address public generalAdmin;
    address public factory;
    address public aaveLendingPool;
    uint256 public vaultImplementationVersion;

    uint256 public vaultId;
    uint256 public rentalPeriodEnd;
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
        uint256 _rentalPeriodEnd;
        uint256 _deposit;
        address _lendingPool;
    }

    struct VaultDetails {
        uint256 vaultId;
        address propertyOwner;
        address propertyRenter;
        uint256 rentalPeriodEnd;
        uint256 deposit;
        address deployedAddress;
        uint256  amountToReturn;
        bool isDepositStored;
        bool isAmountAccepted;
        bool isRenterChunkReturned;
        bool isOwnerChunkReturned;
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

    modifier onlyIfOwnerChunkNotClaimed() {
        require(isOwnerChunkReturned == false, "Owner already claimed his chunk");
        _;
    }

    modifier onlyIfRenterChunkNotClaimed() {
        require(isRenterChunkReturned == false, "Renter already claimed his chunk");
        _;
    }

    modifier onlyIfRentalPeriodEnded() {
        require(block.timestamp > rentalPeriodEnd, "Rental period not ended");
        _;
    }

    modifier onlyIfRenterAddress(address renterAddress) {
        require(renterAddress !=  address(0), "Renter address needed");
        _;
    }

    ///
    /// INITIALIZATION FUNCTIONS
    ///

    constructor() {
        isBase = true;
    }
    

    function initialize(Initialization calldata initialization) external onlyIfNotBase onlyIfNotAlreadyInitialized onlyIfRenterAddress(initialization._propertyRenter) whenNotPaused {
        generalAdmin = initialization._factoryOwner;
        factory = msg.sender;
        vaultImplementationVersion = initialization._vaultImplementationVersion;
        aaveLendingPool = initialization._lendingPool;
        vaultId = initialization._vaultId;
        propertyOwner = initialization._propertyOwner;
        propertyRenter = initialization._propertyRenter;
        rentalPeriodEnd = initialization._rentalPeriodEnd;
        deposit = initialization._deposit;
    }


    ///
    /// BUSINESS LOGIC FUNCTIONS
    ///

    function storeDeposit() external payable onlyIfPropertyRenterOrNotSet onlyIfDepositNotStored onlyIfEqualToDeposit whenNotPaused{
        isDepositStored = true;
        VAULT_SORTED_LIST.addEndOfDate(address(this), rentalPeriodEnd);
        DEFI_ROUTER.addDepositToAAVE{value:msg.value}();
        emit DepositStored(vaultId, propertyOwner, propertyRenter, deposit);
    }

    //Ukeeper will automatically call this function after the end of rental period.
    function removeDepositFromAAVE() external {
        if(rentalPeriodEnd > block.timestamp) {
            revert rentalPeriodDoesNotPass(rentalPeriodEnd,block.timestamp);
        }
        address currentValut = address(this);
        IPool(aaveLendingPool).withdraw(AAVE_MUMBAI_DAI_ADDRESS,MAX_UITNT_256,currentValut);
        uint256 daiBalanceOf = AAVE_MUMBAI_DAI.balanceOf(currentValut);
        AAVE_MUMBAI_DAI.approve(DEFI_ROUTER_ADDRESS, daiBalanceOf);
        uint256 maticReceived = DEFI_ROUTER.swapToMatic();
        uint256 profitsToAdmin = maticReceived > deposit ? maticReceived - deposit : 0;
        if(profitsToAdmin > 0){
            _safeTransfer(ADMIN_FEE_COLLECTOR,profitsToAdmin);
        }
        VAULT_SORTED_LIST.removeVault(currentValut);
        VAULT_SORTED_LIST.renounceRole(VAULT_SORTED_LIST_MANAGER,address(this));
    }

    function setAmountToReturn(uint256 proposedAmount) external onlyIfRentalPeriodEnded onlyIfPropertyOwner onlyIfDepositStored onlyIfAmountNotAccepted onlyWithinDepositAmount(proposedAmount) whenNotPaused{
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

    function claimRenterDeposit() external onlyIfPropertyRenter onlyIfDepositStored onlyIfAmountAccepted onlyIfRenterChunkNotClaimed whenNotPaused{
        isRenterChunkReturned = true;
        _safeTransfer(msg.sender, amountToReturn);
        emit RenterDepositChunkReturned(vaultId, propertyOwner, propertyRenter, deposit, amountToReturn);

        if (isOwnerChunkReturned == true) {
            _pause();
        }
    }

    function claimOwnerDeposit() external onlyIfPropertyOwner onlyIfDepositStored onlyIfAmountAccepted onlyIfOwnerChunkNotClaimed whenNotPaused {
        isOwnerChunkReturned = true;
        uint256 ownerChunk = deposit - amountToReturn;
        _safeTransfer(msg.sender, ownerChunk);
        emit OwnerDepositChunkReturned(vaultId, propertyOwner, propertyRenter, deposit, ownerChunk);

        if (isRenterChunkReturned == true) {
            _pause();
        }
    }

    ///
    ///GETTER FUNCTIONS
    ///

    function getVaultDetails() external view returns (VaultDetails memory)  {
        return VaultDetails({
            vaultId: vaultId,
            propertyOwner: propertyOwner,
            propertyRenter: propertyRenter,
            rentalPeriodEnd: rentalPeriodEnd,
            deposit: deposit,
            deployedAddress: address(this),
            amountToReturn: amountToReturn,
            isDepositStored: isDepositStored,
            isAmountAccepted: isAmountAccepted,
            isRenterChunkReturned: isRenterChunkReturned,
            isOwnerChunkReturned: isOwnerChunkReturned
        });
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