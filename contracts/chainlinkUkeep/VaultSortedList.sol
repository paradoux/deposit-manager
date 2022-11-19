//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
contract VaultSortedList is AccessControl {
  
  //ERROR
  error OnlyRegisterAddressOnce();
  error OnlyRegisteredAddress();
  error OnlyRemoveMySelf();

  //modifier 
  modifier onlyRegisteredAddress(address _vaultAddress) {
    if(_secondEarliestEndOfDate[_vaultAddress] == address(0)){
      revert OnlyRegisteredAddress();
    }
    _;
  }

  //VARIABLES
  bytes32 constant VAULT_SORTED_LIST_MANAGER = 0x619a10e1d10da142c7a64557af737368a04c9a5658b05c381e703cf6a7a091e9; 
  address constant GUARD = address(1);
  uint256 public listSize;
  mapping(address => uint256) public timeToWithdraw;
  mapping(address => address) _secondEarliestEndOfDate;


  constructor()  {
    _secondEarliestEndOfDate[GUARD] = GUARD;
    _setupRole(DEFAULT_ADMIN_ROLE,msg.sender);
    _setupRole(VAULT_SORTED_LIST_MANAGER,msg.sender);
  }

  function addEndOfDate(address _vaultAddress, uint256 _epochTime) public onlyRole(VAULT_SORTED_LIST_MANAGER)  {
    if(_secondEarliestEndOfDate[_vaultAddress] != address(0)){
      revert OnlyRegisterAddressOnce();
    }
    address index = _findIndex(_epochTime);
    timeToWithdraw[_vaultAddress] = _epochTime;
    _secondEarliestEndOfDate[_vaultAddress] = _secondEarliestEndOfDate[index];
    _secondEarliestEndOfDate[index] = _vaultAddress;
    listSize++;
  }

  function increaseEndOfDate(address _vaultAddress, uint256 _epochTime) external onlyRole(VAULT_SORTED_LIST_MANAGER) {
    updateEndOfDate(_vaultAddress, timeToWithdraw[_vaultAddress] + _epochTime);
  }

  function decreaseEndOfDate(address _vaultAddress, uint256 _epochTime) external onlyRole(VAULT_SORTED_LIST_MANAGER) {
    updateEndOfDate(_vaultAddress, timeToWithdraw[_vaultAddress] - _epochTime);
  }

  function updateEndOfDate(address _vaultAddress, uint256 _epochTime) public onlyRole(VAULT_SORTED_LIST_MANAGER) onlyRegisteredAddress(_vaultAddress){ 
    address preOrderVaultAddress = _getPrevOrderVaultAddress(_vaultAddress);
    address nextOrderVaultAddress = _secondEarliestEndOfDate[_vaultAddress];
    if(_verifyIndex(preOrderVaultAddress, _epochTime, nextOrderVaultAddress)){
      timeToWithdraw[_vaultAddress] = _epochTime;
    } else {
      removeVault(_vaultAddress);
      addEndOfDate(_vaultAddress, _epochTime);
    }
  }

  function removeVault(address _vaultAddress) public onlyRole(VAULT_SORTED_LIST_MANAGER) onlyRegisteredAddress(_vaultAddress) {
    if(msg.sender != _vaultAddress) {
      revert OnlyRemoveMySelf();
    }
    address preOrderVault = _getPrevOrderVaultAddress(_vaultAddress);
    _secondEarliestEndOfDate[preOrderVault] = _secondEarliestEndOfDate[_vaultAddress];
    _secondEarliestEndOfDate[_vaultAddress] = address(0);
    timeToWithdraw[_vaultAddress] = 0;
    listSize--;
  }

  function getList(uint256 _size) external view returns(address[] memory) {
    require(_size <= listSize);
    address[] memory vaultList = new address[](_size);
    address currentAddress = _secondEarliestEndOfDate[GUARD];
    for(uint256 i = 0; i < _size; ++i) {
      vaultList[i] = currentAddress;
      currentAddress = _secondEarliestEndOfDate[currentAddress];
    }
    return vaultList;
  }

  function getEarlistEndOfDate() external view returns(uint,address) {
     return (timeToWithdraw[_secondEarliestEndOfDate[GUARD]],_secondEarliestEndOfDate[GUARD]);
  }

  function _verifyIndex(address prevStudent, uint256 newValue, address nextStudent)
    internal
    view
    returns(bool)
  {
    return (prevStudent == GUARD || timeToWithdraw[prevStudent] <= newValue) && 
           (nextStudent == GUARD || newValue < timeToWithdraw[nextStudent]);
  }

  function _findIndex(uint256 newValue) internal view returns(address) {
    address candidateAddress = GUARD;
    while(true) {
      if(_verifyIndex(candidateAddress, newValue, _secondEarliestEndOfDate[candidateAddress]))
        return candidateAddress;
      candidateAddress = _secondEarliestEndOfDate[candidateAddress];
    }
    return address(0);
  }

  function _isPrevOrderVaultAddress(address _vaultAddress, address _preOrdervaultAddress) internal view returns(bool) {
    return _secondEarliestEndOfDate[_preOrdervaultAddress] == _vaultAddress;
  }

  function _getPrevOrderVaultAddress(address _vaultAddress) internal view returns(address) {
    address currentAddress = GUARD;
    while(_secondEarliestEndOfDate[currentAddress] != GUARD) {
      if(_isPrevOrderVaultAddress(_vaultAddress, currentAddress))
        return currentAddress;
      currentAddress = _secondEarliestEndOfDate[currentAddress];
    }
    return address(0);
  }
}