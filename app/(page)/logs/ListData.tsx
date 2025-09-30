import { LOG_CONTRACT_ADDRESS } from "@/app/utils/utils";
import { forwardRef, useImperativeHandle } from "react";
import { useReadContract } from "wagmi";
import { parseEther, type Abi } from "viem";
import LogABI from "@/app/abi/DataLogger.json";

const ABI = (LogABI as { abi: Abi }).abi;
const BaseConfig = {
  address: LOG_CONTRACT_ADDRESS,
  abi: ABI,
};

type TransferRecordSubmittedEvent = {
  id: bigint;
  submitter: string;
  from: string;
  to: string;
  amount: bigint;
  description: string;
  timestamp: bigint;
};

interface ChildProps {}

export interface ChildRef {
  refetch: () => void;
}

const ListData = forwardRef<ChildRef, ChildProps>((props, ref) => {
  const { data: listArray, refetch } = useReadContract({
    ...BaseConfig,
    functionName: "getAllTransferRecords",
  });

  useImperativeHandle(ref, () => ({
    refetch,
  }));

  // 格式化时间戳
  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 格式化地址（显示前6位和后4位）
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 格式化金额（假设是 Wei，转换为 ETH）
  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 1e18).toFixed(6);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">转账记录列表</h2>
        <p className="text-sm text-gray-500 mt-1">
          共 {(listArray as TransferRecordSubmittedEvent[])?.length || 0} 条记录
        </p>
      </div>

      {/* 表格容器 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* 表头 */}
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  提交者
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  发送方
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  接收方
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  金额 (ETH)
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  时间
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  描述
                </th>
              </tr>
            </thead>

            {/* 表体 */}
            <tbody className="divide-y divide-gray-200">
              {(listArray as TransferRecordSubmittedEvent[])
                ?.slice() // 创建数组副本以避免修改原数组
                .sort((a, b) => Number(b.timestamp - a.timestamp)) // 按时间戳倒序排列
                .map((item: TransferRecordSubmittedEvent, index: number) => {
                  return (
                    <tr
                      key={item.id.toString()}
                      className={`
                        hover:bg-blue-50 transition-colors duration-150
                        ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      `}
                    >
                      {/* ID */}
                      <td className="px-4 py-4 text-sm">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold">
                          {item.id.toString()}
                        </span>
                      </td>

                      {/* 提交者 */}
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {item.submitter.slice(2, 4).toUpperCase()}
                          </div>
                          <span
                            className="font-mono text-gray-700"
                            title={item.submitter}
                          >
                            {formatAddress(item.submitter)}
                          </span>
                        </div>
                      </td>

                      {/* 发送方 */}
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {item.from.slice(2, 4).toUpperCase()}
                          </div>
                          <span
                            className="font-mono text-gray-700"
                            title={item.from}
                          >
                            {formatAddress(item.from)}
                          </span>
                        </div>
                      </td>

                      {/* 接收方 */}
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {item.to.slice(2, 4).toUpperCase()}
                          </div>
                          <span
                            className="font-mono text-gray-700"
                            title={item.to}
                          >
                            {formatAddress(item.to)}
                          </span>
                        </div>
                      </td>

                      {/* 金额 */}
                      <td className="px-4 py-4 text-sm text-right">
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                          {formatAmount(item.amount)} ETH
                        </span>
                      </td>

                      {/* 时间 */}
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatTimestamp(item.timestamp).split(" ")[0]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(item.timestamp).split(" ")[1]}
                          </span>
                        </div>
                      </td>

                      {/* 描述 */}
                      <td className="px-4 py-4 text-sm">
                        <div className="max-w-xs">
                          <p
                            className="text-gray-700 truncate"
                            title={item.description}
                          >
                            {item.description || "-"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* 空状态 */}
        {(!listArray ||
          (listArray as TransferRecordSubmittedEvent[]).length === 0) && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">暂无数据</h3>
            <p className="text-sm text-gray-500">还没有任何转账记录</p>
          </div>
        )}
      </div>
    </div>
  );
});

ListData.displayName = "ListData";

export default ListData;
