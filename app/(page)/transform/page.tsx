"use client";
import { useCallback, useMemo, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { wagmiConfig } from "@/app/utils/wagmiConfig";
import ContainerMain from "./main";
const Transfromer = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">
          <ContainerMain />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
export default Transfromer;
