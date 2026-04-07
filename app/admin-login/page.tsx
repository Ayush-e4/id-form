import AdminLoginForm from "./AdminLoginForm";
import styles from "./page.module.css";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextParam = resolvedSearchParams.next;
  const nextPath = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  return (
    <main className={styles.main}>
      <AdminLoginForm nextPath={nextPath || "/admin"} />
    </main>
  );
}
