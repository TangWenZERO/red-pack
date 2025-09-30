// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DataLogger V2
 * @dev 用于记录和管理转账信息的合约
 */
contract DataLogger is Ownable, ReentrancyGuard {
    
    // ============ 数据结构定义 ============
    
    /**
     * @dev 用户提交的转账信息记录（不实际转账）
     */
    struct TransferRecord {
        uint256 id;
        address submitter;      // 提交者
        address from;           // 发送方
        address to;             // 接收方
        uint256 amount;         // 金额
        string description;     // 描述信息
        uint256 timestamp;      // 时间戳
    }
    
    /**
     * @dev 实际转账记录（合约内部转账）
     */
    struct ActualTransfer {
        uint256 id;
        address from;           // 发送方
        address to;             // 接收方
        uint256 amount;         // 金额
        uint256 timestamp;      // 时间戳
        string note;            // 备注
    }
    
    // ============ 状态变量 ============
    
    // 计数器
    uint256 private _recordCounter;
    uint256 private _transferCounter;
    
    // 任务2: 存储用户提交的转账信息
    mapping(uint256 => TransferRecord) public transferRecords;
    mapping(address => uint256[]) public userSubmittedRecords; // 用户提交的记录ID列表
    
    // 任务3: 存储实际转账记录
    mapping(uint256 => ActualTransfer) public actualTransfers;
    mapping(address => uint256[]) public userActualTransfers; // 用户实际转账记录ID列表
    
    // 任务4: 用户余额
    mapping(address => uint256) public balances;
    
    // ============ 事件定义 ============
    
    /**
     * @dev 任务2: 用户提交转账信息事件
     */
    event TransferRecordSubmitted(
        uint256 indexed id,
        address indexed submitter,
        address indexed from,
        address to,
        uint256 amount,
        string description,
        uint256 timestamp
    );
    
    /**
     * @dev 任务3 & 任务5: 实际转账事件（带监听）
     */
    event ActualTransferExecuted(
        uint256 indexed id,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp,
        string note
    );
    
    /**
     * @dev 任务4: 存款事件
     */
    event Deposited(
        address indexed user,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );
    
    /**
     * @dev 任务4: 提款事件
     */
    event Withdrawn(
        address indexed user,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );
    
    // ============ 构造函数 ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ 任务2: 提交转账信息（不实际转账）============
    
    /**
     * @dev 提交转账信息记录
     * @param from 发送方地址
     * @param to 接收方地址
     * @param amount 金额
     * @param description 描述信息
     */
    function submitTransferRecord(
        address from,
        address to,
        uint256 amount,
        string memory description
    ) public {
        require(from != address(0), "Invalid from address");
        require(to != address(0), "Invalid to address");
        require(amount > 0, "Amount must be greater than 0");
        
        _recordCounter++;
        
        TransferRecord memory newRecord = TransferRecord({
            id: _recordCounter,
            submitter: msg.sender,
            from: from,
            to: to,
            amount: amount,
            description: description,
            timestamp: block.timestamp
        });
        
        transferRecords[_recordCounter] = newRecord;
        userSubmittedRecords[msg.sender].push(_recordCounter);
        
        emit TransferRecordSubmitted(
            _recordCounter,
            msg.sender,
            from,
            to,
            amount,
            description,
            block.timestamp
        );
    }
    
    /**
     * @dev 批量提交转账记录
     */
    function batchSubmitRecords(
        address[] memory froms,
        address[] memory tos,
        uint256[] memory amounts,
        string[] memory descriptions
    ) external {
        require(
            froms.length == tos.length && 
            tos.length == amounts.length && 
            amounts.length == descriptions.length,
            "Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < froms.length; i++) {
            submitTransferRecord(froms[i], tos[i], amounts[i], descriptions[i]);
        }
    }
    
    /**
     * @dev 查询转账记录详情
     * @param recordId 记录ID
     */
    function getTransferRecord(uint256 recordId) external view returns (TransferRecord memory) {
        require(recordId > 0 && recordId <= _recordCounter, "Invalid record ID");
        return transferRecords[recordId];
    }
    
    /**
     * @dev 查询用户提交的所有记录ID
     * @param user 用户地址
     */
    function getUserSubmittedRecords(address user) external view returns (uint256[] memory) {
        return userSubmittedRecords[user];
    }
    
    /**
     * @dev 获取记录总数
     */
    function getRecordCount() external view returns (uint256) {
        return _recordCounter;
    }
    
    /**
     * @dev 获取所有转账记录
     * @return records 所有转账记录数组
     */
    function getAllTransferRecords() external view returns (TransferRecord[] memory) {
        TransferRecord[] memory records = new TransferRecord[](_recordCounter);
        
        for (uint256 i = 1; i <= _recordCounter; i++) {
            records[i - 1] = transferRecords[i];
        }
        
        return records;
    }
    
    /**
     * @dev 分页获取转账记录
     * @param offset 起始位置（从0开始）
     * @param limit 获取数量
     * @return records 转账记录数组
     * @return total 总记录数
     */
    function getTransferRecordsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (TransferRecord[] memory records, uint256 total) {
        total = _recordCounter;
        
        if (offset >= total) {
            return (new TransferRecord[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 size = end - offset;
        records = new TransferRecord[](size);
        
        for (uint256 i = 0; i < size; i++) {
            records[i] = transferRecords[offset + i + 1];
        }
        
        return (records, total);
    }
    
    // ============ 任务3: 实际转账功能 ============
    
    /**
     * @dev 执行实际转账（从用户余额中转账）
     * @param to 接收方地址
     * @param amount 转账金额
     * @param note 备注信息
     */
    function executeTransfer(
        address to,
        uint256 amount,
        string memory note
    ) external nonReentrant {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // 执行转账
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        _transferCounter++;
        
        // 记录转账信息
        ActualTransfer memory newTransfer = ActualTransfer({
            id: _transferCounter,
            from: msg.sender,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            note: note
        });
        
        actualTransfers[_transferCounter] = newTransfer;
        userActualTransfers[msg.sender].push(_transferCounter);
        userActualTransfers[to].push(_transferCounter);
        
        // 任务5: 触发转账事件（用于监听）
        emit ActualTransferExecuted(
            _transferCounter,
            msg.sender,
            to,
            amount,
            block.timestamp,
            note
        );
    }
    
    /**
     * @dev 查询实际转账记录详情
     * @param transferId 转账ID
     */
    function getActualTransfer(uint256 transferId) external view returns (ActualTransfer memory) {
        require(transferId > 0 && transferId <= _transferCounter, "Invalid transfer ID");
        return actualTransfers[transferId];
    }
    
    /**
     * @dev 查询用户的所有实际转账记录ID
     * @param user 用户地址
     */
    function getUserActualTransfers(address user) external view returns (uint256[] memory) {
        return userActualTransfers[user];
    }
    
    /**
     * @dev 获取实际转账总数
     */
    function getTransferCount() external view returns (uint256) {
        return _transferCounter;
    }
    
    /**
     * @dev 获取所有实际转账记录
     * @return transfers 所有实际转账记录数组
     */
    function getAllActualTransfers() external view returns (ActualTransfer[] memory) {
        ActualTransfer[] memory transfers = new ActualTransfer[](_transferCounter);
        
        for (uint256 i = 1; i <= _transferCounter; i++) {
            transfers[i - 1] = actualTransfers[i];
        }
        
        return transfers;
    }
    
    /**
     * @dev 分页获取实际转账记录
     * @param offset 起始位置（从0开始）
     * @param limit 获取数量
     * @return transfers 实际转账记录数组
     * @return total 总记录数
     */
    function getActualTransfersPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (ActualTransfer[] memory transfers, uint256 total) {
        total = _transferCounter;
        
        if (offset >= total) {
            return (new ActualTransfer[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 size = end - offset;
        transfers = new ActualTransfer[](size);
        
        for (uint256 i = 0; i < size; i++) {
            transfers[i] = actualTransfers[offset + i + 1];
        }
        
        return (transfers, total);
    }
    
    // ============ 任务4: 存取款功能 ============
    
    /**
     * @dev 存款到合约（用户往合约里存钱）
     */
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        balances[msg.sender] += msg.value;
        
        emit Deposited(
            msg.sender,
            msg.value,
            balances[msg.sender],
            block.timestamp
        );
    }
    
    /**
     * @dev 提款（从合约中取出自己的钱）
     * @param amount 提款金额
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdraw amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(
            msg.sender,
            amount,
            balances[msg.sender],
            block.timestamp
        );
    }
    
    /**
     * @dev 查询用户余额
     * @param user 用户地址
     */
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    /**
     * @dev 查询合约总余额
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // ============ 辅助函数 ============
    
    /**
     * @dev 接收以太币
     */
    receive() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(
            msg.sender,
            msg.value,
            balances[msg.sender],
            block.timestamp
        );
    }
    
    /**
     * @dev 紧急提取（仅限所有者，用于紧急情况）
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }
}