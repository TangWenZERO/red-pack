export const trimValue = (value?: string | null) => {
  if (!value) return "-";
  const [whole, fraction = ""] = value.split(".");
  return fraction ? `${whole}.${fraction.slice(0, 6)}` : whole;
};

export const shortAddress = (value?: string | null) => {
  if (!value) return "-";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export const formatTimestamp = (value?: number | bigint | null) => {
  if (value === undefined || value === null) return "-";
  const numeric = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(numeric)) return "-";
  const date = new Date(numeric * 1000);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};
export const CONTRACT_ADDRESS =
  "0xC09a6A8c976F645A794c85b1281505A015bf5b63" as const;

export const LOG_CONTRACT_ADDRESS =
  "0x4a53FB0799571851C0D7011c164422c65b44ff28" as const;
export const Local_LOG_CONTRACT_ADDRESS =
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as const;
