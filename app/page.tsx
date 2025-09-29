"use client";

import Link from "next/link";
import styles from "./page.module.css";

const links = [
  {
    href: "/ethersPage",
    title: "Ethers.js 钱包",
    description: "使用 ethers.js 连接钱包并读取合约信息",
  },
  {
    href: "/wagmi",
    title: "wagmi 钱包",
    description: "通过 wagmi hooks 管理连接与数据",
  },
  {
    href: "/logs",
    title: "实现兑换ETH为USDT、转账USDT、查询USDT",
    description: "通过 ethers.js 实现",
  },
  {
    href: "/cool",
    title: "酷炫展示页",
    description: "磨砂玻璃风格的创意空白页",
  },
];

export default function HomePage() {
  return (
    <main className={styles.homeShell}>
      <section className={styles.homeContent}>
        <h1>Red Packet Playground</h1>
        <p className={styles.homeSubtitle}>
          选择不同的技术方案体验钱包连接与合约信息展示。
        </p>
        <div className={styles.homeActions}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.homeButton}
            >
              <span>{link.title}</span>
              <small>{link.description}</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
