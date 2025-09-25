// wagmiConfig.ts
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// 从环境变量获取 WalletConnect Project ID，如果不存在则使用默认值
// const projectId =
//   process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
//   "YOUR_WALLET_CONNECT_PROJECT_ID";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [sepolia],
    transports: {
      [sepolia.id]: http(),
      // [hardhat.id]: http(
      //   hardhat.rpcUrls.default.http[0] ?? "http://127.0.0.1:8545"
      // ),
      // [localhost.id]: http(
      //   localhost.rpcUrls.default.http[0] ?? "http://127.0.0.1:8545"
      // ),
    },
    walletConnectProjectId: "4faa3eed0f5e81df6081f3d80ecf8392",
    appName: "Red Packet Playground",
    appDescription: "演示使用 ethers.js 与 wagmi 的钱包与合约信息展示",
    appUrl: "https://your-app-url.com",
    appIcon: "https://your-app-url.com/icon.png",
  })
);
