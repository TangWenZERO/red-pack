"use client";
import styles from "./style.module.css";
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { shortAddress, trimValue, formatTimestamp } from "@/app/utils/utils";
import redArtifact from "@/app/abi/Red.json";
import { useMemo } from "react";
import { Abi, formatEther } from "viem";
import BigNumber from "bignumber.js";
const contractAbi = (redArtifact as { abi: Abi }).abi;
import { CONTRACT_ADDRESS } from "@/app/utils/utils";
interface GetUserResult {
  addr: string;
  time: number;
  amount: number;
}
const InformationEle = () => {
  const { address, chainId, status, isConnected } = useAccount();
  const { data } = useBalance({
    address: address,
    query: { enabled: Boolean(address) },
  });
  const {
    data: result,
    isLoading,
    isError,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "owner",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "totalBalance",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "totalCount",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "isEqual",
      },
      {
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "getUser",
      },
    ],
    query: { enabled: Boolean(address) },
  });

  const contractInfo = useMemo(() => {
    if (result) {
      const [owner, totalBalance, totalCount, isEqual, getUser] = result;
      return {
        owner: (owner.result as string) ?? "",
        totalBalance:
          typeof totalBalance.result === "bigint"
            ? totalBalance.result
            : totalBalance.result !== null && totalBalance.result !== undefined
            ? (totalBalance.result as bigint)
            : 0n,
        totalCount: Number(totalCount.result) ?? 0,
        isEqual: Boolean(isEqual.result) ?? false,
        getUser: (getUser.result as GetUserResult[]) ?? [],
      };
    }
    return {
      owner: "",
      totalBalance: 0n,
      totalCount: 0,
      isEqual: false,
      getUser: [],
    };
  }, [result]);

  return (
    <div className={styles.infoGrid}>
      <div className={styles.infoCard}>
        <h2>钱包信息</h2>
        {isConnected && address ? (
          <div className={styles.dataList}>
            <div className={styles.dataItem}>
              <span>账户地址</span>
              <strong title={address}>{shortAddress(address)}</strong>
            </div>
            <div className={styles.dataItem}>
              <span>当前网络</span>
              <strong>{chainId}</strong>
            </div>
            <div className={styles.dataItem}>
              <span>账户余额</span>
              <strong>{`${trimValue(data?.formatted ?? null)} ETH`}</strong>
            </div>
          </div>
        ) : (
          <p>连接后可查看当前账户信息。</p>
        )}
      </div>

      <div className={styles.infoCard}>
        <h2>合约信息</h2>
        {isConnected ? (
          contractInfo ? (
            <div className={styles.dataList}>
              <div className={styles.dataItem}>
                <span>合约地址</span>
                <strong title={CONTRACT_ADDRESS}>
                  {shortAddress(CONTRACT_ADDRESS)}
                </strong>
              </div>
              <div className={styles.dataItem}>
                <span>Owner</span>
                <strong title={contractInfo.owner}>
                  {shortAddress(contractInfo.owner)}
                </strong>
              </div>
              <div className={styles.dataItem}>
                <span>总余额</span>
                <strong>{`${formatEther(
                  contractInfo.totalBalance
                )} ETH`}</strong>
              </div>
              <div className={styles.dataItem}>
                <span>红包数量</span>
                <strong>{contractInfo.totalCount}</strong>
              </div>
              <div className={styles.dataItem}>
                <span>等额红包</span>
                <strong>{contractInfo.isEqual ? "是" : "否"}</strong>
              </div>
            </div>
          ) : (
            <p>
              {isLoading ? "正在读取合约信息..." : isError || "暂无合约数据"}
            </p>
          )
        ) : (
          <p>wagmi 会在连接后自动读取合约状态。</p>
        )}
      </div>

      <div className={styles.infoCard}>
        <h2>领取记录</h2>
        {isConnected ? (
          isLoading ? (
            <p>正在读取领取记录...</p>
          ) : contractInfo.getUser.length > 0 ? (
            <div className={styles.dataList}>
              {contractInfo.getUser.map((record, index) => (
                <div
                  className={styles.claimEntry}
                  key={`${record.addr}-${record.time}-${index}`}
                >
                  <div className={styles.dataItem}>
                    <span>序号</span>
                    <strong>{index + 1}</strong>
                  </div>
                  <div className={styles.dataItem}>
                    <span>领取人</span>
                    <strong title={record.addr}>
                      {shortAddress(record.addr)}
                    </strong>
                  </div>
                  <div className={styles.dataItem}>
                    <span>领取金额</span>
                    <strong>{`${record.amount} ETH`}</strong>
                  </div>
                  <div className={styles.dataItem}>
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
  );
};
export default InformationEle;
