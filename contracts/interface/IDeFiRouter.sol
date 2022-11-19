//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
interface IDeFiRouter {
    function addDepositToAAVE() external payable;
   function swapToMatic() external returns(uint256);
}
