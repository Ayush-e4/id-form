"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "@/app/admin/page.module.css";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "◫" },
  { href: "/admin/submissions", label: "Submissions", icon: "▤" },
  { href: "/admin/schools", label: "Schools", icon: "◪" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin-login");
    router.refresh();
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>ID Admin</div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ""}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className={styles.sidebarBottom}>
        <button className={styles.refreshBtn} onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
