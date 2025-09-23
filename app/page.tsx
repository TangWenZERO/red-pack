"use client";

import Link from "next/link";

const links = [
  {
    href: "/ethers",
    title: "Ethers.js 钱包",
    description: "使用 ethers.js 连接钱包并读取合约信息",
  },
  {
    href: "/wagmi",
    title: "wagmi 钱包",
    description: "通过 wagmi hooks 管理连接与数据",
  },
  {
    href: "/cool",
    title: "酷炫展示页",
    description: "磨砂玻璃风格的创意空白页",
  },
];

export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="home-content">
        <h1>Red Packet Playground</h1>
        <p className="home-subtitle">
          选择不同的技术方案体验钱包连接与合约信息展示。
        </p>
        <div className="home-actions">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="home-button">
              <span>{link.title}</span>
              <small>{link.description}</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
