import Link from "next/link";
import { headers } from "next/headers";
import styles from "./page.module.css";
import { buildSchoolSummary, getCalendarDate } from "@/lib/admin";
import { plantConfigs } from "@/lib/plants";
import { schoolConfigs } from "@/lib/schools";
import { readSubmissions } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const headerStore = await headers();
  const entries = await readSubmissions();
  const schoolSummary = buildSchoolSummary(entries);
  const todayKey = getCalendarDate(new Date().toISOString());
  const todayCount = entries.filter((entry) => getCalendarDate(entry.submittedAt) === todayKey).length;
  const activeSchools = schoolSummary.filter((school) => school.entryCount > 0);
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
    <main className={styles.main}>
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
          <div className={styles.statLabel}>Active schools</div>
          <div className={styles.statVal}>{activeSchools.length}</div>
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
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Shareable Routes</h2>
              <p className={styles.panelMeta}>Quick links the admin can copy and send to plants and schools</p>
            </div>
          </div>
          <div className={styles.routeList}>
            {shareableRoutes.map((route) => (
              <div key={route.href} className={styles.routeRow}>
                <div className={styles.routeTop}>
                  <div>
                    <div className={styles.routeLabel}>{route.label}</div>
                    <div className={styles.routePath}>{route.path}</div>
                  </div>
                  <span className={styles.routeType}>{route.type}</span>
                </div>
                <a href={route.href} target="_blank" rel="noreferrer" className={styles.routeLink}>
                  {route.href}
                </a>
              </div>
            ))}
          </div>
        </section>

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
