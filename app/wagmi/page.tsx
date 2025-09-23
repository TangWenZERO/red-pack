"use client";
import { useCallback, useMemo, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected, metaMask, safe, walletConnect } from "wagmi/connectors";
import { hardhat } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiButtonList } from "@/app/wagmi/buttonList";
import styles from "./page.module.css";
import InformationEle from "@/app/wagmi/information";
const projectId = "<WALLETCONNECT_PROJECT_ID>";

const wagmiConfig = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http(
      hardhat.rpcUrls.default.http[0] ?? "http://127.0.0.1:8545"
    ),
  },
  connectors: [injected(), walletConnect({ projectId }), metaMask(), safe()],
});

function WagmiPageInner() {
  const [txError, setTxError] = useState<string | null>(null);

  return (
    <main className={styles.pageShell}>
      <section className={styles.panel}>
        <div className={styles.statePill}>wagmi</div>
        <h1>wagmi 钱包集成演示</h1>
        <p>
          使用 wagmi 提供的 hooks 来管理钱包连接状态，并通过 React Query
          自动维护数据缓存。
        </p>

        <div className={styles.actionRow}>
          <WagmiButtonList />
        </div>

        {txError ? <div className={styles.errorBox}>{txError}</div> : null}

        <InformationEle />
      </section>
    </main>
  );
}

export default function WagmiWalletPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiPageInner />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
