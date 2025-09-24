import { useEffect, useState } from "react";
import styles from "./style.module.css";
import { useAccount, useConnect, useReadContract, useBalance } from "wagmi";
import { formatEther } from "viem";
import { ConnectKitButton } from "connectkit";
import { InformationPanel } from "@/app/components";
import { CONTRACT_ADDRESS, formatTimestamp } from "@/app/utils/utils";
import contractAbi from "@/app/abi/Red.json";
import { WagmiButtonList } from "../buttonList";
const ABI = (contractAbi as { abi: any }).abi;

interface ClaimRecord {
  addr: string;
  amount: string;
  time: string;
}
const Container = () => {
  const [txError, setTxError] = useState<string | null>(null);
  const { address, chain, isConnected } = useAccount();
  const balance = useBalance({
    address,
  });
  console.log(chain);
  const [formattedData, setFormattedData] = useState({
    totalBalance: "0",
    owner: "",
    totalCount: "0",
    isEqual: false,
    getUser: [] as ClaimRecord[],
  });
  // 读取合约数据
  const { data: totalBalanceData, refetch: refetchTotalBalance } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "totalBalance",
    });

  const { data: ownerData, refetch: refetchOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "owner",
  });

  const { data: totalCountData, refetch: refetchTotalCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "totalCount",
  });

  const { data: isEqualData, refetch: refetchIsEqual } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "isEqual",
  });

  const { data: getUserData, refetch: refetchGetUser } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getUser",
  });

  // 格式化数据
  useEffect(() => {
    if (totalBalanceData) {
      setFormattedData((prev) => ({
        ...prev,
        totalBalance: `${formatEther(totalBalanceData as bigint)} ETH`,
      }));
    }
  }, [totalBalanceData]);

  useEffect(() => {
    if (ownerData !== undefined) {
      setFormattedData((prev) => ({
        ...prev,
        owner: ownerData as string,
      }));
    }
  }, [ownerData]);
  useEffect(() => {
    if (totalCountData) {
      setFormattedData((prev) => ({
        ...prev,
        totalCount: totalCountData.toString(),
      }));
    }
  }, [totalCountData]);

  useEffect(() => {
    if (isEqualData !== undefined) {
      setFormattedData((prev) => ({
        ...prev,
        isEqual: isEqualData as boolean,
      }));
    }
  }, [isEqualData]);
  useEffect(() => {
    if (getUserData !== undefined) {
      const formattedUserList = (getUserData as any[]).map((item) => {
        console.log(
          "item:",
          item.time,
          formatTimestamp(Number(item.time || item[2]))
        );
        return {
          addr: item?.addr || item[0],
          amount: `${formatEther(item.amount || item[1])} ETH`,
          time: `${item.time || item[2]}`,
        };
      });
      console.log("formattedUserList:", formattedUserList);
      setFormattedData((prev) => ({
        ...prev,
        getUser: formattedUserList,
      }));
    }
  }, [getUserData]);
  console.log("getUserData:", getUserData);
  // 刷新所有数据
  const refreshAllData = () => {
    console.log("888888");
    refetchTotalBalance();
    refetchOwner();
    refetchTotalCount();
    refetchIsEqual();
    refetchGetUser();
  };
  // 当钱包连接状态改变时刷新数据
  useEffect(() => {
    if (isConnected) {
      refreshAllData();
    }
  }, [isConnected]);

  return (
    <main className={styles.pageShell}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <ConnectKitButton label="链接钱包" />
        </div>
        <div className={styles.statePill}>wagmi</div>
        <h1>wagmi 钱包集成演示</h1>
        <p>
          使用 wagmi 提供的 hooks 来管理钱包连接状态，并通过 React Query
          自动维护数据缓存。
        </p>
        <div>
          <WagmiButtonList
            onClaimSuccess={() => {
              refreshAllData();
            }}
          />
        </div>
        {txError ? <div className={styles.errorBox}>{txError}</div> : null}

        <InformationPanel
          walletInfo={{
            address: address,
            network: chain?.name,
            balance: balance.data
              ? `${formatEther(balance.data.value)} ETH`
              : undefined,
          }}
          contractInfo={{
            contractAddress: CONTRACT_ADDRESS,
            owner: formattedData.owner,
            totalBalance: formattedData.totalBalance,
            totalCount: formattedData.totalCount,
            isEqual: formattedData.isEqual,
          }}
          claimRecords={formattedData.getUser || []}
          isConnected={address !== null}
        />
      </section>
    </main>
  );
};
export default Container;
