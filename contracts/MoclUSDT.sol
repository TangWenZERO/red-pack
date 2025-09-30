// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title 测试用的 USDT 代币
contract MockUSDT is ERC20, Ownable {
    constructor() ERC20("Mock USDT", "USDT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals()); // 初始给合约部署者 1,000,000 USDT
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /// @notice 向指定地址转移USDT并增加授权额度
    function transferAndApprove(address to, uint256 amount) external onlyOwner {
        transfer(to, amount);
        _approve(to, msg.sender, amount);
    }
}

/// @title ETH ↔ USDT 简单兑换合约
contract MockSwap is Ownable {
    MockUSDT public usdt;
    uint256 public rate = 1000; 
    // 比例：1 ETH = 1000 USDT（随便设，测试用）

    constructor(address _usdt) Ownable(msg.sender) {
        usdt = MockUSDT(_usdt);
    }

    /// @notice 用 ETH 换 USDT
    function swapETHForUSDT() external payable {
        require(msg.value > 0, "No ETH provided");

        uint256 usdtAmount = msg.value * rate;
        require(usdt.balanceOf(address(this)) >= usdtAmount, "Insufficient USDT balance");

        usdt.transfer(msg.sender, usdtAmount);
    }

    /// @notice 给合约充值 USDT (owner)
    function depositUSDT(uint256 amount) external onlyOwner {
        usdt.transferFrom(msg.sender, address(this), amount);
    }
    
    /// @notice 向合约充值USDT（任何人都可以调用）
    function addLiquidity(uint256 amount) external {
        usdt.transferFrom(msg.sender, address(this), amount);
    }

    /// @notice 提走合约里的 ETH (owner)
    function withdrawETH(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }
    
    /// @notice 提走合约里的 USDT (owner)
    function withdrawUSDT(uint256 amount) external onlyOwner {
        usdt.transfer(owner(), amount);
    }
}