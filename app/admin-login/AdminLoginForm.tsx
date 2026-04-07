"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type AdminLoginFormProps = {
  nextPath: string;
};

function sanitizeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/admin";
  }

  return nextPath;
}

export default function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const router = useRouter();
  const safeNextPath = useMemo(() => sanitizeNextPath(nextPath), [nextPath]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password) {
      setError("Please enter the admin password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Login failed");
      }

      router.replace(safeNextPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Burman Studio Admin</h1>
      <p className={styles.sub}>Enter the admin password to access the dashboard and submission data.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Enter admin password"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
