"use client";

import { useCallback, useState } from "react";
import { message } from "antd";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { useAccount } from "wagmi";
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
  onActionComplete?: () => Promise<void> | void;
  owner: string;
};

type ActionType = "claim" | "clear" | "deposit";

const actionLabels: Record<ActionType, string> = {
  claim: "领取红包",
  clear: "清空红包",
  deposit: "存入金额",
};

export default function WagmiButtonList({
  onActionComplete,
  owner,
}: WagmiButtonListProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [depositAmount, setDepositAmount] = useState("");
  const { address, isConnected } = useAccount();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const isProcessing = activeAction !== null;
  const requireConnection = !isConnected || !address;

  const runTransaction = useCallback(
    async (
      action: ActionType,
      trigger: () => Promise<`0x${string}`>,
      successMessage: string,
      afterSuccess?: () => void
    ) => {
      if (requireConnection) {
        setErrorMessage("请先连接钱包");
        setStatusMessage(null);
        return;
      }

      setActiveAction(action);
      setStatusMessage(`${actionLabels[action]}提交中...`);
      setErrorMessage(null);

      try {
        const hash = await trigger();
        setStatusMessage("交易确认中...");
        await waitForTransactionReceipt(wagmiConfig, { hash });
        afterSuccess?.();
        setStatusMessage(successMessage);
        if (onActionComplete) {
          await onActionComplete();
        }
      } catch (err: Error | any) {
        const message = extractErrorMessage(err);
        console.error("message:", err);
        messageApi.error(err);
        setErrorMessage(message);
        setStatusMessage(`${actionLabels[action]}失败：${message}`);
      } finally {
        setActiveAction(null);
      }
    },
    [onActionComplete, requireConnection]
  );

  const handleClaim = useCallback(() => {
    void runTransaction(
      "claim",
      () =>
        writeContract(wagmiConfig, {
          address: CONTRACT_ADDRESS,
          abi: contractAbi,
          functionName: "getRedPacked",
        }),
      "领取成功"
    );
  }, [runTransaction]);

  const handleClear = useCallback(() => {
    void runTransaction(
      "clear",
      () =>
        writeContract(wagmiConfig, {
          address: CONTRACT_ADDRESS,
          abi: contractAbi,
          functionName: "clearRedPacked",
        }),
      "清空成功"
    );
  }, [runTransaction]);

  const handleDeposit = useCallback(async () => {
    if (requireConnection) {
      setErrorMessage("请先连接钱包");
      setStatusMessage(null);
      return;
    }

    const amountText = depositAmount.trim();
    if (!amountText) {
      setErrorMessage("请输入存入金额");
      setStatusMessage(null);
      return;
    }

    let amountInWei: bigint;
    try {
      amountInWei = parseEther(amountText);
    } catch {
      setErrorMessage("请输入合法的 ETH 金额");
      setStatusMessage(null);
      return;
    }

    if (amountInWei <= 0n) {
      setErrorMessage("金额必须大于 0");
      setStatusMessage(null);
      return;
    }

    await runTransaction(
      "deposit",
      () =>
        writeContract(wagmiConfig, {
          address: CONTRACT_ADDRESS,
          abi: contractAbi,
          functionName: "deposit",
          value: amountInWei,
        }),
      "存入成功",
      () => setDepositAmount("")
    );
  }, [depositAmount, requireConnection, runTransaction]);

  const claimLabel =
    activeAction === "claim" ? "领取中..." : actionLabels.claim;
  const clearLabel =
    activeAction === "clear" ? "清空中..." : actionLabels.clear;
  const depositLabel =
    activeAction === "deposit" ? "存入中..." : actionLabels.deposit;

  return (
    <>
      <div className={styles.buttonList}>
        {contextHolder}
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleClaim}
          disabled={requireConnection || isProcessing}
        >
          {claimLabel}
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleClear}
          disabled={requireConnection || isProcessing}
        >
          {clearLabel}
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
      {address === owner && (
        <div className={styles.depositRow}>
          <input
            className={styles.inputField}
            type="number"
            min="0"
            step="0.0001"
            placeholder="请输入存入的 ETH 数量"
            value={depositAmount}
            onChange={(event) => setDepositAmount(event.target.value)}
            disabled={isProcessing}
          />
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleDeposit}
            disabled={
              requireConnection ||
              isProcessing ||
              depositAmount.trim().length === 0
            }
          >
            {depositLabel}
          </button>
        </div>
      )}
    </>
  );
}
