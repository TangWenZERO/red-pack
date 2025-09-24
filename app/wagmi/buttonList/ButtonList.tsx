"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
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
import { wagmiConfig } from "@/app/utils/wagmiConfig";

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
  onClaimSuccess?: () => void;
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
  // 等待交易被打包到区块，然后返回交易收据的钩子
  const { isLoading, isError, isSuccess } = useWaitForTransactionReceipt({
    hash: pendingHash,
  });
  console.log("isSuccess", isSuccess);
  // if (isSuccess) {
  //   onClaimSuccess?.();
  // }
  const isConfirming = isLoading;
  useEffect(() => {
    if (isSuccess) {
      console.log("请求");
      onClaimSuccess?.();
    }
  }, [isSuccess]);

  // console.log("result:", result);

  // console.log("accountStatus:", accountStatus);

  // 当交易确认完成后执行的操作
  // useEffect(() => {
  //   if (result.isSuccess) {
  //     setStatusMessage("交易已确认");
  //     // 交易成功确认后调用 onClaimSuccess 刷新数据
  //     onClaimSuccess?.();
  //     // 清除交易状态
  //     setPendingHash(undefined);
  //   }

  //   if (result.isError) {
  //     setErrorMessage("交易失败");
  //     setStatusMessage(null);
  //     setPendingHash(undefined);
  //   }
  // }, [result.isSuccess, result.isError, onClaimSuccess]);

  // 领取红包
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
      await waitForTransactionReceipt(wagmiConfig, { hash });
      onClaimSuccess?.();
      // setPendingHash(hash);
    } catch (err) {
      const message = extractErrorMessage(err);
      setErrorMessage(message);
      setStatusMessage(`领取失败：${message}`);
    }
  }, [address, isConnected, writeContractAsync]);
  // 清空红包
  const handleClear = useCallback(async () => {
    if (!isConnected || !address) {
      setErrorMessage("请先连接钱包");
      setStatusMessage(null);
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: address,
        abi: contractAbi,
        functionName: "clear",
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      onClaimSuccess?.();
    } catch (error) {}
  }, []);
  // 存入红包
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
      await waitForTransactionReceipt(wagmiConfig, { hash });
      onClaimSuccess?.();
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
          onClick={handleClaim}
          disabled={!isConnected || isWritePending || Boolean(pendingHash)}
        >
          {isWritePending || pendingHash ? "领取中..." : "领取红包"}
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleClear}
          disabled={!isConnected || isWritePending || Boolean(pendingHash)}
        >
          清空红包
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
    </>
  );
}
