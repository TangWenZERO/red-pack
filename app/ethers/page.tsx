"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import redArtifact from "@/app/abi/Red.json";

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as const;
const contractAbi = (redArtifact as { abi: ethers.InterfaceAbi }).abi;

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (
        event: string,
        handler: (...args: any[]) => void
      ) => void;
    };
  }
}

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

const formatEth = (value: string | null) => {
  if (!value) return "-";
  const [whole, fraction = ""] = value.split(".");
  return fraction ? `${whole}.${fraction.slice(0, 6)}` : whole;
};

const formatAddress = (value: string | null) => {
  if (!value) return "-";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const describeNetwork = (network: ethers.Network | null) => {
  if (!network) return "-";
  if (network.name && network.name !== "unknown") {
    return `${network.name} (${network.chainId})`;
  }
  return `Chain ${network.chainId}`;
};

const formatTimestamp = (value: number | null) => {
  if (!value) return "-";
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

const extractErrorMessage = (err: unknown) => {
  if (!err) return "未知错误";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const errorWithShortMessage = err as Error & {
      shortMessage?: string;
      info?: { error?: { message?: string } };
      reason?: string;
      data?: { message?: string };
    };
    return (
      errorWithShortMessage.shortMessage ||
      errorWithShortMessage.reason ||
      errorWithShortMessage.info?.error?.message ||
      errorWithShortMessage.data?.message ||
      err.message
    );
  }
  if (typeof err === "object") {
    const maybeMessage = (err as { message?: string; error?: string }).message;
    if (maybeMessage) return maybeMessage;
    const maybeError = (err as { error?: string }).error;
    if (maybeError) return maybeError;
  }
  return String(err);
};

export default function EthersWalletPage() {
  const provideRef = useRef<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<ethers.Network | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [claimRecords, setClaimRecords] = useState<ClaimRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  // 断开连接
  const tartDisconnect = useCallback(() => {
    provideRef.current = null;
    setAccount(null);
    setBalance(null);
    setNetwork(null);
    setContractInfo(null);
    setClaimRecords([]);
    setError(null);
    setStatusMessage("已断开钱包连接");
    setDepositAmount("");
    setIsDepositing(false);
    setIsClaiming(false);
    setIsFetching(false);
  }, []);
  const getInformation = useCallback(async () => {
    const provider = provideRef.current;
    if (!provider) {
      return;
    }

    try {
      setError(null);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        provider
      );
      const [
        ownerValue,
        totalBalanceValue,
        totalCountValue,
        isEqualValue,
        users,
      ] = await Promise.all([
        contract.owner(),
        contract.totalBalance(),
        contract.totalCount(),
        contract.isEqual(),
        contract.getUser(),
      ]);

      setContractInfo({
        owner: ethers.getAddress(ownerValue),
        totalBalance: ethers.formatEther(totalBalanceValue),
        totalCount: totalCountValue.toString(),
        isEqual: Boolean(isEqualValue),
      });

      const records = users.map((item: any) => {
        const addr = item.addr ?? item[0];
        const amount = item.amount ?? item[1];
        const time = item.time ?? item[2];

        return {
          addr: ethers.getAddress(addr),
          amount: ethers.formatEther(amount),
          time: Number(time),
        } satisfies ClaimRecord;
      });

      setClaimRecords(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);
  // 刷新账户及合约信息
  const getWallet = useCallback(
    async ({ account }: { account: string }) => {
      const provider = provideRef.current;
      if (!account || !provider) {
        setError("请先连接钱包");
        tartDisconnect();
        return;
      }

      try {
        setError(null);
        setAccount(account);
        setIsFetching(true);

        const [balanceValue, networkValue] = await Promise.all([
          provider.getBalance(account),
          provider.getNetwork(),
        ]);

        setBalance(ethers.formatEther(balanceValue));
        setNetwork(networkValue);
        await getInformation();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatusMessage(null);
      } finally {
        setIsFetching(false);
      }
    },
    [getInformation, tartDisconnect]
  );

  // 链接合约交互
  const connectContract = useCallback(async () => {
    if (!window.ethereum) {
      alert("请安装 MetaMask 钱包");
      return;
    }

    try {
      setIsConnecting(true);
      setStatusMessage(null);
      setError(null);
      if (!provideRef.current) {
        provideRef.current = new ethers.BrowserProvider(window.ethereum);
      }

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        setError("未返回任何账户");
        return;
      }

      const address = ethers.getAddress(accounts[0]);
      await getWallet({ account: address });
      setStatusMessage("钱包连接成功");
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      setStatusMessage(`连接失败：${message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [getWallet]);

  // 初始化获取账户信息
  const initWallet = useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    if (!provideRef.current) {
      provideRef.current = new ethers.BrowserProvider(window.ethereum);
    }

    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];

    if (!accounts || accounts.length === 0) {
      return;
    }

    const address = ethers.getAddress(accounts[0]);
    await getWallet({ account: address });
  }, [getWallet]);

  const handleDeposit = useCallback(async () => {
    const provider = provideRef.current;

    if (!provider || !account) {
      setError("请先连接钱包");
      return;
    }

    const amountText = depositAmount.trim();
    if (!amountText) {
      setError("请输入存入金额");
      return;
    }

    let amountInWei: bigint;
    try {
      amountInWei = ethers.parseEther(amountText);
    } catch (err) {
      setError("请输入合法的 ETH 金额");
      return;
    }

    if (amountInWei <= 0) {
      setError("金额必须大于 0");
      return;
    }

    try {
      setIsDepositing(true);
      setError(null);

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        signer
      );

      const tx = await contract.deposit({ value: amountInWei });
      await tx.wait();

      setDepositAmount("");
      await getWallet({ account });
      setStatusMessage("存入成功");
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      setStatusMessage(`存入失败：${message}`);
    } finally {
      setIsDepositing(false);
    }
  }, [account, depositAmount, getWallet]);
  const handleClaimRedPacket = useCallback(async () => {
    const provider = provideRef.current;

    if (!provider || !account) {
      setError("请先连接钱包");
      setStatusMessage(null);
      return;
    }

    try {
      setIsClaiming(true);
      setError(null);
      setStatusMessage("领取中...");

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        signer
      );

      const tx = await contract.getRedPacked();
      await tx.wait();

      setStatusMessage("领取红包成功");
      await getWallet({ account });
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      setStatusMessage(`领取失败：${message}`);
    } finally {
      setIsClaiming(false);
    }
  }, [account, getWallet]);
  useEffect(() => {
    if (!window.ethereum) {
      setError("请先安装钱包");
      return;
    }

    if (!window.ethereum.on) {
      setError("请升级钱包");
      return;
    }

    if (!provideRef.current) {
      provideRef.current = new ethers.BrowserProvider(window.ethereum);
    }

    void initWallet();

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        tartDisconnect();
        setError("请先连接钱包");
        return;
      }

      const address = ethers.getAddress(accounts[0]);
      void getWallet({ account: address });
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [getWallet, initWallet, tartDisconnect]);

  const isConnected = useMemo(() => Boolean(account), [account]);

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="state-pill">ethers.js</div>
        <h1>使用 ethers.js 连接钱包</h1>
        <p>
          连接浏览器钱包，查看账户基础信息，并直接通过 ethers.js
          读取合约的核心状态。
        </p>

        <div className="action-row">
          <button
            type="button"
            className="primary-btn"
            onClick={connectContract}
            disabled={isConnecting}
          >
            {isConnecting ? "连接中..." : isConnected ? "重新连接" : "连接钱包"}
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={tartDisconnect}
            disabled={!isConnected}
          >
            断开连接
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={handleClaimRedPacket}
            disabled={!isConnected || isClaiming || isFetching}
          >
            {isClaiming ? "领取中..." : "领取红包"}
          </button>
        </div>

        {error ? <div className="error-box">{error}</div> : null}
        {statusMessage ? (
          <div className="state-pill" style={{ marginTop: "1rem" }}>
            {statusMessage}
          </div>
        ) : null}

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
              disabled={isDepositing}
            />
            <button
              type="button"
              className="primary-btn"
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount.trim()}
            >
              {isDepositing ? "存入中..." : "存入金额"}
            </button>
          </div>
        ) : null}

        <div className="info-grid">
          <div className="info-card">
            <h2>钱包信息</h2>
            {isConnected ? (
              <div className="data-list">
                <div className="data-item">
                  <span>账户地址</span>
                  <strong title={account ?? ""}>
                    {formatAddress(account)}
                  </strong>
                </div>
                <div className="data-item">
                  <span>当前网络</span>
                  <strong>{describeNetwork(network)}</strong>
                </div>
                <div className="data-item">
                  <span>账户余额</span>
                  <strong>{`${formatEth(balance)} ETH`}</strong>
                </div>
              </div>
            ) : (
              <p>请先连接钱包以展示账户详情。</p>
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
                      {formatAddress(CONTRACT_ADDRESS)}
                    </strong>
                  </div>
                  <div className="data-item">
                    <span>Owner</span>
                    <strong title={contractInfo.owner}>
                      {formatAddress(contractInfo.owner)}
                    </strong>
                  </div>
                  <div className="data-item">
                    <span>总余额</span>
                    <strong>{`${formatEth(
                      contractInfo.totalBalance
                    )} ETH`}</strong>
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
                <p>{isFetching ? "正在读取合约信息..." : "暂无合约数据"}</p>
              )
            ) : (
              <p>连接钱包后即可获取合约状态。</p>
            )}
          </div>

          <div className="info-card">
            <h2>领取记录</h2>
            {isConnected ? (
              isFetching ? (
                <p>正在读取领取记录...</p>
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
                          {formatAddress(record.addr)}
                        </strong>
                      </div>
                      <div className="data-item">
                        <span>领取金额</span>
                        <strong>{`${formatEth(record.amount)} ETH`}</strong>
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
