"use client";

import { ConnectKitButton } from "connectkit";

import ListData, { ChildRef } from "./ListData";
import AddLogs from "./Transform";
import { useRef, useState, useEffect } from "react";

function TransferPage() {
  const [isLoading, setIsLoading] = useState(true);

  const childRef = useRef<ChildRef>(null);

  // 模拟页面加载完成
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ background: "#e1e1e1", position: "relative" }}>
      {/* 全局 Loading 遮罩 */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ color: "black" }}>数据加载中...</div>
        </div>
      )}

      <div
        style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}
      >
        <ConnectKitButton />
      </div>
      <AddLogs
        setIsLoading={setIsLoading}
        callback={async () => {
          setIsLoading(true);
          await childRef.current?.refetch();
          console.log("refetch");
          setTimeout(() => {
            setIsLoading(false);
          }, 100);
        }}
      />
      <ListData ref={childRef} />
    </div>
  );
}

// 使用 memoization 避免不必要的重新渲染
const Web3Provider = () => {
  return <TransferPage />;
};
export default Web3Provider;
