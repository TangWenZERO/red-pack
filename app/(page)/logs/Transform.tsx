import { LOG_CONTRACT_ADDRESS } from "@/app/utils/utils";
import {
  Dispatch,
  forwardRef,
  SetStateAction,
  useImperativeHandle,
  useState,
} from "react";
import LogABI from "@/app/abi/DataLogger.json";
import { parseEther, type Abi } from "viem";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { wagmiConfig } from "@/app/utils/wagmiConfig";
import { useAccount } from "wagmi";
const ABI = (LogABI as { abi: Abi }).abi;

interface FormData {
  from: string;
  to: string;
  amount: string;
  log: string;
}

type ChildRef = {};
type ChildProps = {
  callback: () => void;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
};

const AddLogs = forwardRef<ChildRef, ChildProps>((props, ref) => {
  const { callback } = props;
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState<FormData>({
    from: "",
    to: "",
    amount: "",
    log: "",
  });
  const transfer = async () => {
    try {
      const hash = await writeContract(wagmiConfig, {
        address: LOG_CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "submitTransferRecord",
        args: [
          formData.from,
          formData.to,
          parseEther(formData.amount),
          formData.log,
        ],
      });
      const data = await waitForTransactionReceipt(wagmiConfig, { hash });
      console.log("hash:", hash, data);
      callback?.();
      // childRef.current?.refetch();
    } catch (error: any) {
      // 检查是否是用户拒绝了请求
      if (error?.code === 4001) {
        console.log("用户拒绝了请求");
      } else if (error?.code === -32603) {
        console.log("内部JSON-RPC错误");
      } else if (error?.name === "TransactionExecutionError") {
        console.log("交易执行错误");
      } else {
        console.error("Transfer error:", error);
      }
    } finally {
      // 提交后清空表单
      setFormData({
        from: "",
        to: "",
        amount: "",
        log: "",
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.from || !formData.to || !formData.amount || !formData.log) {
      alert("请填写所有必填项！");
      return;
    }

    console.log("表单数据:", formData);

    transfer();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          添加转账记录（只是作为记录，不发生实际金额转账）
        </h2>
        <p className="text-sm text-gray-500 mt-1">请输入转账相关信息</p>
      </div>

      {/* 表单容器 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="from"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              发送方
            </label>
            <input
              type="text"
              id="from"
              name="from"
              value={formData.from}
              onChange={handleChange}
              placeholder="请输入发送方地址"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="to"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              接收方
            </label>
            <input
              type="text"
              id="to"
              name="to"
              value={formData.to}
              onChange={handleChange}
              placeholder="请输入接收方地址"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              金额
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="请输入金额"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="mt-6">
          <label
            htmlFor="log"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            日志
          </label>
          <textarea
            id="log"
            name="log"
            value={formData.log}
            onChange={handleChange}
            placeholder="请输入相关日志信息"
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="mt-6">
          <button
            disabled={!isConnected}
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-md hover:shadow-lg hover:opacity-90 transition-all"
          >
            {isConnected ? "提交记录" : "还未链接钱包"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default AddLogs;
