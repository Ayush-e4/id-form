import styles from "../page.module.css";
import { buildSchoolSummary } from "@/lib/admin";
import { readSubmissions } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage() {
  const entries = await readSubmissions();
  const schoolSummary = buildSchoolSummary(entries);

  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Schools</h1>
          <p className={styles.pageSub}>Configured school routes and their activity.</p>
        </div>
      </div>

      <div className={styles.schoolGrid}>
        {schoolSummary.map((school) => (
          <section key={school.slug} className={styles.schoolPanel}>
            <div className={styles.schoolPanelTop}>
              <div>
                <h2 className={styles.schoolName}>{school.name}</h2>
                <p className={styles.schoolSlug}>{school.slug}</p>
              </div>
              <span className={styles.typeBadge} data-type="school">
                SCHOOL
              </span>
            </div>

            <div className={styles.kpiList}>
              <div className={styles.kpiRow}>
                <span>Total entries</span>
                <strong>{school.entryCount}</strong>
              </div>
              <div className={styles.kpiRow}>
                <span>With photo</span>
                <strong>{school.withPhoto}</strong>
              </div>
              <div className={styles.kpiRow}>
                <span>Configured fields</span>
                <strong>{school.configuredFields}</strong>
              </div>
              <div className={styles.kpiRow}>
                <span>Last submission</span>
                <strong>
                  {school.lastSubmittedAt
                    ? new Date(school.lastSubmittedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : "No data"}
                </strong>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
