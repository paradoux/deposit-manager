//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
interface IVaultSortedList {
    function grantRole(bytes32 role, address account) external;
    function renounceRole(bytes32 role, address account) external ;
    function timeToWithdraw(address _vault) external returns(uint256);
    function addEndOfDate(address _vaultAddress, uint256 _epochTime) external;
    function getEarlistEndOfDate() external view returns(uint,address); 
    function removeVault(address _vaultAddress) external;
    function listSize() external view returns(uint);
}
