"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, type Connector } from "wagmi";
import { BaseError } from "viem";
import LinkButton from "./LinkBtn";
// import { createPortal } from "react-dom";
// import styles from "./styles.module.css";

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

export interface WagmiWalletActionsProps {
  onConnectSuccess?: (payload: {
    address: string;
    connector: Connector;
    chainId?: number;
  }) => void | Promise<void>;
  onClaim?: () => void | Promise<void>;
  onClaimError?: (error: unknown) => void;
  claimDisabled?: boolean;
  claimLoading?: boolean;
}

export default function WagmiWalletActions({
  onConnectSuccess,
  claimLoading,
}: WagmiWalletActionsProps) {
  // 获取当前账户信息
  const { address, chain } = useAccount();
  // 获取链接账户信息的hooks
  const {
    connectAsync,
    connectors,
    isPending: isConnectPending,
  } = useConnect();

  console.log("====", connectors);
  const [isClient, setIsClient] = useState(true);
  const [isClaimingInternal, setIsClaimingInternal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 用于解决 hydration 问题
  useEffect(() => {
    setIsClient(true);
  }, []);
  // 选择钱包进行连接
  const performConnect = useCallback(
    async (connector: Connector) => {
      try {
        setStatusMessage(`正在连接 ${connector.name}...`);
        setErrorMessage(null);
        const result = await connectAsync({ connector });
        console.log("result", result);
        // const connectedAddress =
        //   result.account?.address ?? address ?? result.accounts?.[0] ?? "";
        // if (connectedAddress) {
        //   await onConnectSuccess?.({
        //     address: connectedAddress,
        //     connector,
        //     chainId: result.chain?.id ?? chain?.id,
        //   });
        // }
        setStatusMessage("钱包连接成功");
        setIsModalOpen(false);
      } catch (err) {
        const message = extractErrorMessage(err);
        setErrorMessage(message);
        setStatusMessage(`连接失败：${message}`);
      }
    },
    [address, chain?.id, connectAsync, onConnectSuccess]
  );

  //
  //
  // const [isModalOpen, setIsModalOpen] = useState(false);
  //
  // const [isClaimingInternal, setIsClaimingInternal] = useState(false);

  // const closeModal = useCallback(() => {
  //   setIsModalOpen(false);
  // }, []);

  // const handleConnect = useCallback(() => {
  //   // if (readyConnectors.length === 0) {
  //   //   setStatusMessage("暂无可用钱包连接器");
  //   //   setErrorMessage(null);
  //   //   return;
  //   // }

  //   // if (readyConnectors.length === 1) {
  //   //   void performConnect(readyConnectors[0]!);
  //   //   return;
  //   // }

  //   setStatusMessage(null);
  //   setErrorMessage(null);
  //   setIsModalOpen(true);
  // }, [performConnect]);

  // const handleDisconnect = useCallback(async () => {
  //   if (accountStatus !== "connected") {
  //     setStatusMessage("当前没有连接的钱包");
  //     setErrorMessage(null);
  //     return;
  //   }

  //   try {
  //     setStatusMessage("断开连接中...");
  //     setErrorMessage(null);
  //     await disconnectAsync();
  //     setStatusMessage("已断开钱包连接");
  //     setIsModalOpen(false);
  //   } catch (err) {
  //     const message = extractErrorMessage(err);
  //     setErrorMessage(message);
  //     setStatusMessage(`断开失败：${message}`);
  //   }
  // }, [accountStatus, disconnectAsync]);

  // const handleClaim = useCallback(async () => {
  //   if (!onClaim) {
  //     setErrorMessage("未提供领取红包的方法");
  //     setStatusMessage(null);
  //     return;
  //   }

  //   try {
  //     setIsClaimingInternal(true);
  //     setStatusMessage("领取中...");
  //     setErrorMessage(null);
  //     await onClaim();
  //     setStatusMessage("领取请求已发送");
  //   } catch (err) {
  //     const message = extractErrorMessage(err);
  //     setErrorMessage(message);
  //     setStatusMessage(`领取失败：${message}`);
  //     onClaimError?.(err);
  //   } finally {
  //     setIsClaimingInternal(false);
  //   }
  // }, [onClaim, onClaimError]);

  // 只在客户端渲染时显示真实状态
  // const connectButtonText = !isClient
  //   ? "链接钱包" // 服务器端默认显示
  //   : isConnected
  //   ? "已连接"
  //   : isConnecting
  //   ? "连接中..."
  //   : "链接钱包";

  const isClaimInFlight = claimLoading ?? isClaimingInternal;
  return (
    <>
      <LinkButton />
      {/* <div className={styles.buttonList}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => {
            // setIsModalOpen(true);
          }}
          disabled={isConnectPending}
        >
          链接钱包
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          disabled={accountStatus !== "connected" || isDisconnectPending}
        >
          {isDisconnectPending ? "断开中..." : "断开链接"}
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={
            claimDisabled || accountStatus !== "connected" || isClaimInFlight
          }
        >
          {isClaimInFlight ? "领取中..." : "领取红包"}
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

      {isClient && isModalOpen
        ? createPortal(
            <div
              className={styles.modalOverlay}
              onClick={() => {
                setIsModalOpen(false);
              }}
            >
              <div
                className={styles.modalContent}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle}>选择要连接的钱包</h3>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={() => {
                      setIsModalOpen(false);
                    }}
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
        : null} */}
    </>
  );
}
