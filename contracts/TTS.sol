// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TTS Token
 * @dev ERC20 代币合约
 * 总供应量: 2,000,000,000 TTS
 * 部署者初始获得: 2,000,000 TTS
 */
contract TTSToken is ERC20, Ownable {
    // 最大供应量: 20亿代币
    uint256 public constant MAX_SUPPLY = 2_000_000_000 * 10**18;
    
    // 部署者初始分配: 200万代币
    uint256 public constant INITIAL_SUPPLY = 2_000_000 * 10**18;

    /**
     * @dev 构造函数
     * 创建TTS代币并给部署者分配初始代币
     */
    constructor() ERC20("TTS Token", "TTS") Ownable(msg.sender) {
        // 给部署者铸造200万代币
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev 铸造新代币 (仅限合约所有者)
     * @param to 接收代币的地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "TTS: exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @dev 销毁代币
     * @param amount 销毁数量
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @dev 获取剩余可铸造数量
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
}