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
      <SchoolList schools={schoolSummary} />
    </main>
  );
}
