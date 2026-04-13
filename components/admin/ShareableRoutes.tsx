"use client";

import { useState } from "react";
import styles from "@/app/admin/page.module.css";

type RouteItem = {
  label: string;
  type: string;
  href: string;
  path: string;
};

export default function ShareableRoutes({ routes }: { routes: RouteItem[] }) {
  const [search, setSearch] = useState("");

  const filteredRoutes = routes.filter(
    (route) =>
      route.label.toLowerCase().includes(search.toLowerCase()) ||
      route.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader} style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className={styles.panelTitle}>Shareable Routes</h2>
          <p className={styles.panelMeta}>Quick links the admin can copy and send to plants and schools</p>
        </div>
        <input
          type="text"
          className={styles.search}
          placeholder="Search routes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "220px", marginLeft: "auto" }}
        />
      </div>
      <div className={`${styles.routeList} ${styles.scrollableRouteList}`}>
        {filteredRoutes.length === 0 ? (
          <div className={styles.emptyCompact}>No routes found.</div>
        ) : (
          filteredRoutes.map((route) => (
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
          ))
        )}
      </div>
    </section>
  );
}
