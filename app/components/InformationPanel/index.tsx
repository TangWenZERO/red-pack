"use client";
import { ethers } from "ethers";
import type { ReactNode } from "react";
import styles from "./styles.module.css";
import { formatTimestamp } from "../../utils/utils";

export interface WalletInfoDisplay {
  address?: string | null;
  network?: string | null;
  balance?: string | null;
  addressLabel?: string;
  networkLabel?: string;
  balanceLabel?: string;
}

export interface ContractInfoDisplay {
  contractAddress?: string | null;
  owner?: string | null;
  totalBalance?: string | null;
  totalCount?: string | null;
  isEqual?: boolean | null;
  addressLabel?: string;
  ownerLabel?: string;
  balanceLabel?: string;
  countLabel?: string;
  equalLabel?: string;
}

export interface ClaimRecordDisplay {
  addr: string;
  amount: string;
  time: string;
  key?: ReactNode;
}

export interface InformationPanelProps {
  walletInfo?: WalletInfoDisplay | null;
  contractInfo?: ContractInfoDisplay | null;
  claimRecords?: ClaimRecordDisplay[];
  isConnected?: boolean;
  contractLoading?: boolean;
  contractError?: string | null;
  claimLoading?: boolean;
  claimError?: string | null;
  walletEmptyText?: string;
  contractEmptyText?: string;
  claimEmptyText?: string;
  headings?: {
    wallet?: string;
    contract?: string;
    claims?: string;
  };
}

const FALLBACK_TEXT = "-";

const defaultWalletLabels = {
  address: "账户地址",
  network: "当前网络",
  balance: "账户余额",
};

const defaultContractLabels = {
  address: "合约地址",
  owner: "Owner",
  balance: "总余额",
  count: "红包数量",
  equal: "等额红包",
};

export default function InformationPanel({
  walletInfo,
  contractInfo,
  claimRecords,
  isConnected,
  contractLoading,
  contractError,
  claimLoading,
  claimError,
  walletEmptyText = "连接后可查看当前账户信息。",
  contractEmptyText = "暂无合约数据",
  claimEmptyText = "暂无领取记录。",
  headings,
}: InformationPanelProps) {
  const walletRows = [
    {
      label: walletInfo?.addressLabel ?? defaultWalletLabels.address,
      value: walletInfo?.address ?? FALLBACK_TEXT,
    },
    {
      label: walletInfo?.networkLabel ?? defaultWalletLabels.network,
      value: walletInfo?.network ?? FALLBACK_TEXT,
    },
    {
      label: walletInfo?.balanceLabel ?? defaultWalletLabels.balance,
      value: walletInfo?.balance ?? FALLBACK_TEXT,
    },
  ];

  const contractRows = [
    {
      label: contractInfo?.addressLabel ?? defaultContractLabels.address,
      value: contractInfo?.contractAddress ?? FALLBACK_TEXT,
    },
    {
      label: contractInfo?.ownerLabel ?? defaultContractLabels.owner,
      value: contractInfo?.owner ?? FALLBACK_TEXT,
    },
    {
      label: contractInfo?.balanceLabel ?? defaultContractLabels.balance,
      value: contractInfo?.totalBalance ?? FALLBACK_TEXT,
    },
    {
      label: contractInfo?.countLabel ?? defaultContractLabels.count,
      value: contractInfo?.totalCount ?? FALLBACK_TEXT,
    },
    {
      label: contractInfo?.equalLabel ?? defaultContractLabels.equal,
      value:
        contractInfo?.isEqual === undefined || contractInfo?.isEqual === null
          ? FALLBACK_TEXT
          : contractInfo.isEqual
          ? "是"
          : "否",
    },
  ];

  return (
    <div className={styles.infoGrid}>
      <div className={styles.infoCard}>
        <h2 className={styles.sectionTitle}>
          {headings?.wallet ?? "钱包信息"}
        </h2>
        {isConnected && walletInfo ? (
          <div className={styles.dataList}>
            {walletRows.map(({ label, value }) => (
              <div key={label} className={styles.dataItem}>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.muted}>{walletEmptyText}</p>
        )}
      </div>

      <div className={styles.infoCard}>
        <h2 className={styles.sectionTitle}>
          {headings?.contract ?? "合约信息"}
        </h2>
        {contractLoading ? (
          <p className={styles.muted}>正在读取合约信息...</p>
        ) : contractError ? (
          <p className={`${styles.muted} ${styles.errorText}`}>
            {contractError}
          </p>
        ) : contractInfo ? (
          <div className={styles.dataList}>
            {contractRows.map(({ label, value }) => (
              <div key={label} className={styles.dataItem}>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.muted}>{contractEmptyText}</p>
        )}
      </div>

      <div className={styles.infoCard}>
        <h2 className={styles.sectionTitle}>
          {headings?.claims ?? "领取记录"}
        </h2>
        {claimLoading ? (
          <p className={styles.muted}>正在读取领取记录...</p>
        ) : claimError ? (
          <p className={`${styles.muted} ${styles.errorText}`}>{claimError}</p>
        ) : claimRecords && claimRecords.length > 0 ? (
          <div className={styles.dataList}>
            {claimRecords.map((record, index) => (
              <div
                key={`${record.addr}-${record.time}-${index}`}
                className={styles.claimEntry}
              >
                <div className={styles.dataItem}>
                  <span>序号</span>
                  <strong>{index + 1}</strong>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.label}>领取人</span>
                  <span className={styles.value}>{record.addr}</span>
                </div>
                <div className={styles.dataItem}>
                  <span className={styles.label}>领取金额</span>
                  <span className={styles.value}>{record.amount}</span>
                </div>

                <div className={styles.dataItem}>
                  <span className={styles.label}>时间</span>
                  <span className={styles.value}>
                    {formatTimestamp(Number(record.time))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.muted}>{claimEmptyText}</p>
        )}
      </div>
    </div>
  );
}
