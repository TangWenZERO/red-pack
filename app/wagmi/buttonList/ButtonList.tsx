"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  type Connector,
} from "wagmi";
import { BaseError, parseEther, type Abi } from "viem";
import redArtifact from "@/app/abi/Red.json";
import styles from "./ButtonList.module.css";
// 在前端开发（React）里，createPortal 是 React 提供的一个 API，用来把 子组件渲染到当前组件 DOM 树以外的地方
import { createPortal } from "react-dom";

import { CONTRACT_ADDRESS } from "@/app/utils/utils";
const contractAbi = (redArtifact as { abi: Abi }).abi;

const extractErrorMessage = (err: unknown) => {
  if (!err) return "未知错误";
  if (typeof err === "string") return err;
  if (err instanceof BaseError) {
    return (
      err.shortMessage ||
      err.message ||
      (err.cause &&
      typeof err.cause === "object" &&
      err.cause !== null &&
      "shortMessage" in err.cause
        ? (err.cause as { shortMessage?: string }).shortMessage
        : undefined) ||
      (err.cause &&
      typeof err.cause === "object" &&
      err.cause !== null &&
      "message" in err.cause
        ? (err.cause as { message?: string }).message
        : undefined) ||
      "未知错误"
    );
  }
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "object") {
    const withMessage = err as { message?: string; error?: string };
    return withMessage.message || withMessage.error || JSON.stringify(err);
  }
  return String(err);
};

type WagmiButtonListProps = {
  onClaimSuccess?: () => void | Promise<void>;
};

export default function WagmiButtonList({
  onClaimSuccess,
}: WagmiButtonListProps) {
  const [txError, setTxError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  // 链接钱包的状态信息
  const { address, status: accountStatus, isConnected } = useAccount();
  // 账户链接钱包
  const {
    connectAsync,
    connectors,
    isPending: isConnectPending,
  } = useConnect();
  // 钱包断开链接的hooks
  const { disconnectAsync, isPending: isDisconnectPending } = useDisconnect();
  // 在合约上面执行写入的功能
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 等待交易被打包到区块，然后返回交易收据的钩子
  const result = useWaitForTransactionReceipt({
    hash: pendingHash,
  });
  const isConfirming = result.isLoading;

  console.log("result:", result);

  console.log("accountStatus:", accountStatus);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  /** 链接钱包 */
  const performConnect = useCallback(
    async (connector: Connector) => {
      setIsModalOpen(false);
      try {
        setStatusMessage(`正在连接 ${connector.name}...`);
        setErrorMessage(null);
        await connectAsync({ connector });
        setStatusMessage("钱包连接成功");
        setIsModalOpen(false);
      } catch (err) {
        const message = extractErrorMessage(err);
        setErrorMessage(message);
        setStatusMessage(`连接失败：${message}`);
      }
    },
    [connectAsync]
  );
  /** 弹窗 */
  const openModal = useCallback(() => {
    setStatusMessage(null);
    setErrorMessage(null);
    setIsModalOpen(true);
    console.log("connectors:", connectors);
  }, []);

  // 断开连接钱包
  const handleDisconnect = useCallback(async () => {
    if (!isConnected) {
      setStatusMessage("当前没有连接的钱包");
      setErrorMessage(null);
      return;
    }

    try {
      setStatusMessage("断开连接中...");
      setErrorMessage(null);
      await disconnectAsync();
      setStatusMessage("已断开钱包连接");
      setIsModalOpen(false);
    } catch (err) {
      const message = extractErrorMessage(err);
      setErrorMessage(message);
      setStatusMessage(`断开失败：${message}`);
    }
  }, [disconnectAsync, isConnected]);

  const handleClaim = useCallback(async () => {
    if (!isConnected || !address) {
      setErrorMessage("请先连接钱包");
      setStatusMessage(null);
      return;
    }

    try {
      setStatusMessage("领取中...");
      setErrorMessage(null);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "getRedPacked",
      });
      setPendingHash(hash);
    } catch (err) {
      const message = extractErrorMessage(err);
      setErrorMessage(message);
      setStatusMessage(`领取失败：${message}`);
    }
  }, [address, isConnected, writeContractAsync]);
  const handleDeposit = useCallback(async () => {
    if (!address) {
      setErrorMessage("请先连接钱包");
      return;
    }

    const amountText = depositAmount.trim();
    if (!amountText) {
      setErrorMessage("请输入存入金额");
      return;
    }

    let amountInWei: bigint;
    try {
      amountInWei = parseEther(amountText);
    } catch (err) {
      setErrorMessage("请输入合法的 ETH 金额");
      return;
    }

    if (amountInWei <= 0) {
      setErrorMessage("金额必须大于 0");
      return;
    }

    try {
      setErrorMessage(null);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "deposit",
        value: amountInWei,
      });
      setDepositAmount("");
      setStatusMessage("存入成功");
      setPendingHash(hash);
    } catch (error) {
      if (error instanceof BaseError) {
        setErrorMessage(error.shortMessage ?? error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(String(error));
      }
    }
  }, [address, depositAmount, writeContractAsync]);
  return (
    <>
      <div className={styles.buttonList}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={openModal}
          disabled={isConnectPending}
        >
          {isConnected ? "已连接" : isConnectPending ? "连接中..." : "链接钱包"}
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={handleDisconnect}
          disabled={!isConnected || isDisconnectPending}
        >
          {isDisconnectPending ? "断开中..." : "断开链接"}
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleClaim}
          disabled={!isConnected || isWritePending || Boolean(pendingHash)}
        >
          {isWritePending || pendingHash ? "领取中..." : "领取红包"}
        </button>

        {statusMessage ? (
          <div className={styles.statusPill} style={{ marginTop: "1rem" }}>
            {statusMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className={styles.errorBox}>{errorMessage}</div>
        ) : null}
      </div>
      <div className={styles.depositRow}>
        <input
          className={styles.inputField}
          type="number"
          min="0"
          step="0.0001"
          placeholder="请输入存入的 ETH 数量"
          value={depositAmount}
          onChange={(event) => setDepositAmount(event.target.value)}
          disabled={isWritePending || isConfirming}
        />
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleDeposit}
          disabled={
            isWritePending || isConfirming || depositAmount.trim().length === 0
          }
        >
          {isWritePending || isConfirming ? "存入中..." : "存入金额"}
        </button>
      </div>

      {isModalOpen
        ? createPortal(
            <div className={styles.modalOverlay} onClick={closeModal}>
              <div
                className={styles.modalContent}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle}>选择要连接的钱包</h3>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={closeModal}
                    aria-label="关闭"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.connectorList}>
                  {connectors.length === 0 ? (
                    <p className={styles.connectorEmpty}>暂无可用连接器</p>
                  ) : (
                    connectors.map((connector) => (
                      <button
                        key={connector.uid}
                        type="button"
                        className={styles.connectorBtn}
                        onClick={() => void performConnect(connector)}
                        disabled={isConnectPending}
                      >
                        <span className={styles.connectorName}>
                          {connector.name}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
