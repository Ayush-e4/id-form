import styles from "../page.module.css";
import { buildSchoolSummary } from "@/lib/admin";
import { readSubmissions } from "@/lib/submissions";
import SchoolList from "@/components/admin/SchoolList";

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

      <SchoolList schools={schoolSummary} />
    </main>
  );
}
