import styles from "./page.module.css";

export default function CoolShowcasePage() {
  return (
    <main className={styles.frostedStage}>
      <div className={`${styles.frostedOrb} ${styles.orbOne}`} />
      <div className={`${styles.frostedOrb} ${styles.orbTwo}`} />
      <div className={`${styles.frostedOrb} ${styles.orbThree}`} />

      <div className={styles.frostedCard}>
        <h1>酷炫磨砂体验</h1>
        <p>
          一个留白的创意空间，用于展示即将上线的特性。绚丽的渐变与磨砂质感勾勒出
          Web3 的未来灵感。
        </p>
        <div className={styles.frostedTags}>
          <span className={styles.frostedTag}>Design</span>
          <span className={styles.frostedTag}>Web3</span>
          <span className={styles.frostedTag}>Frosted Glass</span>
          <span className={styles.frostedTag}>Coming Soon</span>
        </div>
      </div>
    </main>
  );
}
