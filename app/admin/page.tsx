"use client";

import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { Submission } from "@/lib/types";
import Image from "next/image";
import styles from "./page.module.css";

export default function AdminPage() {
  const [entries, setEntries] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      if (!res.ok) throw new Error("Failed to load");
      setEntries(await res.json());
    } catch {
      setError("Could not load submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.phone.includes(q)
    );
  }, [entries, search]);

  async function downloadPhotosZip() {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const photoEntries = entries.filter(e => e.photoUrl);
      
      for (const e of photoEntries) {
        try {
          const res = await fetch(e.photoUrl!);
          const blob = await res.blob();
          
          const extMatch = e.photoUrl!.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
          let ext = extMatch ? extMatch[1] : 'jpg';
          if (ext.length > 4) ext = 'jpg';

          zip.file(`${e.phone}.${ext}`, blob);
        } catch (err) {
          console.error(`Failed to fetch photo for ${e.phone}`, err);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `id_photos_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Zip generation failed", error);
      alert("Failed to create ZIP file.");
    } finally {
      setDownloadingZip(false);
    }
  }

  function downloadExcel() {
    const rows = entries.map((e) => ({
      Name: e.name,
      "Phone Number": e.phone,
      "Photo URL": e.photoUrl ?? "Not uploaded",
      "Submitted At": new Date(e.submittedAt).toLocaleString("en-IN"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 52 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, "id_submissions.xlsx");
  }

  const withPhoto = entries.filter((e) => e.photoUrl).length;
  const today = entries.filter(
    (e) =>
      new Date(e.submittedAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className={styles.wrap}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>ID Admin</div>
        <nav className={styles.nav}>
          <span className={styles.navItem + " " + styles.navActive}>
            <span className={styles.navIcon}>▤</span>
            Submissions
          </span>
        </nav>
        <div className={styles.sidebarBottom}>
          <button className={styles.refreshBtn} onClick={load}>
            ↺ Refresh
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>Submissions</h1>
            <p className={styles.pageSub}>All ID card registration entries</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.dlBtn} onClick={downloadPhotosZip} disabled={downloadingZip}>
              {downloadingZip ? "Zipping..." : "↓ Download Photos"}
            </button>
            <button className={styles.dlBtn} onClick={downloadExcel}>
              ↓ Download Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Total entries</div>
            <div className={styles.statVal}>{entries.length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>With photo</div>
            <div className={styles.statVal}>{withPhoto}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Today</div>
            <div className={styles.statVal}>{today}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Missing photo</div>
            <div className={styles.statVal}>{entries.length - withPhoto}</div>
          </div>
        </div>

        {/* Search */}
        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.empty}>Loading…</div>
        ) : error ? (
          <div className={styles.empty} style={{ color: "#c0392b" }}>{error}</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "36px" }}>#</th>
                  <th style={{ width: "48px" }}></th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Photo</th>
                  <th>Submitted at</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyRow}>
                      {search ? "No results found." : "No submissions yet."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((e, i) => {
                    const initials = e.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <tr key={e.id}>
                        <td className={styles.rowNum}>{i + 1}</td>
                        <td>
                          {e.photoUrl ? (
                            <Image
                              src={e.photoUrl}
                              alt={e.name}
                              className={styles.avatar + " " + styles.clickableAvatar}
                              width={36}
                              height={36}
                              onClick={() => setPreviewImage(e.photoUrl!)}
                            />
                          ) : (
                            <div className={styles.initials}>{initials}</div>
                          )}
                        </td>
                        <td className={styles.nameCell}>{e.name}</td>
                        <td className={styles.mono}>{e.phone}</td>
                        <td>
                          <span className={e.photoUrl ? styles.badgeYes : styles.badgeNo}>
                            {e.photoUrl ? "Uploaded" : "Missing"}
                          </span>
                        </td>
                        <td className={styles.timeCell}>
                          {new Date(e.submittedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {previewImage && (
        <div className={styles.lightbox} onClick={() => setPreviewImage(null)}>
          <div className={styles.lightboxContent}>
            <Image 
              src={previewImage}
              alt="Enlarged User Photo"
              fill
              className={styles.lightboxImg}
            />
          </div>
          <button className={styles.lightboxClose}>×</button>
        </div>
      )}
    </div>
  );
}
