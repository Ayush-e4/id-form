"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import Image from "next/image";
import styles from "@/app/admin/page.module.css";
import { plantConfigs } from "@/lib/plants";
import { schoolConfigs } from "@/lib/schools";
import { Submission } from "@/lib/types";

const REPORT_TIME_ZONE = "Asia/Kolkata";

function getCalendarDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default function SubmissionsView() {
  const [entries, setEntries] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      setEntries(await res.json());
      setSelectedIds([]);
    } catch {
      setError("Could not load submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const schoolOptions = useMemo(() => {
    const bySlug = new Map<string, string>([
      ...plantConfigs.map((plant) => [plant.slug, plant.name] as const),
      ...schoolConfigs.map((school) => [school.slug, school.name] as const),
    ]);

    for (const entry of entries) {
      if (entry.plantSlug && entry.plantName && !bySlug.has(entry.plantSlug)) {
        bySlug.set(entry.plantSlug, entry.plantName);
      }
      if (entry.schoolSlug && entry.schoolName && !bySlug.has(entry.schoolSlug)) {
        bySlug.set(entry.schoolSlug, entry.schoolName);
      }
    }

    return Array.from(bySlug.entries()).map(([slug, name]) => ({ slug, name }));
  }, [entries]);

  const filtered = useMemo(() => {
    const routeScopedEntries =
      schoolFilter === "all"
        ? entries
        : entries.filter((entry) => entry.schoolSlug === schoolFilter || entry.plantSlug === schoolFilter);

    if (!search.trim()) return routeScopedEntries;

    const q = search.toLowerCase();
    return routeScopedEntries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.plantName && e.plantName.toLowerCase().includes(q)) ||
        (e.plantSlug && e.plantSlug.toLowerCase().includes(q)) ||
        (e.schoolName && e.schoolName.toLowerCase().includes(q)) ||
        (e.schoolSlug && e.schoolSlug.toLowerCase().includes(q)) ||
        (e.phone && e.phone.includes(q)) ||
        (e.admissionNo && e.admissionNo.includes(q)) ||
        (e.class && e.class.toLowerCase().includes(q))
    );
  }, [entries, schoolFilter, search]);

  const filteredIds = useMemo(() => filtered.map((entry) => entry.id), [filtered]);
  const visibleSelectedIds = useMemo(
    () => selectedIds.filter((id) => filteredIds.includes(id)),
    [filteredIds, selectedIds]
  );
  const allFilteredSelected = filteredIds.length > 0 && visibleSelectedIds.length === filteredIds.length;
  const someFilteredSelected = visibleSelectedIds.length > 0 && !allFilteredSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  function toggleSelection(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((entryId) => entryId !== id) : [...current, id]));
  }

  function toggleSelectAll() {
    setSelectedIds((current) => {
      if (allFilteredSelected) {
        return current.filter((id) => !filteredIds.includes(id));
      }

      return Array.from(new Set([...current, ...filteredIds]));
    });
  }

  async function deleteEntries(ids: string[]) {
    const failures: string[] = [];

    for (const id of ids) {
      const response = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
      if (!response.ok) {
        failures.push(id);
      }
    }

    if (failures.length > 0) {
      throw new Error("Some entries could not be deleted.");
    }
  }

  async function downloadPhotosZip() {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const photoEntries = filtered.filter((e) => e.photoUrl);

      for (const e of photoEntries) {
        try {
          const res = await fetch(e.photoUrl!);
          if (!res.ok) throw new Error(`Failed to fetch ${e.photoUrl}`);
          const blob = await res.blob();
          const extMatch = e.photoUrl!.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
          let ext = extMatch ? extMatch[1] : "jpg";
          if (ext.length > 4) ext = "jpg";
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
      const suffix = schoolFilter === "all" ? "all" : schoolFilter;
      a.href = blobUrl;
      a.download = `id_photos_${suffix}_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Zip generation failed", err);
      alert("Failed to create ZIP file.");
    } finally {
      setDownloadingZip(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}'s entry? This will also remove their photo.`)) return;

    setDeletingIds((current) => [...current, id]);
    try {
      await deleteEntries([id]);
      setEntries((current) => current.filter((entry) => entry.id !== id));
      setSelectedIds((current) => current.filter((entryId) => entryId !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete entry.");
    } finally {
      setDeletingIds((current) => current.filter((entryId) => entryId !== id));
    }
  }

  async function handleBulkDelete() {
    if (visibleSelectedIds.length === 0) return;
    if (!confirm(`Delete ${visibleSelectedIds.length} selected entr${visibleSelectedIds.length === 1 ? "y" : "ies"}? This will also remove their photos.`)) {
      return;
    }

    setDeletingIds(visibleSelectedIds);

    try {
      await deleteEntries(visibleSelectedIds);
      setEntries((current) => current.filter((entry) => !visibleSelectedIds.includes(entry.id)));
      setSelectedIds((current) => current.filter((id) => !visibleSelectedIds.includes(id)));
    } catch (err) {
      console.error(err);
      alert("Failed to delete one or more selected entries.");
    } finally {
      setDeletingIds([]);
    }
  }

  function downloadExcel() {
    const rows = filtered.map((e) => ({
      Type: e.type || "plant",
      Plant: e.plantName || "",
      "Plant Slug": e.plantSlug || "",
      School: e.schoolName || "",
      "School Slug": e.schoolSlug || "",
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

    const suffix = schoolFilter === "all" ? "all" : schoolFilter;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Submissions");

    if (rows.length > 0) {
      worksheet.columns = Object.keys(rows[0]).map((key) => ({
        header: key,
        key,
        width: Math.min(Math.max(key.length + 4, 16), 28),
      }));
      worksheet.addRows(rows);
      worksheet.getRow(1).font = { bold: true };
    }

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `id_submissions_${suffix}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    }).catch((err) => {
      console.error("Excel generation failed", err);
      alert("Failed to create Excel file.");
    });
  }

  const withPhoto = filtered.filter((e) => e.photoUrl).length;
  const todayKey = getCalendarDate(new Date().toISOString());
  const today = filtered.filter((e) => getCalendarDate(e.submittedAt) === todayKey).length;
  const missingPhoto = filtered.length - withPhoto;

  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Submissions</h1>
          <p className={styles.pageSub}>
            {schoolFilter === "all"
              ? `All ID card registration entries (${filtered.length} showing)`
              : `${filtered.length} entries for ${schoolOptions.find((school) => school.slug === schoolFilter)?.name || schoolFilter}`}
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.refreshBtn} onClick={load}>
            Refresh
          </button>
          <button className={styles.dlBtn} onClick={downloadPhotosZip} disabled={downloadingZip}>
            {downloadingZip ? "Zipping..." : "Download Photos"}
          </button>
          <button className={styles.dlBtn} onClick={downloadExcel}>
            Download Excel
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total entries</div>
          <div className={styles.statVal}>{filtered.length}</div>
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
          <div className={styles.statVal}>{missingPhoto}</div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <select className={styles.filterSelect} value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
          <option value="all">All routes</option>
          {schoolOptions.map((school) => (
            <option key={school.slug} value={school.slug}>
              {school.name}
            </option>
          ))}
        </select>
        <input
          className={styles.search}
          type="text"
          placeholder="Search by name, school, phone, class, or admission no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.bulkActions}>
        <label className={styles.bulkSelect}>
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleSelectAll}
            disabled={filtered.length === 0 || deletingIds.length > 0}
          />
          <span>Select all shown</span>
        </label>
        <div className={styles.bulkMeta}>
          {visibleSelectedIds.length === 0 ? "No entries selected" : `${visibleSelectedIds.length} selected`}
        </div>
        <button
          className={styles.bulkDeleteBtn}
          onClick={handleBulkDelete}
          disabled={visibleSelectedIds.length === 0 || deletingIds.length > 0}
        >
          {deletingIds.length > 0 ? "Deleting..." : "Delete selected"}
        </button>
      </div>

      {loading ? (
        <div className={styles.empty}>Loading…</div>
      ) : error ? (
        <div className={styles.empty} style={{ color: "#c0392b" }}>
          {error}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "44px" }}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    disabled={filtered.length === 0 || deletingIds.length > 0}
                    aria-label="Select all entries"
                    className={styles.rowCheckbox}
                  />
                </th>
                <th style={{ width: "52px" }}>#</th>
                <th style={{ width: "48px" }}></th>
                <th>Type</th>
                <th>Name / Student</th>
                <th>Class / Mobile</th>
                <th>Extra Info</th>
                <th>Photo</th>
                <th>Submitted at</th>
                <th style={{ width: "96px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.emptyRow}>
                    {search || schoolFilter !== "all" ? "No matching submissions found." : "No submissions yet."}
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
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(e.id)}
                          onChange={() => toggleSelection(e.id)}
                          aria-label={`Select ${e.name}`}
                          className={styles.rowCheckbox}
                          disabled={deletingIds.length > 0}
                        />
                      </td>
                      <td className={styles.rowNum}>{i + 1}</td>
                      <td>
                        {e.photoUrl ? (
                          <Image
                            src={e.photoUrl}
                            alt={e.name}
                            className={`${styles.avatar} ${styles.clickableAvatar}`}
                            width={36}
                            height={36}
                            onClick={() => setPreviewImage(e.photoUrl!)}
                          />
                        ) : (
                          <div className={styles.initials}>{initials}</div>
                        )}
                      </td>
                      <td>
                        <span className={styles.typeBadge} data-type={e.type || "plant"}>
                          {(e.type || "plant").toUpperCase()}
                        </span>
                      </td>
                      <td className={styles.nameCell}>
                        <div style={{ fontWeight: 600 }}>{e.name}</div>
                        {(e.schoolName || e.plantName) && (
                          <div style={{ fontSize: "11px", opacity: 0.7 }}>{e.schoolName || e.plantName}</div>
                        )}
                        {e.fathersName && <div style={{ fontSize: "11px", opacity: 0.7 }}>S/O: {e.fathersName}</div>}
                      </td>
                      <td className={styles.mono}>
                        {e.type === "school" ? (
                          <div>
                            <div>Class: {e.class}</div>
                            <div style={{ fontSize: "11px" }}>{e.phone}</div>
                          </div>
                        ) : (
                          e.phone
                        )}
                      </td>
                      <td>
                        {e.type === "school" ? (
                          <div style={{ fontSize: "11px", lineHeight: 1.4 }}>
                            {e.admissionNo && <div>Adm: {e.admissionNo}</div>}
                            {e.bloodGroup && <div>Blood: {e.bloodGroup}</div>}
                            {e.dob && <div>DOB: {e.dob}</div>}
                          </div>
                        ) : (
                          "-"
                        )}
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
                          disabled={deletingIds.includes(e.id)}
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

      {previewImage && (
        <div className={styles.lightbox} onClick={() => setPreviewImage(null)}>
          <div className={styles.lightboxContent}>
            <Image src={previewImage} alt="Enlarged User Photo" fill className={styles.lightboxImg} />
          </div>
          <button className={styles.lightboxClose}>×</button>
        </div>
      )}
    </main>
  );
}
