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
export const CONTRACT_TTS_TOKEN_ADDRESS =
  "0x5C3C809f423cE629163c32E6B835B8780e86b4A1" as const;
export const CONTRACT_LOG_ADDRESS =
  "0x07A412A312A223056102983697516c08fcd89EcF" as const;
