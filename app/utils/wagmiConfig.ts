// wagmiConfig.ts
import { createConfig, http } from "wagmi";
import { hardhat, mainnet, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";
const projectId = "<WALLETCONNECT_PROJECT_ID>";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [hardhat],
    transports: {
      [hardhat.id]: http(
        hardhat.rpcUrls.default.http[0] ?? "http://127.0.0.1:8545"
      ),
    },
    walletConnectProjectId: projectId,
    appName: "Your App Name",
    appDescription: "Your App Description",
    appUrl: "https://family.co", // your app's url
    appIcon: "https://family.co/logo.png",
  })
);
