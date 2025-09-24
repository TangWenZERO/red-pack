import { useEffect, useMemo, useState } from "react";
import styles from "./style.module.css";
import { Connector, useAccount, useConnect } from "wagmi";
import { shortAddress } from "@/app/utils/utils";
import { createPortal } from "react-dom";

export default function LinkButton() {
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address, isConnected, isDisconnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  useEffect(() => {
    setIsClient(true);
  }, []);
  // 账户信息
  const accountInfo = useMemo(() => {
    const data = {
      address: "",
      text: "链接钱包",
      isConnected: false,
    };
    if (!isClient || isDisconnected) {
      return data;
    }
    if (isConnected) {
      data.address = shortAddress(address);
      data.isConnected = true;
    }
    return data;
  }, [isClient, address, isConnected, isDisconnected]);
  // 链接
  const performConnect = (connector: Connector) => {
    connectAsync({ connector });
  };
  console.log(connectors);
  return (
    <>
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={() => {
          if (accountInfo?.isConnected) {
            return;
          } else {
            setIsModalOpen(true);
          }
        }}
      >
        {accountInfo?.isConnected
          ? accountInfo.address
          : accountInfo?.text ?? "链接钱包"}
      </button>
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
        : null}
    </>
  );
}
