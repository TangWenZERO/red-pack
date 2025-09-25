import { useCallback, useEffect, useMemo } from "react";
import styles from "./style.module.css";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { formatEther, type Abi } from "viem";
import { ConnectKitButton } from "connectkit";
import { InformationPanel } from "@/app/components";
import { CONTRACT_ADDRESS } from "@/app/utils/utils";
import contractAbi from "@/app/abi/Red.json";
import { WagmiButtonList } from "../buttonList";
const ABI = (contractAbi as { abi: Abi }).abi;

interface ClaimRecord {
  addr: string;
  amount: string;
  time: string;
}
const Container = () => {
  const { address, chain, isConnected } = useAccount();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
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
  const contractInfo = useMemo(
    () => ({
      contractAddress: CONTRACT_ADDRESS,
      owner: ownerData as string | undefined,
      totalBalance: totalBalanceData
        ? `${formatEther(totalBalanceData as bigint)} ETH`
        : undefined,
      totalCount: totalCountData ? totalCountData.toString() : undefined,
      isEqual: isEqualData as boolean | undefined,
    }),
    [isEqualData, ownerData, totalBalanceData, totalCountData]
  );

  type RawUser =
    | { addr: string; amount: bigint; time: bigint }
    | readonly [string, bigint, bigint];

  const claimRecords = useMemo<ClaimRecord[]>(() => {
    if (!Array.isArray(getUserData)) return [];

    return (getUserData as ReadonlyArray<RawUser>).map((item) => {
      // 解构元组或对象，统一处理
      let addr: string;
      let amount: bigint;
      let time: bigint;

      if (Array.isArray(item)) {
        [addr, amount, time] = item;
      } else {
        addr = (item as { addr: string; amount: bigint; time: bigint }).addr;
        amount = (item as { addr: string; amount: bigint; time: bigint })
          .amount;
        time = (item as { addr: string; amount: bigint; time: bigint }).time;
      }

      return {
        addr,
        amount: `${formatEther(amount)} ETH`,
        time: time.toString(),
      };
    });
  }, [getUserData]);

  const walletInfo = useMemo(
    () => ({
      address,
      network: chain?.name,
      balance: balanceData
        ? `${formatEther(balanceData.value)} ETH`
        : undefined,
    }),
    [address, balanceData, chain]
  );

  const refreshAllData = useCallback(async () => {
    const refetchers = [
      refetchTotalBalance,
      refetchOwner,
      refetchTotalCount,
      refetchIsEqual,
      refetchGetUser,
      refetchBalance,
    ].filter(Boolean) as Array<() => Promise<unknown>>;

    await Promise.allSettled(refetchers.map((refetch) => refetch()));
  }, [
    refetchBalance,
    refetchGetUser,
    refetchIsEqual,
    refetchOwner,
    refetchTotalBalance,
    refetchTotalCount,
  ]);
  // 当钱包连接状态改变时刷新数据
  useEffect(() => {
    if (isConnected) {
      void refreshAllData();
    }
  }, [isConnected, refreshAllData]);

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
            onActionComplete={refreshAllData}
            owner={contractInfo?.owner || ""}
          />
        </div>
        <InformationPanel
          walletInfo={walletInfo}
          contractInfo={contractInfo}
          claimRecords={claimRecords}
          isConnected={Boolean(address)}
        />
      </section>
    </main>
  );
};
export default Container;
