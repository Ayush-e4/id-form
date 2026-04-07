import Link from "next/link";
import styles from "../page.module.css";
import { schoolConfigs } from "@/lib/schools";

export default function SchoolsIndexPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Schools</h1>
        <p className={styles.sub}>Choose a school form route</p>
      </header>

      <div className={`${styles.body} ${styles.schoolListBody}`}>
        {schoolConfigs.map((school) => (
          <Link key={school.slug} href={`/schools/${school.slug}`} className={styles.schoolCard}>
            <strong>{school.name}</strong>
            <span>{school.slug}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
