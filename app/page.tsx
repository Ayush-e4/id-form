import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.comingSoonCard}>
        <p className={styles.comingSoonEyebrow}>Burman Studio</p>
        <h1 className={styles.comingSoonTitle}>Coming soon</h1>
        <p className={styles.comingSoonText}>
          Our public site is on the way. The ID form routes are being kept ready behind the scenes.
        </p>
      </div>
    </main>
  );
}
