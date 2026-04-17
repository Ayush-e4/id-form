import Link from "next/link";
import { headers } from "next/headers";
import styles from "./page.module.css";
import {
  SUPABASE_FREE_TIER_STORAGE_BYTES,
  buildSchoolSummary,
  formatStorageQuota,
  formatStorageUsage,
  getCalendarDate,
  getPhotoStorageUsage,
} from "@/lib/admin";
import { plantConfigs } from "@/lib/plants";
import { schoolConfigs } from "@/lib/schools";
import { readSubmissions } from "@/lib/submissions";
import ShareableRoutes from "@/components/admin/ShareableRoutes";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const headerStore = await headers();
  const entries = await readSubmissions();
  const schoolSummary = buildSchoolSummary(entries);
  const todayKey = getCalendarDate(new Date().toISOString());
  const todayCount = entries.filter((entry) => getCalendarDate(entry.submittedAt) === todayKey).length;
  const storageUsage = await getPhotoStorageUsage(entries);
  const storageQuotaUsed = formatStorageQuota(
    storageUsage.total.bytes,
    SUPABASE_FREE_TIER_STORAGE_BYTES
  );
  const recentEntries = entries.slice(0, 8);
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "burmanstudio.online";
  const protocol = headerStore.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const shareableRoutes = [
    ...plantConfigs.map((plant) => ({
      label: plant.name,
      type: "Plant",
      href: `${origin}/plants/${plant.slug}`,
      path: `/plants/${plant.slug}`,
    })),
    ...schoolConfigs.map((school) => ({
      label: school.name,
      type: "School",
      href: `${origin}/schools/${school.slug}`,
      path: `/schools/${school.slug}`,
    })),
  ];

  return (
    <main className={`${styles.main} ${styles.dashboardMain}`}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSub}>Overview across all school submission routes.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/admin/submissions" className={styles.dlBtn}>
            Open Submissions
          </Link>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Configured schools</div>
          <div className={styles.statVal}>{schoolSummary.length}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Photos bucket used</div>
          <div className={styles.statVal}>
            {formatStorageUsage(storageUsage.total.bytes)} /{" "}
            {formatStorageUsage(SUPABASE_FREE_TIER_STORAGE_BYTES)}
          </div>
          <div className={styles.statSub}>
            {storageQuotaUsed} of Supabase Free storage
            <br />
            {storageUsage.linked.objectCount} linked photos
            {storageUsage.orphaned.objectCount > 0 ? `, ${storageUsage.orphaned.objectCount} extra files` : ""}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total students</div>
          <div className={styles.statVal}>{entries.length}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Today</div>
          <div className={styles.statVal}>{todayCount}</div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <ShareableRoutes routes={shareableRoutes} />

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Recent Submissions</h2>
              <p className={styles.panelMeta}>Latest activity across all routes</p>
            </div>
          </div>
          <div className={styles.list}>
            {recentEntries.length === 0 ? (
              <div className={styles.emptyCompact}>No submissions yet.</div>
            ) : (
              recentEntries.map((entry) => (
                <div key={entry.id} className={styles.listRow}>
                  <div>
                    <div className={styles.listTitle}>{entry.name}</div>
                    <div className={styles.listMeta}>{entry.schoolName || entry.plantName || entry.type || "Unknown route"}</div>
                  </div>
                  <div className={styles.listMeta}>
                    {new Date(entry.submittedAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

    </main>
  );
}
