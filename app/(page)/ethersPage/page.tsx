"use client";
import { ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import { CONTRACT_ADDRESS } from "@/app/utils/utils";
import contractAbi from "@/app/abi/Red.json";
import styles from "./style.module.css";
import {
  InformationPanel,
  DepositSection,
  EthersWalletActions,
  type ClaimRecordDisplay,
} from "@/app/components";

const ABI = (contractAbi as { abi: ethers.InterfaceAbi }).abi;
const EthersPage = () => {
  // 链接钱包状态
  const [isConnected, setIsConnected] = useState(false);
  const [isDepositing, setDepositing] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  const provideRef = useRef<ethers.BrowserProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 打开选择钱包
  const [open, setIsOpen] = useState(false);

  // 账户信息
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<ethers.Network | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  // 合约信息
  const [ownerResult, setOwnerResult] = useState<string | null>(null);
  const [totalBalanceResult, setTotalBalanceResult] = useState<string | null>(
    null
  );
  const [totalCountResult, setTotalCountResult] = useState<string | null>(null);
  const [isEqualResult, setIsEqualResult] = useState<boolean | null>(null);
  const [userList, setUserList] = useState<ClaimRecordDisplay[]>([]);
  const [contractError, setContractError] = useState<string | null>(null);
  // 状态
  const [isSubmitting, setIsSubitting] = useState(false);
  // 输入金额
  const [amount, setAmount] = useState<string>("");
  // 清空红包
  const clearRedPacked = async () => {
    if (!provideRef.current || !account) {
      setError("请先连接钱包");
      return;
    }
    console.log("444");
    try {
      const signer = await provideRef.current.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.clearRedPacked();
      await tx.wait();
      console.log("清空成999功");

      // 领取成功后刷新账户和合约信息
      await GetAccount({ account });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  };
  // 领取红包
  const claim = async () => {
    if (!provideRef.current || !account) {
      setError("请先连接钱包");
      return;
    }

    try {
      const signer = await provideRef.current.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.getRedPacked();
      await tx.wait();

      // 领取成功后刷新账户和合约信息
      await GetAccount({ account });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  };
  // 存红包
  const deposit = async () => {
    if (!provideRef.current || !account) {
      setError("请先连接钱包");
      return;
    }
    const amountText = amount.trim();
    if (!amountText) {
      setError("请输入存入金额");
      return;
    }

    let amountInWei: bigint;
    try {
      amountInWei = ethers.parseEther(amountText);
    } catch (err) {
      setError("请输入合法的 ETH 金额");
      return;
    }
    if (amountInWei <= 0) {
      setError("金额必须大于 0");
      return;
    }
    setDepositing(true);

    try {
      const signer = await provideRef.current.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.deposit({ value: amountInWei });
      await tx.wait();
      console.log("成功");
      await GetAccount({ account: account });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDepositing(false);
      console.log("刷新数据");
    }
  };
  // 断开钱包连接
  const disconnectWallet = async () => {
    setAccount(null);
    setBalance(null);
    setNetwork(null);
    setError(null);
    setOwnerResult(null);
    setTotalBalanceResult(null);
    setTotalCountResult(null);
    setIsEqualResult(null);
    setUserList([]);
    setContractError(null);
  };
  // 链接钱包
  // const connectWallet = async () => {
  //   if (!window.ethereum) {
  //     alert("请安装 MetaMask 钱包");
  //     return;
  //   }
  //   setIsConnected(true);
  //   if (!provideRef.current) {
  //     provideRef.current = new ethers.BrowserProvider(
  //       window.ethereum as ethers.Eip1193Provider
  //     );
  //   }
  //   const accounts = (await (window.ethereum as ethers.Eip1193Provider).request(
  //     {
  //       method: "eth_requestAccounts",
  //     }
  //   )) as string[];

  //   if (!accounts || accounts.length === 0) {
  //     setError("未返回任何账户");
  //     return;
  //   }
  //   await GetAccount({ account: accounts[0] });
  //   setIsConnected(false);
  // };
  // 主动链接钱包
  const isOpen = () => {
    setIsOpen(!isOpen);
  };
  // 获取合约信息
  const getContractInfo = () => {
    console.log("getContractInfo");
    if (!provideRef.current) {
      setError("先链接钱包");
      return;
    }
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      provideRef.current
    );
    // 获取用户用户信息
    contract.owner().then((owner) => {
      setOwnerResult(owner);
    });
    contract.totalBalance().then((totalBalance) => {
      console.log("**99**", ethers.formatEther(totalBalance));

      setTotalBalanceResult(ethers.formatEther(totalBalance));
    });
    contract.totalCount().then((totalCount) => {
      console.log("****", totalCount);
      setTotalCountResult(totalCount);
    });
    contract.isEqual().then((isEqual) => {
      setIsEqualResult(isEqual);
    });
    contract.getUser().then((result) => {
      const userList: ClaimRecordDisplay[] = result.map((item: any) => {
        return {
          addr: item[0],
          amount: `${ethers.formatEther(item[1])} ETH`,
          time: item[2],
        };
      });
      console.log(result);
      setUserList(userList);
    });
  };
  // 根据账户信息获取当前账户详细信息
  const GetAccount = async ({ account }: { account: string }) => {
    if (!account || !provideRef.current) {
      setError("请先连接钱包");
      disconnectWallet();
      return;
    }
    // 获取账户信息
    const balance = await provideRef.current.getBalance(account);
    // 获取网络数据
    const network = await provideRef.current.getNetwork();
    console.log(network, balance);
    setNetwork(network);
    setBalance(`${ethers.formatEther(balance)}`);
    getContractInfo();
  };
  // 如果已经链接就获取用户账户信息
  // const GetWallet = async () => {
  //   const accounts = (await (window.ethereum as ethers.Eip1193Provider).request(
  //     {
  //       method: "eth_accounts",
  //     }
  //   )) as string[];
  //   console.log(accounts);
  //   if (accounts.length > 0) {
  //     setAccount(accounts[0]);
  //     await GetAccount({ account: accounts[0] });
  //   }
  // };
  // 默认进入校验钱包
  useEffect(() => {
    if (!window.ethereum) {
      setError("请先安装钱包");
      disconnectWallet();
      return;
    }

    // if (!(window.ethereum as ethers.Eip1193Provider).on) {
    //   setError("请升级钱包");
    //   disconnectWallet();
    //   return;
    // }
    // 判断是否已经链接钱包
    // if (!provideRef.current) {
    //   provideRef.current = new ethers.BrowserProvider(
    //     window.ethereum as ethers.Eip1193Provider
    //   );
    // }
    // 判断是否已经链接钱包
    // GetWallet();

    // function accountsChanged(accounts: string[]) {
    //   if (accounts.length === 0) {
    //     return;
    //   }
    //   GetWallet();
    // }
    // function chainChanged(chainId: string) {
    //   if (chainId !== "0x1") {
    //     return;
    //   }
    // }
    // const eve = window.ethereum as ethers.Eip1193Provider;
    // eve.on("accountsChanged", accountsChanged);
    // eve.on("chainChanged", chainChanged);
    // return () => {
    //   eve.removeListener("accountsChanged", accountsChanged);
    //   eve.removeListener("chainChanged", chainChanged);
    // };
  }, []);
  return (
    <main className={styles.pageShell}>
      <section className={styles.panel}>
        <div className={styles.statePill}>ethers.js</div>
        <h1>使用 ethers.js 连接钱包</h1>
        <p>
          连接浏览器钱包，查看账户基础信息，并直接通过 ethers.js
          读取合约的核心状态。
        </p>

        <div className=" py-4">
          <EthersWalletActions
            isCleared={
              ownerResult !== null &&
              ownerResult !== "" &&
              account === ownerResult
            }
            onClear={async () => {
              await clearRedPacked();
            }}
            onClaim={async (provider) => {
              await claim();
            }}
            onConnectSuccess={({ address, provider }) => {
              setAccount(address);
              provideRef.current = provider;
              GetAccount({ account: address });
            }}
          />
        </div>
        {account !== null && account !== "" && account === ownerResult && (
          <DepositSection
            isSubmitting={isDepositing}
            value={amount}
            onChange={setAmount}
            onSubmit={deposit}
          />
        )}
        <InformationPanel
          isConnected={account !== null}
          walletInfo={{
            address: account,
            network: network?.name,
            balance: balance,
          }}
          contractInfo={{
            contractAddress: CONTRACT_ADDRESS,
            owner: ownerResult,
            totalBalance: `${totalBalanceResult} ETH`,
            totalCount: totalCountResult,
            isEqual: isEqualResult,
          }}
          claimRecords={userList.map((item: ClaimRecordDisplay) => ({
            ...item,
            key: Math.random(),
          }))}
        />
      </section>
    </main>
  );
};
export default EthersPage;
