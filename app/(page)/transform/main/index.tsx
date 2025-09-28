import React, { useState, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useReadContract,
  usePublicClient,
} from "wagmi";
import { ConnectKitButton } from "connectkit";
import { parseEther, formatEther, keccak256, toBytes } from "viem";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "@/app/utils/wagmiConfig";
import {
  Send,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { CONTRACT_LOG_ADDRESS } from "@/app/utils/utils";
import contractAbi from "@/app/abi/USDTDataStorage.json";
const ABI = (contractAbi as { abi: any }).abi;

// 合约地址 - 请替换为实际部署的合约地址
const CONTRACT_ADDRESS = CONTRACT_LOG_ADDRESS;

interface DataRecord {
  sender: string;
  usdtContract: string;
  chainId: bigint;
  amount: bigint;
  dataHash: string;
  metadata: string;
  timestamp: bigint;
  txHash: string;
}

const TransferPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const publicClient = usePublicClient();

  // 存储数据相关状态
  const [amount, setAmount] = useState("");
  const [dataHash, setDataHash] = useState("");
  const [metadata, setMetadata] = useState("");
  const [chainId, setChainId] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTxHash, setCurrentTxHash] = useState("");

  // wagmi hooks
  // const { writeContractAsync } = useWriteContract();

  // 查询当前用户的记录
  const { data: dataRecords, refetch: refetchRecords } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ABI,
    functionName: "getDataBySender",
    args: [address],
    query: {
      enabled: !!address,
    },
  }) as { data: DataRecord[] | undefined; refetch: () => Promise<any> };

  // 处理数据存储
  const handleTransfer = async () => {
    if (!amount || !dataHash || !metadata) {
      alert("请填写完整信息");
      return;
    }

    if (Number(amount) <= 0) {
      alert("金额必须大于0");
      return;
    }

    try {
      setIsLoading(true);

      // 将金额转换为 wei (假设是 USDT，通常是 6 位小数，但这里按 18 位处理)
      const usdtAmount = parseEther(amount);

      // 生成一个模拟的交易哈希
      const simulatedTxHash = keccak256(
        toBytes(`${address}-${Date.now()}-${amount}`)
      );

      // 发起交易
      const txHash = await writeContract(wagmiConfig, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ABI,
        functionName: "storeDataWithUSDT",
        value: parseEther("0.0001"),
        args: [
          BigInt(chainId),
          usdtAmount,
          dataHash,
          metadata,
          simulatedTxHash,
        ],
      });
      // writeContract(wagmiConfig, {
      //   address: CONTRACT_ADDRESS,
      //   abi: contractAbi,
      //   functionName: "getRedPacked",
      // }),
      console.log("交易已提交，哈希:", txHash);
      setCurrentTxHash(txHash);

      // 等待交易确认
      if (wagmiConfig) {
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: txHash,
        });

        console.log("交易已确认:", receipt);

        if (receipt.status === "success") {
          alert("数据存储成功！");

          // 清空表单
          setAmount("");
          setDataHash("");
          setMetadata("");
          setCurrentTxHash("");

          // 刷新数据记录
          await refetchRecords();
        } else {
          alert("交易失败，请重试");
        }
      } else {
        alert("无法获取公共客户端，请检查网络配置");
      }
    } catch (error) {
      console.log("存储失败:", error);
      // alert(`存储失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 移除之前的 useEffect，因为现在采用同步方式

  // 格式化时间
  const formatTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString("zh-CN");
  };

  // 格式化地址
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 格式化金额
  const formatAmount = (amount: bigint) => {
    return formatEther(amount);
  };
  console.log("isConnected:", isConnected);
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end items-center">
          <ConnectKitButton label="链接钱包" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          USDT 数据存储系统
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：数据存储功能 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Send className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">
                存储数据记录
              </h2>
            </div>

            {/* 余额显示 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">当前余额:</span>
                <span className="text-xl font-bold text-blue-600">
                  {balance
                    ? `${formatEther(balance.value)} ${balance.symbol}`
                    : "0 ETH"}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                地址: {formatAddress(address || "")}
                <br />
                <span className="text-xs text-orange-600 mt-1 block">
                  合约地址: {formatAddress(CONTRACT_ADDRESS)}
                </span>
              </div>
            </div>

            {/* 数据存储表单 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  链ID
                </label>
                <select
                  value={chainId}
                  onChange={(e) => setChainId(e.target.value)}
                  disabled={!isConnected}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                >
                  <option value="1">以太坊主网 (1)</option>
                  <option value="56">BSC主网 (56)</option>
                  <option value="137">Polygon (137)</option>
                  <option value="97">BSC测试网 (97)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USDT金额
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!isConnected}
                  placeholder="0.0"
                  step="0.000001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数据哈希
                </label>
                <input
                  type="text"
                  value={dataHash}
                  onChange={(e) => setDataHash(e.target.value)}
                  disabled={!isConnected}
                  placeholder="输入数据哈希值"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  元数据
                </label>
                <textarea
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  disabled={!isConnected}
                  placeholder="输入相关的元数据信息"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black resize-none"
                />
              </div>

              <button
                onClick={handleTransfer}
                disabled={
                  !isConnected || isLoading || !amount || !dataHash || !metadata
                }
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {!isConnected ? (
                  "请先连接钱包"
                ) : isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    处理中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    存储数据记录
                  </>
                )}
              </button>
            </div>

            {/* 状态提示 */}
            {currentTxHash && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  当前交易哈希: {formatAddress(currentTxHash)}
                  {isLoading && (
                    <span className="ml-2 text-blue-600">
                      正在等待交易确认...
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* 右侧：数据记录 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">数据记录</h2>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {!dataRecords || dataRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无数据记录</p>
                </div>
              ) : (
                dataRecords.map((record, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-green-600">
                          已存储
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        链ID: {record.chainId.toString()}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium text-gray-700">
                            金额:
                          </span>{" "}
                          {formatAmount(record.amount)} USDT
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            时间:
                          </span>{" "}
                          {formatTime(record.timestamp)}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">
                          合约地址:
                        </span>{" "}
                        {formatAddress(record.usdtContract)}
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">
                          数据哈希:
                        </span>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                          {record.dataHash}
                        </div>
                      </div>

                      {record.metadata && (
                        <div>
                          <span className="font-medium text-gray-700">
                            元数据:
                          </span>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs max-h-20 overflow-y-auto">
                            {record.metadata}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="font-medium text-gray-700">
                          交易哈希:
                        </span>{" "}
                        {formatAddress(record.txHash)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferPage;
