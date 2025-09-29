"use client";
import {
  WagmiProvider,
  createConfig,
  http,
  useAccount,
  useReadContract,
} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  writeContract,
  waitForTransactionReceipt,
  readContract,
} from "wagmi/actions";
import { ConnectKitProvider, ConnectKitButton } from "connectkit";

import LogABI from "@/app/abi/DataLogger.json";
import { parseEther, type Abi } from "viem";
import { LOG_CONTRACT_ADDRESS } from "@/app/utils/utils";
import { wagmiConfig } from "@/app/utils/wagmiConfig";
import ListData, { ChildRef } from "./ListData";
import { useRef } from "react";

const ABI = (LogABI as { abi: Abi }).abi;

// 创建一个单例 QueryClient 实例
let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  }
  return queryClient;
}

export function TransferPage() {
  const { address, isConnected } = useAccount();
  const childRef = useRef<ChildRef>(null);
  const checkBalance = async () => {
    const {} = useReadContract({});
  };
  const transfer = async () => {
    try {
      const hash = await writeContract(wagmiConfig, {
        address: LOG_CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "submitTransferRecord",
        args: [
          "0x5FbDB2315678afecb367f032d93F642f64180aa3",
          "0x5FbDB2315678afecb367f032d93F642f64180aa3",
          parseEther("0.01"),
          "这是测试转账只是记录信息",
        ],
      });
      const data = await waitForTransactionReceipt(wagmiConfig, { hash });
      console.log("hash:", hash, data);
      childRef.current?.refetch();
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
    }
  };

  return (
    <div>
      <div
        style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}
      >
        <ConnectKitButton />
      </div>
      <button onClick={transfer}>
        {isConnected ? "开始交易" : "还未链接钱包"}
      </button>
      <ListData ref={childRef} />
    </div>
  );
}

// 使用 memoization 避免不必要的重新渲染
const Web3Provider = () => {
  const client = getQueryClient();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={client}>
        <ConnectKitProvider>
          <TransferPage />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
