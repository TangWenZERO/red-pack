"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import styles from "./styles.module.css";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

const extractErrorMessage = (err: unknown) => {
  if (!err) return "未知错误";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const withMessage = err as { message?: string; error?: string };
    return withMessage.message || withMessage.error || JSON.stringify(err);
  }
  return String(err);
};

export interface EthersWalletActionsProps {
  onConnectSuccess?: (payload: {
    address: string;
    provider: ethers.BrowserProvider;
  }) => void | Promise<void>;
  onClaim?: (provider: ethers.BrowserProvider) => void | Promise<void>;
  onClaimError?: (error: unknown) => void;
  claimDisabled?: boolean;
  claimLoading?: boolean;
  connectButtonText?: string;
  disconnectButtonText?: string;
  claimButtonText?: string;
}

export default function EthersWalletActions({
  onConnectSuccess,
  onClaim,
  onClaimError,
  claimDisabled,
  claimLoading,
  connectButtonText = "链接钱包",
  disconnectButtonText = "断开连接",
  claimButtonText = "领取红包",
}: EthersWalletActionsProps) {
  const providerRef = useRef<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClaimingInternal, setIsClaimingInternal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !window?.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        return;
      }
      try {
        const normalized = ethers.getAddress(accounts[0]!);
        setAccount(normalized);
      } catch {
        setAccount(accounts[0] ?? null);
      }
    };

    (window.ethereum as any).on?.("accountsChanged", handleAccountsChanged);
    return () => {
      (window.ethereum as any)?.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, [isClient]);

  const isConnected = Boolean(account);
  const isClaimInFlight = claimLoading ?? isClaimingInternal;

  const ensureProvider = useCallback(async () => {
    if (providerRef.current) {
      return providerRef.current;
    }

    if (!window?.ethereum) {
      throw new Error("请先安装浏览器钱包");
    }

    const provider = new ethers.BrowserProvider(window.ethereum as any);
    providerRef.current = provider;
    return provider;
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setStatusMessage("连接中...");
      setErrorMessage(null);

      const provider = await ensureProvider();
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) {
        throw new Error("未返回任何账户");
      }

      const normalized = ethers.getAddress(accounts[0]!);
      setAccount(normalized);
      setStatusMessage("钱包连接成功");

      await onConnectSuccess?.({ address: normalized, provider });
    } catch (err) {
      const message = extractErrorMessage(err);
      setErrorMessage(message);
      setStatusMessage(`连接失败：${message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [ensureProvider, onConnectSuccess]);

  const handleDisconnect = useCallback(() => {
    providerRef.current = null;
    setAccount(null);
    setStatusMessage("已断开钱包连接");
    setErrorMessage(null);
  }, []);

  const handleClaim = useCallback(async () => {
    if (!onClaim) {
      setErrorMessage("未提供领取红包的方法");
      setStatusMessage(null);
      return;
    }

    try {
      const provider = providerRef.current;
      if (!provider) {
        setErrorMessage("请先连接钱包");
        setStatusMessage(null);
        return;
      }

      setIsClaimingInternal(true);
      setStatusMessage("领取中...");
      setErrorMessage(null);
      await onClaim(provider);
      setStatusMessage("领取请求已发送");
    } catch (err) {
      const message = extractErrorMessage(err);
      setErrorMessage(message);
      setStatusMessage(`领取失败：${message}`);
      onClaimError?.(err);
    } finally {
      setIsClaimingInternal(false);
    }
  }, [onClaim, onClaimError]);

  if (!isClient) {
    return null;
  }

  return (
    <div className={styles.buttonList}>
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? "连接中..." : isConnected ? "已连接" : connectButtonText}
      </button>
      <button
        type="button"
        className={styles.secondaryBtn}
        onClick={handleDisconnect}
        disabled={!isConnected}
      >
        {disconnectButtonText}
      </button>
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={handleClaim}
        disabled={!isConnected || claimDisabled || isClaimInFlight}
      >
        {isClaimInFlight ? "领取中..." : claimButtonText}
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
  );
}
