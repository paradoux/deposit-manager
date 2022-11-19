// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IPoolAddressProvider {
    function getPool() external view returns (address);
}