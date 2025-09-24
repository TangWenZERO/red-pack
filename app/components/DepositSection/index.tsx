"use client";

import { useCallback, type ChangeEvent } from "react";
import styles from "./styles.module.css";

export interface DepositSectionProps {
  value: string;
  onChange: (nextValue: string) => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  disabled?: boolean;
  inputPlaceholder?: string;
  buttonLabel?: string;
}

export default function DepositSection({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  disabled,
  inputPlaceholder = "请输入存入的 ETH 数量",
  buttonLabel = "存入金额",
}: DepositSectionProps) {
  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  const handleSubmit = () => {
    if (disabled || isSubmitting) return;
    void onSubmit();
  };

  const trimmed = value.trim();
  const submitDisabled = disabled || isSubmitting || trimmed.length === 0;

  return (
    <div className={styles.depositRow}>
      <input
        className={styles.inputField}
        type="number"
        min="0"
        step="0.0001"
        placeholder={inputPlaceholder}
        value={value}
        onChange={handleInputChange}
        disabled={disabled || Boolean(isSubmitting)}
      />
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={handleSubmit}
        disabled={submitDisabled}
      >
        {isSubmitting ? "存入中..." : buttonLabel}
      </button>
    </div>
  );
}
