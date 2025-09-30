// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;


struct User {
    address addr;
    uint256 amount;
    uint256 time;
}

contract RedPacked {
    // 监听存入红包事件
    event Deposit(address indexed _from, address indexed _to, uint256 _value);
    // 监听睡领取了红包
    event GetRedPacked(address indexed _from, address indexed _to, uint256 _value);
    // 清空红包
    event ClearRedPacked(address indexed _from, address indexed _to, uint256 _value);
    // 发红包的人
    address public owner;
    // 红包数量
    uint256 public totalBalance;
    // 红包金额
    uint256 public totalCount;
    // 红包类型
    bool public isEqual;
    // 领取红包的地址
    mapping(address => User) users;
    User[] userList;

    // 默认设置红包数量、红包类型
    constructor(uint256 _totalCount, bool _isEqual){
        // 红包数量不能为空
        require(_totalCount > 0, "totalCount can not be empty");
        totalCount = _totalCount;
        isEqual = _isEqual;
        owner = msg.sender;
    }
    // 存入红包金额
    function deposit() public payable{
        require(msg.sender == owner, "only owner can deposit");
        require(msg.value > 0,"value must be > 0");
        totalBalance += msg.value;
        emit Deposit(msg.sender, address(this),msg.value);

    }

    // 创建随机数
    function createRandom() private view returns(uint256 random){
        uint256 randomVal = uint256(keccak256(abi.encodePacked(block.timestamp,totalBalance,totalCount,block.coinbase)));
        return randomVal;
    }

    // 返回领红包的人数据
    function getUser() public view returns(User[] memory u){
        return userList;
    }
    // 发合约的人可以随时清空红包
    function clearRedPacked() external {
        // 判断是否是发红包的人
        require(msg.sender == owner, "only owner can clear redPacked");
        payable(owner).transfer(address(this).balance);
        totalBalance = 0;
        emit ClearRedPacked(address(this), owner, address(this).balance);
    }
    // 领取红包
    function getRedPacked() external {
        // 红包数量校验
        require(totalCount > 0, "Game over");
        // 红包金额校验
        require(address(this).balance > 0, "Game over");   
        // 判断当前用户是否已经领取过红包
        // 如果用户已经领取过红包，则检查是否超过24小时
        if (users[msg.sender].amount > 0) {
            require(block.timestamp - users[msg.sender].time >= 24 hours, "You can only claim once every 24 hours");
        }
        
        User memory user = User(msg.sender,0,block.timestamp);
        // 判断是否是最后一个人
        if(totalCount == 1){
            uint256 oneBalance = address(this).balance;
            payable(msg.sender).transfer(oneBalance);
            user.amount = oneBalance;
            totalBalance = 0;
            totalCount = 0;
            totalBalance = 0;
        }else{
            if(isEqual){
                uint256 oneBalance = address(this).balance / totalCount;
                payable(msg.sender).transfer(oneBalance);
                user.amount = oneBalance;
                totalBalance -= oneBalance;
                totalCount -= 1;
            }else{
                uint256 oneBalance = createRandom() % (address(this).balance / (totalCount -1 ));
                user.amount = oneBalance;
                payable(msg.sender).transfer(oneBalance);
                totalBalance -= oneBalance;
                totalCount -= 1;
            }
        }   
        emit GetRedPacked(address(this), msg.sender,user.amount);
        users[msg.sender] = user;
        userList.push(user);
    }
}
