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
    setError("");
    try {
      const res = await fetch("/api/submissions", { cache: "no-store" });
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
        (e.phone && e.phone.includes(q)) ||
        (e.admissionNo && e.admissionNo.includes(q)) ||
        (e.class && e.class.toLowerCase().includes(q))
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
          if (!res.ok) throw new Error(`Failed to fetch ${e.photoUrl}`);
          const blob = await res.blob();
          
          const extMatch = e.photoUrl!.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
          let ext = extMatch ? extMatch[1] : 'jpg';
          if (ext.length > 4) ext = 'jpg';
          const baseName = (e.phone || e.admissionNo || e.name || e.id)
            .replace(/[^a-zA-Z0-9-_]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 60) || e.id;

          zip.file(`${baseName}-${e.id.slice(-6)}.${ext}`, blob);
        } catch (err) {
          console.error(`Failed to fetch photo for ${e.id}`, err);
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}'s entry? This will also remove their photo.`)) return;
    
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      
      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete entry.");
    }
  };

  function downloadExcel() {
    const rows = entries.map((e) => ({
      Type: e.type || "plant",
      Name: e.name,
      Class: e.class || "",
      "Father's Name": e.fathersName || "",
      "Mother's Name": e.mothersName || "",
      DOB: e.dob || "",
      Mobile: e.phone || "",
      "Roll No": e.rollNo || "",
      "Admission No": e.admissionNo || "",
      Height: e.height || "",
      Weight: e.weight || "",
      "Blood Group": e.bloodGroup || "",
      Address: e.address || "",
      "House Name": e.houseName || "",
      "Photo URL": e.photoUrl ?? "Not uploaded",
      "Submitted At": new Date(e.submittedAt).toLocaleString("en-IN"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
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
            placeholder="Search by name, phone, class, or admission no…"
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
                  <th>Type</th>
                  <th>Name / Student</th>
                  <th>Class / Mobile</th>
                  <th>Extra Info</th>
                  <th>Photo</th>
                  <th>Submitted at</th>
                  <th style={{ width: "80px" }}>Actions</th>
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
                        <td>
                          <span className={styles.typeBadge} data-type={e.type || 'plant'}>
                            {(e.type || 'plant').toUpperCase()}
                          </span>
                        </td>
                        <td className={styles.nameCell}>
                          <div style={{ fontWeight: 600 }}>{e.name}</div>
                          {e.fathersName && <div style={{ fontSize: '11px', opacity: 0.7 }}>S/O: {e.fathersName}</div>}
                        </td>
                        <td className={styles.mono}>
                          {e.type === 'school' ? (
                            <div>
                               <div>Class: {e.class}</div>
                               <div style={{ fontSize: '11px' }}>{e.phone}</div>
                            </div>
                          ) : e.phone}
                        </td>
                        <td>
                          {e.type === 'school' ? (
                            <div style={{ fontSize: '11px', lineHeight: 1.4 }}>
                               {e.admissionNo && <div>Adm: {e.admissionNo}</div>}
                               {e.bloodGroup && <div>Blood: {e.bloodGroup}</div>}
                               {e.dob && <div>DOB: {e.dob}</div>}
                            </div>
                          ) : '-'}
                        </td>
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
                        <td>
                          <button 
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(e.id, e.name)}
                            title="Delete Entry"
                          >
                            🗑️
                          </button>
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
