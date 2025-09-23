import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Red Packet Playground",
  description: "演示使用 ethers.js 与 wagmi 的钱包与合约信息展示",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
