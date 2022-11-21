//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "./interface/ISwapRouter.sol";
import "./interface/IWMATIC.sol";
import "./libraries/TransferHelper.sol";
import "./interface/IPoolAddressProvider.sol";
import "./interface/IPool.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract DeFiRouter is Ownable {

    //ERROR 
    error DontReceive();
    error WithdrawFailure();

    //ADDRESS
    address constant AAVE_MUMBAI_DAI_ADDRESS = 0x9A753f0F7886C9fbF63cF59D0D4423C5eFaCE95B;
    address constant WMATIC_ADDRESS= 0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889;
    address constant POOL_ADDRESS_PROVIDER_ADDRESS = 0x5343b5bA672Ae99d627A1C87866b8E53F47Db2E6;
    address constant ISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;

    //DEPLOYED CONTRACTS
    IERC20 constant AAVE_MUMBAI_DAI = IERC20(AAVE_MUMBAI_DAI_ADDRESS);
    ISwapRouter constant SWAP_ROUTER = ISwapRouter(ISWAP_ROUTER);
    IWMATIC constant WMATIC = IWMATIC(WMATIC_ADDRESS);
    IPoolAddressProvider constant POOL_ADDRESS_PROVIDER = IPoolAddressProvider(POOL_ADDRESS_PROVIDER_ADDRESS);
    IPool lendingPool = IPool(POOL_ADDRESS_PROVIDER.getPool());


    receive() external payable {
        if(msg.sender != WMATIC_ADDRESS) {
            revert DontReceive();
        }    
    }


    function addDepositToAAVE()  external payable {
        address currentVaultAddress = msg.sender;
        uint256 amountIn = msg.value;
        uint256 tokenOutAmt = SWAP_ROUTER.exactInputSingle{ value: amountIn }(getSwapParams(amountIn, WMATIC_ADDRESS,AAVE_MUMBAI_DAI_ADDRESS));

        if(address(this).balance>0){
            (bool success,) = currentVaultAddress.call{ value: address(this).balance }("");
            if(!success) {
                revert WithdrawFailure();
            }
        }
        IERC20(AAVE_MUMBAI_DAI_ADDRESS).approve(address(lendingPool), tokenOutAmt);
        lendingPool.supply(AAVE_MUMBAI_DAI_ADDRESS,tokenOutAmt, currentVaultAddress,0);
    }

    function swapToMatic() external returns(uint256) {
        address currentVaultAddress = msg.sender;
        address defiRouterAddress = address(this);
        uint256  allowance = AAVE_MUMBAI_DAI.allowance(currentVaultAddress, defiRouterAddress);
        AAVE_MUMBAI_DAI.transferFrom(currentVaultAddress, defiRouterAddress, allowance);
        TransferHelper.safeApprove(AAVE_MUMBAI_DAI_ADDRESS,address(SWAP_ROUTER),allowance);
        uint256 tokenOutAmt = SWAP_ROUTER.exactInputSingle(getSwapParams(allowance, AAVE_MUMBAI_DAI_ADDRESS,WMATIC_ADDRESS));
        WMATIC.withdraw(tokenOutAmt);
        uint256 maticBalanceOf = defiRouterAddress.balance;
        (bool success, )= currentVaultAddress.call{value:maticBalanceOf}("");
        if(!success) {
            revert WithdrawFailure();
        }

        uint256 currentDai = AAVE_MUMBAI_DAI.balanceOf(defiRouterAddress);
        uint256 currentWmatic = WMATIC.balanceOf(defiRouterAddress);
        if(currentDai>0){
             AAVE_MUMBAI_DAI.transfer(currentVaultAddress,currentDai);
        }
        if(currentWmatic>0){
            WMATIC.transfer(currentVaultAddress,currentWmatic);
        }
        return maticBalanceOf;
    }

    function withdraw(address _token) external onlyOwner() {
        if(_token == address(0)) {
            (bool success, )= msg.sender.call{value:address(this).balance}("");
            if(!success) {
                revert WithdrawFailure();
                }
        }else{
            uint256 tokenBalance = IERC20(_token).balanceOf(address(this));
            IERC20(_token).transfer(msg.sender,tokenBalance);
        }
    }


    function getSwapParams( uint256 _amountIn, address _targetTokenIn, address _targetTokenOut) internal view returns(ISwapRouter.ExactInputSingleParams memory) {
        uint256 deadline = block.timestamp + 15;
        address tokenIn = _targetTokenIn;
        address tokenOut = _targetTokenOut; 
        uint24 fee = 500;
        address recipient = address(this);
        uint256 amountIn = _amountIn;
        uint256 amountOutMinimum = 1;
        uint160 sqrtPriceLimitX96 = 0;
        return ISwapRouter.ExactInputSingleParams(
            tokenIn,
            tokenOut,
            fee,
            recipient,
            deadline,
            amountIn,
            amountOutMinimum,
            sqrtPriceLimitX96
        );
    }



}