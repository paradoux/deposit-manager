//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
contract AdminFeeCollector is Ownable {
    //ERROR 
    error WithdrawFailure();

    // EVENT
    event Received(address sender, uint256 amount);
    event Withdrew(address token, uint256 amount);
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function getTokenBalance(address _token) external view returns(uint256) {
        return _token == address(0) ? address(this).balance :  IERC20(_token).balanceOf(address(this));
    }

    function withdraw(address _token) external onlyOwner() {
        uint256 _amount;
        if(_token == address(0)) {
            _amount = address(this).balance;
            (bool success, )= msg.sender.call{value:_amount}("");
            if(!success) {
                revert WithdrawFailure();
                }
        }else{
            _amount = IERC20(_token).balanceOf(address(this));
            IERC20(_token).transfer(msg.sender,_amount);
        }
        emit Withdrew(_token,_amount);
    }

}