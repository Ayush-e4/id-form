import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { isAdminSessionAuthenticated } from "@/lib/admin-auth";
import styles from "./page.module.css";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isAuthenticated = await isAdminSessionAuthenticated();

  if (!isAuthenticated) {
    redirect(`/admin-login?next=${encodeURIComponent("/admin")}`);
  }

  return (
    <div className={styles.wrap}>
      <AdminSidebar />
      {children}
    </div>
  );
}
