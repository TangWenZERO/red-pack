"use client";

import { useCallback, useMemo, useState } from "react";
import {
  WagmiProvider,
  createConfig,
  http,
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { injected, metaMask, safe, walletConnect } from "wagmi/connectors";
import { hardhat } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BaseError, formatEther, getAddress, parseEther, type Abi } from "viem";
import redArtifact from "@/app/abi/Red.json";
import { trimValue, formatTimestamp, shortAddress } from "@/app/utils/utils";

const CONTRACT_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F" as const;
const contractAbi = (redArtifact as { abi: Abi }).abi;
const projectId = "<WALLETCONNECT_PROJECT_ID>";

type ContractInfo = {
  owner: string;
  totalBalance: string;
  totalCount: string;
  isEqual: boolean;
};

type ClaimRecord = {
  addr: string;
  amount: string;
  time: number;
};

const wagmiConfig = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http(
      hardhat.rpcUrls.default.http[0] ?? "http://127.0.0.1:8545"
    ),
  },
  connectors: [injected(), walletConnect({ projectId }), metaMask(), safe()],
});

function WagmiPageInner() {
  const { address, chainId, status } = useAccount();
  const {
    connect,
    connectors,
    status: connectStatus,
    error: connectError,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const [depositAmount, setDepositAmount] = useState("");
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const {
    data: balanceData,
    refetch: refetchBalance,
    isFetching: isBalanceFetching,
  } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  const ownerQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "owner",
    query: { enabled: Boolean(address) },
  });

  const totalBalanceQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "totalBalance",
    query: { enabled: Boolean(address) },
  });

  const totalCountQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "totalCount",
    query: { enabled: Boolean(address) },
  });

  const isEqualQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "isEqual",
    query: { enabled: Boolean(address) },
  });

  const claimListQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "getUser",
    query: { enabled: Boolean(address) },
  });

  const { writeContractAsync, isPending: isDepositing } = useWriteContract();

  const refetchOwner = ownerQuery.refetch;
  const refetchTotalBalance = totalBalanceQuery.refetch;
  const refetchTotalCount = totalCountQuery.refetch;
  const refetchIsEqual = isEqualQuery.refetch;
  const refetchClaimList = claimListQuery.refetch;

  const ownerFetching = ownerQuery.isFetching;
  const totalBalanceFetching = totalBalanceQuery.isFetching;
  const totalCountFetching = totalCountQuery.isFetching;
  const isEqualFetching = isEqualQuery.isFetching;
  const claimListFetching = claimListQuery.isFetching;

  const waitForReceipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
      retry: false,
      onSuccess: async () => {
        setTxError(null);
        setTxHash(undefined);
        setDepositAmount("");
        await Promise.allSettled([
          refetchOwner(),
          refetchTotalBalance(),
          refetchTotalCount(),
          refetchIsEqual(),
          refetchClaimList(),
          refetchBalance(),
        ]);
      },
      onError: (error) => {
        setTxHash(undefined);
        if (error instanceof BaseError) {
          setTxError(error.shortMessage ?? error.message);
        } else if (error instanceof Error) {
          setTxError(error.message);
        } else {
          setTxError(String(error));
        }
      },
    },
  });

  const contractLoading =
    ownerQuery.isLoading ||
    totalBalanceQuery.isLoading ||
    totalCountQuery.isLoading ||
    isEqualQuery.isLoading;

  const contractErrorMessage =
    ownerQuery.error?.message ||
    totalBalanceQuery.error?.message ||
    totalCountQuery.error?.message ||
    isEqualQuery.error?.message;

  const contractInfo = useMemo(() => {
    if (
      ownerQuery.data === undefined ||
      totalBalanceQuery.data === undefined ||
      totalCountQuery.data === undefined ||
      isEqualQuery.data === undefined
    ) {
      return null;
    }

    return {
      owner: getAddress(ownerQuery.data as string),
      totalBalance: trimValue(
        typeof totalBalanceQuery.data === "bigint"
          ? formatEther(totalBalanceQuery.data)
          : null
      ),
      totalCount: String(totalCountQuery.data),
      isEqual: Boolean(isEqualQuery.data),
    };
  }, [
    isEqualQuery.data,
    ownerQuery.data,
    totalBalanceQuery.data,
    totalCountQuery.data,
  ]);

  const claimRecords = useMemo(() => {
    if (!claimListQuery.data) {
      return [] as ClaimRecord[];
    }

    return (claimListQuery.data as any[]).map((item) => {
      const addr = item.addr ?? item[0];
      const amount = item.amount ?? item[1];
      const time = item.time ?? item[2];

      const normalizedAddress = addr
        ? getAddress(addr as string)
        : "0x0000000000000000000000000000000000000000";
      let normalizedAmount: bigint = 0n;
      try {
        normalizedAmount =
          typeof amount === "bigint"
            ? amount
            : amount !== undefined
            ? BigInt(amount)
            : 0n;
      } catch (err) {
        normalizedAmount = 0n;
      }
      const normalizedTime =
        typeof time === "bigint"
          ? Number(time)
          : typeof time === "number"
          ? time
          : Number(time ?? 0);

      return {
        addr: normalizedAddress,
        amount: trimValue(formatEther(normalizedAmount)),
        time: Number.isFinite(normalizedTime) ? normalizedTime : 0,
      } satisfies ClaimRecord;
    });
  }, [claimListQuery.data]);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting" || connectStatus === "pending";
  const isConfirming = waitForReceipt.isLoading;
  const primaryConnector = connectors[0];

  const isRefreshing =
    isBalanceFetching ||
    ownerFetching ||
    totalBalanceFetching ||
    totalCountFetching ||
    isEqualFetching ||
    claimListFetching;

  const handleRefresh = useCallback(() => {
    if (!address) {
      return;
    }

    void refetchBalance();
    void refetchOwner();
    void refetchTotalBalance();
    void refetchTotalCount();
    void refetchIsEqual();
    void refetchClaimList();
  }, [
    address,
    refetchBalance,
    refetchClaimList,
    refetchIsEqual,
    refetchOwner,
    refetchTotalBalance,
    refetchTotalCount,
  ]);

  const handleDeposit = useCallback(async () => {
    if (!address) {
      setTxError("请先连接钱包");
      return;
    }

    const amountText = depositAmount.trim();
    if (!amountText) {
      setTxError("请输入存入金额");
      return;
    }

    let amountInWei: bigint;
    try {
      amountInWei = parseEther(amountText);
    } catch (err) {
      setTxError("请输入合法的 ETH 金额");
      return;
    }

    if (amountInWei <= 0n) {
      setTxError("金额必须大于 0");
      return;
    }

    try {
      setTxError(null);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "deposit",
        value: amountInWei,
      });
      setTxHash(hash);
    } catch (error) {
      if (error instanceof BaseError) {
        setTxError(error.shortMessage ?? error.message);
      } else if (error instanceof Error) {
        setTxError(error.message);
      } else {
        setTxError(String(error));
      }
    }
  }, [address, depositAmount, writeContractAsync]);

  const activeChain = useMemo(() => {
    if (!chainId) return "-";
    const matched = wagmiConfig.chains.find((chain) => chain.id === chainId);
    return matched ? `${matched.name} (${matched.id})` : `Chain ${chainId}`;
  }, [chainId]);

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="state-pill">wagmi</div>
        <h1>wagmi 钱包集成演示</h1>
        <p>
          使用 wagmi 提供的 hooks 来管理钱包连接状态，并通过 React Query
          自动维护数据缓存。
        </p>

        <div className="action-row">
          <button
            type="button"
            className="primary-btn"
            // onClick={connectContract}
            disabled={isConnecting}
          >
            {isConnecting ? "连接中..." : isConnected ? "重新连接" : "连接钱包"}
          </button>
          <button
            type="button"
            className="secondary-btn"
            // onClick={() => getWallet({ account: account || "" })}
            // disabled={!isConnected || isFetching}
          >
            {isFetching ? "读取中..." : "刷新信息"}
          </button>
          {isConnected ? (
            <button
              type="button"
              className="secondary-btn"
              // onClick={tartDisconnect}
            >
              断开连接
            </button>
          ) : null}
          <button
            type="button"
            className="secondary-btn"
            // onClick={getRedPacket}
            // disabled={isClaiming}
          >
            {isClaiming ? "领取中..." : "领取红包"}
          </button>

          {!isConnected ? (
            connectors.length > 0 ? (
              connectors.map((connector) => (
                <button
                  key={connector.uid}
                  type="button"
                  className="primary-btn"
                  onClick={() => connect({ connector })}
                  disabled={!connector.ready || isConnecting}
                >
                  {connector.name}
                </button>
              ))
            ) : (
              <span className="secondary-btn">暂无可用连接器</span>
            )
          ) : (
            <>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? "读取中..." : "刷新信息"}
              </button>
              {primaryConnector ? (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => connect({ connector: primaryConnector })}
                  disabled={isConnecting}
                >
                  重新连接
                </button>
              ) : null}
              <button
                type="button"
                className="secondary-btn"
                onClick={() => disconnect()}
              >
                断开连接
              </button>
            </>
          )}
        </div>

        {isConnecting ? (
          <div className="state-pill" style={{ marginTop: "1rem" }}>
            连接中...
          </div>
        ) : null}
        {connectError ? (
          <div className="error-box">{connectError.message}</div>
        ) : null}
        {txError ? <div className="error-box">{txError}</div> : null}

        {isConnected ? (
          <div className="deposit-row">
            <input
              className="input-field"
              type="number"
              min="0"
              step="0.0001"
              placeholder="请输入存入的 ETH 数量"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              disabled={isDepositing || isConfirming}
            />
            <button
              type="button"
              className="primary-btn"
              onClick={handleDeposit}
              disabled={
                isDepositing ||
                isConfirming ||
                depositAmount.trim().length === 0
              }
            >
              {isDepositing || isConfirming ? "存入中..." : "存入金额"}
            </button>
          </div>
        ) : null}

        <div className="info-grid">
          <div className="info-card">
            <h2>钱包信息</h2>
            {isConnected && address ? (
              <div className="data-list">
                <div className="data-item">
                  <span>账户地址</span>
                  <strong title={address}>{shortAddress(address)}</strong>
                </div>
                <div className="data-item">
                  <span>当前网络</span>
                  <strong>{activeChain}</strong>
                </div>
                <div className="data-item">
                  <span>账户余额</span>
                  <strong>{`${trimValue(
                    balanceData?.formatted ?? null
                  )} ETH`}</strong>
                </div>
              </div>
            ) : (
              <p>连接后可查看当前账户信息。</p>
            )}
          </div>

          <div className="info-card">
            <h2>合约信息</h2>
            {isConnected ? (
              contractInfo ? (
                <div className="data-list">
                  <div className="data-item">
                    <span>合约地址</span>
                    <strong title={CONTRACT_ADDRESS}>
                      {shortAddress(CONTRACT_ADDRESS)}
                    </strong>
                  </div>
                  <div className="data-item">
                    <span>Owner</span>
                    <strong title={contractInfo.owner}>
                      {shortAddress(contractInfo.owner)}
                    </strong>
                  </div>
                  <div className="data-item">
                    <span>总余额</span>
                    <strong>{`${contractInfo.totalBalance} ETH`}</strong>
                  </div>
                  <div className="data-item">
                    <span>红包数量</span>
                    <strong>{contractInfo.totalCount}</strong>
                  </div>
                  <div className="data-item">
                    <span>等额红包</span>
                    <strong>{contractInfo.isEqual ? "是" : "否"}</strong>
                  </div>
                </div>
              ) : (
                <p>
                  {contractLoading
                    ? "正在读取合约信息..."
                    : contractErrorMessage || "暂无合约数据"}
                </p>
              )
            ) : (
              <p>wagmi 会在连接后自动读取合约状态。</p>
            )}
          </div>

          <div className="info-card">
            <h2>领取记录</h2>
            {isConnected ? (
              claimListQuery.isFetching || claimListQuery.isLoading ? (
                <p>正在读取领取记录...</p>
              ) : claimListQuery.error ? (
                <p>{claimListQuery.error.message}</p>
              ) : claimRecords.length > 0 ? (
                <div className="data-list">
                  {claimRecords.map((record, index) => (
                    <div
                      className="claim-entry"
                      key={`${record.addr}-${record.time}-${index}`}
                    >
                      <div className="data-item">
                        <span>序号</span>
                        <strong>{index + 1}</strong>
                      </div>
                      <div className="data-item">
                        <span>领取人</span>
                        <strong title={record.addr}>
                          {shortAddress(record.addr)}
                        </strong>
                      </div>
                      <div className="data-item">
                        <span>领取金额</span>
                        <strong>{`${record.amount} ETH`}</strong>
                      </div>
                      <div className="data-item">
                        <span>领取时间</span>
                        <strong>{formatTimestamp(record.time)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>暂无领取记录。</p>
              )
            ) : (
              <p>连接钱包后即可查看领取记录。</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function WagmiWalletPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiPageInner />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
