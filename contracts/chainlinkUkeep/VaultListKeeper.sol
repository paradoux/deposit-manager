// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "./ukeeperAutomation/AutomationCompatible.sol";
import "../interface/IVaultSortedList.sol";
import "../interface/IVaultImplementation.sol";
contract VaultListKeeper is AutomationCompatibleInterface {

    address public constant SortedVaultListAddr = 0x86C6389cE6B243561144cD8356c94663934d127a;
    IVaultSortedList public constant sortedVaultList = IVaultSortedList(SortedVaultListAddr); 

    function getList() external view returns(uint){
        return sortedVaultList.listSize();
    }
    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        if(sortedVaultList.listSize()>0) {
        (uint256 earliestDate, ) = sortedVaultList.getEarlistEndOfDate();
        upkeepNeeded = earliestDate < block.timestamp;
        }else{
            upkeepNeeded = false;
        }
     
    }

    function performUpkeep(bytes calldata /* performData */) external override {
         (uint256 earliestDate, address vaultAddress) = sortedVaultList.getEarlistEndOfDate();
        if (earliestDate < block.timestamp) {
            IVaultImplementation(vaultAddress).removeDepositFromAAVE();
            emit WithdrawDepositFromUpkeepr(earliestDate,block.timestamp,vaultAddress);
        }
       
    }

    event WithdrawDepositFromUpkeepr(uint256 _endOfTimeToWithdraw, uint256 _currentTime, address _vaultAddress);
}
