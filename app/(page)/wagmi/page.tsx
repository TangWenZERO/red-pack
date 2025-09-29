"use client";
import { useCallback, useMemo, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import Container from "./container";
import { wagmiConfig } from "@/app/utils/wagmiConfig";

// 1. 初始化配置
// const wagmiConfig = createConfig(
//   getDefaultConfig({
//     chains: [hardhat],
//     transports: {
//       [hardhat.id]: http(
//         hardhat.rpcUrls.default.http[0] ?? "http://127.0.0.1:8545"
//       ),
//     },
//     walletConnectProjectId: projectId,
//     appName: "Your App Name",
//     appDescription: "Your App Description",
//     appUrl: "https://family.co", // your app's url
//     appIcon: "https://family.co/logo.png",
//   })
// );

const AB = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
export default function WagmiWalletPage() {
  return (
    <AB>
      <Container />
    </AB>
  );
}
