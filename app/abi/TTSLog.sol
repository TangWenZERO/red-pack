// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// IERC20接口用于调用USDT合约
// interface IERC20 {
//     function transfer(address to, uint256 amount) external returns (bool);
//     function transferFrom(address from, address to, uint256 amount) external returns (bool);
//     function balanceOf(address account) external view returns (uint256);
//     function allowance(address owner, address spender) external view returns (uint256);
// }

contract USDTDataStorage {
    
    // USDT合约地址（可配置不同链的USDT地址）
    mapping(uint256 => address) public usdtContracts; // chainId => USDT address
    
    // 数据存储结构
    struct DataRecord {
        address sender;           // 发送者
        address usdtContract;    // 使用的USDT合约地址  
        uint256 chainId;         // 链ID
        uint256 amount;          // 转账金额（wei）
        string dataHash;         // 数据哈希/ID
        string metadata;         // 元数据
        uint256 timestamp;       // 时间戳
        bytes32 txHash;          // 交易哈希（用于关联）
    }
    
    // 存储所有数据记录
    DataRecord[] public dataRecords;
    
    // 使用mapping存储交易记录，key为自增数字
    mapping(uint256 => DataRecord) public recordsMapping;
    uint256 public recordCounter; // 记录计数器，用于自增ID
    

    
    // 接收USDT的地址（可以是合约自己或指定地址）
    address public dataVault;
    
    // 合约owner
    address public owner;
    
    // 事件
    event DataStored(
        uint256 indexed recordId,
        address indexed sender,
        address indexed usdtContract,
        uint256 chainId,
        string dataHash,
        uint256 amount,
        uint256 timestamp
    );
    
    event USDTContractUpdated(uint256 indexed chainId, address usdtContract);
    
    event DataVaultUpdated(address oldVault, address newVault);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        dataVault = address(this); // 默认合约自己接收USDT
        recordCounter = 1; // 从1开始计数，0用作无效值
        
        // 预设一些主要链的USDT地址
        usdtContracts[1] = 0xdAC17F958D2ee523a2206206994597C13D831ec7;     // Ethereum USDT
        usdtContracts[56] = 0x55d398326f99059fF775485246999027B3197955;    // BSC USDT
        usdtContracts[137] = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;   // Polygon USDT
    }
    
    // 设置不同链的USDT合约地址
    function setUSDTContract(uint256 chainId, address usdtContract) external onlyOwner {
        require(usdtContract != address(0), "Invalid USDT contract");
        usdtContracts[chainId] = usdtContract;
        emit USDTContractUpdated(chainId, usdtContract);
    }
    
    // 设置数据保险库地址
    function setDataVault(address newVault) external onlyOwner {
        require(newVault != address(0), "Invalid vault address");
        address oldVault = dataVault;
        dataVault = newVault;
        emit DataVaultUpdated(oldVault, newVault);
    }
    
    // 通过USDT转账存储数据
    function storeDataWithUSDT(
        uint256 chainId,
        uint256 usdtAmount,
        string memory dataHash,
        string memory metadata,
        bytes32 txHash
    ) public returns (uint256) {
        require(bytes(dataHash).length > 0, "Data hash cannot be empty");
        require(usdtAmount > 0, "USDT amount must be greater than 0");
        
        address usdtContract = usdtContracts[chainId];
        // require(usdtContract != address(0), "USDT contract not set for this chain");
        
        // 执行USDT转账 - 暂时注释掉，仅做记录
        // IERC20 usdt = IERC20(usdtContract);
        // require(
        //     usdt.transferFrom(msg.sender, dataVault, usdtAmount),
        //     "USDT transfer failed"
        // );
        
        // 创建数据记录 - 同时存储在数组和mapping中
        uint256 recordId = recordCounter;
        
        DataRecord memory newRecord = DataRecord({
            sender: msg.sender,
            usdtContract: usdtContract,
            chainId: chainId,
            amount: usdtAmount,
            dataHash: dataHash,
            metadata: metadata,
            timestamp: block.timestamp,
            txHash: txHash
        });
        
        // 存储到数组（保持向后兼容）
        dataRecords.push(newRecord);
        
        // 存储到mapping，使用自增ID作为key
        recordsMapping[recordId] = newRecord;
        
        // 自增计数器
        recordCounter++;
        
        // 发出事件
        emit DataStored(recordId, msg.sender, usdtContract, chainId, dataHash, usdtAmount, block.timestamp);
        
        return recordId;
    }
    
    // 批量存储数据
    function batchStoreDataWithUSDT(
        uint256 chainId,
        uint256[] memory usdtAmounts,
        string[] memory dataHashes,
        string[] memory metadataList,
        bytes32[] memory txHashes
    ) external returns (uint256[] memory) {
        require(
            usdtAmounts.length == dataHashes.length && 
            dataHashes.length == metadataList.length &&
            metadataList.length == txHashes.length,
            "Array lengths must match"
        );
        
        uint256[] memory recordIds = new uint256[](dataHashes.length);
        
        for (uint256 i = 0; i < dataHashes.length; i++) {
            recordIds[i] = storeDataWithUSDT(
                chainId,
                usdtAmounts[i],
                dataHashes[i],
                metadataList[i],
                txHashes[i]
            );
        }
        
        return recordIds;
    }
    
    // 根据自增ID获取单条记录
    function getRecordById(uint256 recordId) external view returns (DataRecord memory) {
        require(recordId > 0 && recordId < recordCounter, "Invalid record ID");
        return recordsMapping[recordId];
    }
    
    // 批量根据ID获取记录
    function getRecordsByIds(uint256[] memory recordIds) 
        external view returns (DataRecord[] memory) {
        DataRecord[] memory records = new DataRecord[](recordIds.length);
        
        for (uint256 i = 0; i < recordIds.length; i++) {
            require(recordIds[i] > 0 && recordIds[i] < recordCounter, "Invalid record ID");
            records[i] = recordsMapping[recordIds[i]];
        }
        
        return records;
    }
    
    // 获取最新的N条记录
    function getLatestRecords(uint256 count) external view returns (DataRecord[] memory) {
        require(count > 0, "Count must be greater than 0");
        
        uint256 totalRecords = recordCounter - 1; // recordCounter从1开始
        if (totalRecords == 0) {
            return new DataRecord[](0);
        }
        
        uint256 actualCount = count > totalRecords ? totalRecords : count;
        DataRecord[] memory records = new DataRecord[](actualCount);
        
        // 从最新记录开始获取
        for (uint256 i = 0; i < actualCount; i++) {
            uint256 recordId = totalRecords - i;
            records[i] = recordsMapping[recordId];
        }
        
        return records;
    }
    
    // 根据ID范围获取记录
    function getRecordsByIdRange(uint256 startId, uint256 endId) 
        external view returns (DataRecord[] memory) {
        require(startId > 0 && startId < recordCounter, "Invalid start ID");
        require(endId > 0 && endId < recordCounter, "Invalid end ID");
        require(startId <= endId, "Start ID must be <= end ID");
        
        uint256 count = endId - startId + 1;
        DataRecord[] memory records = new DataRecord[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 recordId = startId + i;
            records[i] = recordsMapping[recordId];
        }
        
        return records;
    }
    
    // 检查记录是否存在
    function recordExistsById(uint256 recordId) external view returns (bool) {
        return recordId > 0 && recordId < recordCounter;
    }
    
    // 获取当前记录计数器值（下一个将要使用的ID）
    function getNextRecordId() external view returns (uint256) {
        return recordCounter;
    }
    
    // 根据数据哈希读取信息 - 遍历所有记录查找匹配的哈希
    function getDataByHash(string memory dataHash) 
        external view returns (DataRecord[] memory) {
        uint256 count = 0;
        
        // 首先计算匹配的记录数量
        for (uint256 i = 1; i < recordCounter; i++) {
            if (keccak256(abi.encodePacked(recordsMapping[i].dataHash)) == keccak256(abi.encodePacked(dataHash))) {
                count++;
            }
        }
        
        DataRecord[] memory records = new DataRecord[](count);
        uint256 index = 0;
        
        // 收集匹配的记录
        for (uint256 i = 1; i < recordCounter; i++) {
            if (keccak256(abi.encodePacked(recordsMapping[i].dataHash)) == keccak256(abi.encodePacked(dataHash))) {
                records[index] = recordsMapping[i];
                index++;
            }
        }
        
        return records;
    }
    
    // 根据发送者地址读取信息 - 遍历所有记录查找匹配的发送者
    function getDataBySender(address sender) 
        external view returns (DataRecord[] memory) {
        uint256 count = 0;
        
        // 首先计算匹配的记录数量
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].sender == sender) {
                count++;
            }
        }
        
        DataRecord[] memory records = new DataRecord[](count);
        uint256 index = 0;
        
        // 收集匹配的记录
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].sender == sender) {
                records[index] = recordsMapping[i];
                index++;
            }
        }
        
        return records;
    }
    
    // 根据USDT合约地址读取信息 - 遍历所有记录查找匹配的合约地址
    function getDataByUSDTContract(address usdtContract) 
        external view returns (DataRecord[] memory) {
        uint256 count = 0;
        
        // 首先计算匹配的记录数量
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].usdtContract == usdtContract) {
                count++;
            }
        }
        
        DataRecord[] memory records = new DataRecord[](count);
        uint256 index = 0;
        
        // 收集匹配的记录
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].usdtContract == usdtContract) {
                records[index] = recordsMapping[i];
                index++;
            }
        }
        
        return records;
    }
    
    // 根据链ID读取信息 - 遍历所有记录查找匹配的链ID
    function getDataByChainId(uint256 chainId) 
        external view returns (DataRecord[] memory) {
        uint256 count = 0;
        
        // 首先计算匹配的记录数量
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].chainId == chainId) {
                count++;
            }
        }
        
        DataRecord[] memory records = new DataRecord[](count);
        uint256 index = 0;
        
        // 收集匹配的记录
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].chainId == chainId) {
                records[index] = recordsMapping[i];
                index++;
            }
        }
        
        return records;
    }
    
    // 分页获取所有数据
    function getDataPaginated(uint256 offset, uint256 limit) 
        external view returns (DataRecord[] memory) {
        require(offset < dataRecords.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > dataRecords.length) {
            end = dataRecords.length;
        }
        
        DataRecord[] memory records = new DataRecord[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            records[i - offset] = dataRecords[i];
        }
        
        return records;
    }
    
    // 根据金额范围查询 - 遍历mapping而不是数组
    function getDataByAmountRange(uint256 minAmount, uint256 maxAmount) 
        external view returns (DataRecord[] memory) {
        uint256 count = 0;
        
        // 计算符合条件的记录数量
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].amount >= minAmount && recordsMapping[i].amount <= maxAmount) {
                count++;
            }
        }
        
        DataRecord[] memory records = new DataRecord[](count);
        uint256 index = 0;
        
        // 收集符合条件的记录
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].amount >= minAmount && recordsMapping[i].amount <= maxAmount) {
                records[index] = recordsMapping[i];
                index++;
            }
        }
        
        return records;
    }
    
    // 根据时间范围查询 - 遍历mapping而不是数组
    function getDataByTimeRange(uint256 startTime, uint256 endTime) 
        external view returns (DataRecord[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].timestamp >= startTime && recordsMapping[i].timestamp <= endTime) {
                count++;
            }
        }
        
        DataRecord[] memory records = new DataRecord[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].timestamp >= startTime && recordsMapping[i].timestamp <= endTime) {
                records[index] = recordsMapping[i];
                index++;
            }
        }
        
        return records;
    }
    
    // 组合查询：根据链ID和数据哈希 - 遍历所有记录查找同时匹配的条件
    function getDataByChainAndHash(uint256 chainId, string memory dataHash) 
        external view returns (DataRecord[] memory) {
        uint256 count = 0;
        
        // 计算同时满足链ID和哈希条件的记录
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].chainId == chainId && 
                keccak256(abi.encodePacked(recordsMapping[i].dataHash)) == keccak256(abi.encodePacked(dataHash))) {
                count++;
            }
        }
        
        DataRecord[] memory records = new DataRecord[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < recordCounter; i++) {
            if (recordsMapping[i].chainId == chainId && 
                keccak256(abi.encodePacked(recordsMapping[i].dataHash)) == keccak256(abi.encodePacked(dataHash))) {
                records[index] = recordsMapping[i];
                index++;
            }
        }
        
        return records;
    }
    
    // 获取统计信息 - 遍历mapping计算
    function getStats() external view returns (
        uint256 totalRecords,
        uint256 totalUSDTStored,
        uint256 uniqueSenders,
        uint256 uniqueHashes
    ) {
        totalRecords = recordCounter - 1; // recordCounter从1开始
        
        // 计算总USDT金额
        for (uint256 i = 1; i < recordCounter; i++) {
            totalUSDTStored += recordsMapping[i].amount;
        }
        
        // 注意：uniqueSenders和uniqueHashes需要遍历计算，gas消耗较大
        // 在实际应用中可能需要维护单独的计数器
        return (totalRecords, totalUSDTStored, 0, 0);
    }
    
    // 获取记录总数 - 更新为使用计数器
    function getTotalRecords() external view returns (uint256) {
        return recordCounter - 1; // 减1因为计数器从1开始
    }
    
    // 提取合约中的USDT（仅owner）- 暂时注释掉
    // function withdrawUSDT(address usdtContract, uint256 amount, address to) external onlyOwner {
    //     IERC20 usdt = IERC20(usdtContract);
    //     require(usdt.transfer(to, amount), "USDT withdrawal failed");
    // }
    
    // 紧急提取所有USDT - 暂时注释掉
    // function emergencyWithdrawAll(address usdtContract, address to) external onlyOwner {
    //     IERC20 usdt = IERC20(usdtContract);
    //     uint256 balance = usdt.balanceOf(address(this));
    //     if (balance > 0) {
    //         require(usdt.transfer(to, balance), "Emergency withdrawal failed");
    //     }
    // }
}