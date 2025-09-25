"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { wagmiConfig } from "@/app/utils/wagmiConfig";
import { reconnect } from "wagmi/actions";
import { useEffect } from "react";

// 创建一个单例 QueryClient 实例
let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  }
  return queryClient;
}
export default function WagmiWalletLaypout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    reconnect(wagmiConfig);
  }, []);
  const client = getQueryClient();
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={client}>
        <ConnectKitProvider theme="midnight">{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
