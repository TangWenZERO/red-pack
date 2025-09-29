import { LOG_CONTRACT_ADDRESS } from "@/app/utils/utils";
import { forwardRef, useImperativeHandle } from "react";
import { useReadContract } from "wagmi";
import { parseEther, type Abi } from "viem";
import LogABI from "@/app/abi/DataLogger.json";
const ABI = (LogABI as { abi: Abi }).abi;
const BaseConfig = {
  address: LOG_CONTRACT_ADDRESS,
  abi: ABI,
};
type TransferRecordSubmittedEvent = {
  id: bigint;
  submitter: string; // 以太坊地址
  from: string; // 以太坊地址
  to: string; // 以太坊地址
  amount: bigint;
  description: string;
  timestamp: bigint;
};
interface ChildProps {}
export interface ChildRef {
  refetch: () => void;
}
const ListData = forwardRef<ChildRef, ChildProps>((props, ref) => {
  const { data: listArray, refetch } = useReadContract({
    ...BaseConfig,
    functionName: "getAllTransferRecords",
  });
  useImperativeHandle(ref, () => ({
    refetch,
  }));
  return (
    <div>
      <div>
        {(listArray as TransferRecordSubmittedEvent[])?.map(
          (item: TransferRecordSubmittedEvent) => {
            return (
              <div key={item.id}>
                <div>{item.id}</div>
                <div>{item.submitter}</div>
                <div>{item.from}</div>
                <div>{item.to}</div>
                <div>{item.amount}</div>
                <div>{item.timestamp}</div>
                <div>{item.description}</div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
});
export default ListData;
