"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "@/app/admin/page.module.css";
import { plantConfigs } from "@/lib/plants";
import { schoolConfigs } from "@/lib/schools";
import { Submission } from "@/lib/types";

const REPORT_TIME_ZONE = "Asia/Kolkata";
const PAGE_SIZE_OPTIONS = [50, 100];

interface SubmissionResponse {
  items: Submission[];
  total: number;
  page: number;
  pageSize: number;
}

interface ConfirmState {
  title: string;
  message: string;
  actionLabel: string;
  onConfirm: () => Promise<void>;
}

function getCalendarDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function buildPhotoFilename(entry: Submission) {
  const extMatch = entry.photoUrl?.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  let ext = extMatch ? extMatch[1] : "jpg";
  if (ext.length > 4) ext = "jpg";

  const baseName = (entry.phone || entry.admissionNo || entry.name || entry.id)
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || entry.id;

  return `${baseName}-${entry.id.slice(-6)}.${ext}`;
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  if (currentPage <= 2) {
    pages.add(2);
    pages.add(3);
  }

  if (currentPage >= totalPages - 1) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

export default function SubmissionsView() {
  const [entries, setEntries] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatus, setZipStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [notice, setNotice] = useState<{ tone: "info" | "error"; message: string } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const deferredSearch = useDeferredValue(search.trim());

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        route: schoolFilter,
      });

      if (deferredSearch) {
        params.set("search", deferredSearch);
      }

      const res = await fetch(`/api/submissions?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");

      const data: SubmissionResponse = await res.json();
      setEntries(data.items);
      setTotalCount(data.total);
      setSelectedIds([]);
    } catch {
      setError("Could not load submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, pageSize, schoolFilter, deferredSearch]);

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

  const filtered = entries;
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

  useEffect(() => {
    setPage(1);
  }, [schoolFilter, deferredSearch, pageSize]);

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entryId) => entryId !== id) : [...current, id]
    );
  }

  function toggleSelectAll() {
    setSelectedIds((current) => {
      if (allFilteredSelected) {
        return current.filter((id) => !filteredIds.includes(id));
      }

      return Array.from(new Set([...current, ...filteredIds]));
    });
  }

  function showNotice(tone: "info" | "error", message: string) {
    setNotice({ tone, message });
  }

  function closeConfirm() {
    if (confirmLoading) return;
    setConfirmState(null);
  }

  async function runConfirmedAction() {
    if (!confirmState) return;

    setConfirmLoading(true);
    try {
      await confirmState.onConfirm();
      setConfirmState(null);
    } finally {
      setConfirmLoading(false);
    }
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

  async function fetchAllFilteredEntries() {
    const params = new URLSearchParams({
      mode: "all",
      route: schoolFilter,
      pageSize: pageSize.toString(),
    });

    if (deferredSearch) {
      params.set("search", deferredSearch);
    }

    const response = await fetch(`/api/submissions?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load export data.");
    }

    const data: SubmissionResponse = await response.json();
    return data.items;
  }

  async function downloadPhotosZip() {
    setDownloadingZip(true);
    setZipProgress(0);
    setZipStatus("Preparing photo list...");

    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const exportEntries = await fetchAllFilteredEntries();
      const photoEntries = exportEntries.filter((entry) => entry.photoUrl);

      if (photoEntries.length === 0) {
        showNotice("info", "No photos available for the current filter.");
        return;
      }

      for (let index = 0; index < photoEntries.length; index += 1) {
        const entry = photoEntries[index];
        setZipStatus(`Downloading photo ${index + 1} of ${photoEntries.length}...`);

        try {
          const res = await fetch(entry.photoUrl!);
          if (!res.ok) throw new Error(`Failed to fetch ${entry.photoUrl}`);

          const blob = await res.blob();
          zip.file(buildPhotoFilename(entry), blob);
        } catch (err) {
          console.error(`Failed to fetch photo for ${entry.id}`, err);
        } finally {
          setZipProgress(Math.round(((index + 1) / photoEntries.length) * 100));
        }
      }

      setZipStatus("Compressing ZIP...");

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
      showNotice("error", "Failed to create ZIP file.");
    } finally {
      setDownloadingZip(false);
      setZipProgress(0);
      setZipStatus("");
    }
  }

  function handleDelete(id: string, name: string) {
    setConfirmState({
      title: "Delete Entry",
      message: `Delete ${name}'s entry? This will also remove the photo.`,
      actionLabel: "Delete Entry",
      onConfirm: async () => {
        setDeletingIds((current) => [...current, id]);
        try {
          await deleteEntries([id]);
          setEntries((current) => current.filter((entry) => entry.id !== id));
          setSelectedIds((current) => current.filter((entryId) => entryId !== id));
          setTotalCount((current) => Math.max(0, current - 1));
          showNotice("info", `${name}'s entry was deleted.`);
        } catch (err) {
          console.error(err);
          showNotice("error", "Failed to delete entry.");
        } finally {
          setDeletingIds((current) => current.filter((entryId) => entryId !== id));
        }
      },
    });
  }

  function handleBulkDelete() {
    if (visibleSelectedIds.length === 0) return;

    const idsToDelete = [...visibleSelectedIds];
    setConfirmState({
      title: "Delete Selected",
      message: `Delete ${idsToDelete.length} selected entr${idsToDelete.length === 1 ? "y" : "ies"}? This will also remove the photos.`,
      actionLabel: "Delete Selected",
      onConfirm: async () => {
        setDeletingIds(idsToDelete);

        try {
          await deleteEntries(idsToDelete);
          setEntries((current) => current.filter((entry) => !idsToDelete.includes(entry.id)));
          setSelectedIds((current) => current.filter((id) => !idsToDelete.includes(id)));
          setTotalCount((current) => Math.max(0, current - idsToDelete.length));
          showNotice("info", `${idsToDelete.length} entr${idsToDelete.length === 1 ? "y was" : "ies were"} deleted.`);
        } catch (err) {
          console.error(err);
          showNotice("error", "Failed to delete one or more selected entries.");
        } finally {
          setDeletingIds([]);
        }
      },
    });
  }

  async function downloadExcel() {
    try {
      const { default: ExcelJS } = await import("exceljs");
      const exportEntries = await fetchAllFilteredEntries();
      const rows = exportEntries.map((entry) => ({
        Type: entry.type || "plant",
        Plant: entry.plantName || "",
        "Plant Slug": entry.plantSlug || "",
        School: entry.schoolName || "",
        "School Slug": entry.schoolSlug || "",
        Name: entry.name,
        Class: entry.class || "",
        "Father's Name": entry.fathersName || "",
        "Mother's Name": entry.mothersName || "",
        DOB: entry.dob || "",
        Mobile: entry.phone || "",
        "Roll No": entry.rollNo || "",
        "Admission No": entry.admissionNo || "",
        Height: entry.height || "",
        Weight: entry.weight || "",
        "Blood Group": entry.bloodGroup || "",
        Address: entry.address || "",
        "House Name": entry.houseName || "",
        "Photo URL": entry.photoUrl ?? "Not uploaded",
        "Sample Photo Name": entry.photoUrl ? buildPhotoFilename(entry) : "",
        "Submitted At": new Date(entry.submittedAt).toLocaleString("en-IN"),
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

      const buffer = await workbook.xlsx.writeBuffer();
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
    } catch (err) {
      console.error("Excel generation failed", err);
      showNotice("error", "Failed to create Excel file.");
    }
  }

  const withPhoto = filtered.filter((entry) => entry.photoUrl).length;
  const todayKey = getCalendarDate(new Date().toISOString());
  const today = filtered.filter((entry) => getCalendarDate(entry.submittedAt) === todayKey).length;
  const missingPhoto = filtered.length - withPhoto;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = totalCount === 0 ? 0 : pageStart + filtered.length - 1;
  const visiblePageNumbers = getVisiblePageNumbers(page, totalPages);

  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Submissions</h1>
          <p className={styles.pageSub}>
            {schoolFilter === "all"
              ? `${totalCount} total ID card registration entries`
              : `${totalCount} entries for ${schoolOptions.find((school) => school.slug === schoolFilter)?.name || schoolFilter}`}
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.refreshBtn} onClick={load}>
            Refresh
          </button>
          <button className={styles.dlBtn} onClick={downloadPhotosZip} disabled={downloadingZip}>
            {downloadingZip ? "Preparing..." : "Download Photos"}
          </button>
          <button className={styles.dlBtn} onClick={downloadExcel}>
            Download Excel
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total entries</div>
          <div className={styles.statVal}>{totalCount}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>On this page</div>
          <div className={styles.statVal}>{filtered.length}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>With photo</div>
          <div className={styles.statVal}>{withPhoto}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Today on this page</div>
          <div className={styles.statVal}>{today}</div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <select
          className={styles.filterSelect}
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          aria-label="Filter submissions by route"
        >
          <option value="all">All routes</option>
          {schoolOptions.map((school) => (
            <option key={school.slug} value={school.slug}>
              {school.name}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
        <input
          className={styles.search}
          type="text"
          placeholder="Search by name, school, phone, class, or admission no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search submissions"
          autoComplete="off"
        />
      </div>

      {notice && (
        <div
          className={`${styles.notice} ${notice.tone === "error" ? styles.noticeError : styles.noticeInfo}`}
          aria-live="polite"
        >
          <span>{notice.message}</span>
          <button className={styles.noticeClose} onClick={() => setNotice(null)} aria-label="Dismiss notice">
            ×
          </button>
        </div>
      )}

      {downloadingZip && (
        <div className={styles.progressCard} aria-live="polite">
          <div className={styles.progressMeta}>
            <strong>Download Photos</strong>
            <span>{zipStatus}</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={zipProgress}
            aria-label="Photo ZIP download progress"
          >
            <div className={styles.progressFill} style={{ width: `${zipProgress}%` }} />
          </div>
          <div className={styles.progressPercent}>{zipProgress}%</div>
        </div>
      )}

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

      <div className={styles.paginationBar}>
        <div className={styles.bulkMeta}>
          {totalCount === 0 ? "No entries to show" : `Showing ${pageStart}-${pageEnd} of ${totalCount}`}
        </div>
        <div className={styles.paginationControls}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
          >
            Prev
          </button>
          <div className={styles.pageNumberStrip} aria-label="Pagination">
            {visiblePageNumbers.map((pageNumber, index) => {
              const previousPage = visiblePageNumbers[index - 1];
              const showGap = previousPage && pageNumber - previousPage > 1;

              return (
                <span key={pageNumber} className={styles.pageNumberWrap}>
                  {showGap && <span className={styles.pageGap}>...</span>}
                  <button
                    className={`${styles.pageNumberBtn} ${pageNumber === page ? styles.pageNumberActive : ""}`}
                    onClick={() => setPage(pageNumber)}
                    disabled={loading}
                    aria-current={pageNumber === page ? "page" : undefined}
                  >
                    {pageNumber}
                  </button>
                </span>
              );
            })}
          </div>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.empty}>Loading...</div>
      ) : error ? (
        <div className={styles.empty} style={{ color: "#c0392b" }}>
          {error}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "44px" }} className={styles.selectionCell}>
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
                <th style={{ width: "52px" }} className={styles.indexCell}>#</th>
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
                filtered.map((entry, index) => {
                  const initials = entry.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={entry.id}>
                      <td className={styles.selectionCell}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(entry.id)}
                          onChange={() => toggleSelection(entry.id)}
                          aria-label={`Select ${entry.name}`}
                          className={styles.rowCheckbox}
                          disabled={deletingIds.length > 0}
                        />
                      </td>
                      <td className={`${styles.rowNum} ${styles.indexCell}`}>{pageStart + index}</td>
                      <td>
                        {entry.photoUrl ? (
                          <Image
                            src={entry.photoUrl}
                            alt={entry.name}
                            className={`${styles.avatar} ${styles.clickableAvatar}`}
                            width={36}
                            height={36}
                            onClick={() => setPreviewImage(entry.photoUrl!)}
                          />
                        ) : (
                          <div className={styles.initials}>{initials}</div>
                        )}
                      </td>
                      <td>
                        <span className={styles.typeBadge} data-type={entry.type || "plant"}>
                          {(entry.type || "plant").toUpperCase()}
                        </span>
                      </td>
                      <td className={styles.nameCell}>
                        <div style={{ fontWeight: 600 }}>{entry.name}</div>
                        {(entry.schoolName || entry.plantName) && (
                          <div style={{ fontSize: "11px", opacity: 0.7 }}>{entry.schoolName || entry.plantName}</div>
                        )}
                        {entry.fathersName && <div style={{ fontSize: "11px", opacity: 0.7 }}>S/O: {entry.fathersName}</div>}
                      </td>
                      <td className={styles.mono}>
                        {entry.type === "school" ? (
                          <div>
                            <div>Class: {entry.class}</div>
                            <div style={{ fontSize: "11px" }}>{entry.phone}</div>
                          </div>
                        ) : (
                          entry.phone
                        )}
                      </td>
                      <td>
                        {entry.type === "school" ? (
                          <div style={{ fontSize: "11px", lineHeight: 1.4 }}>
                            {entry.admissionNo && <div>Adm: {entry.admissionNo}</div>}
                            {entry.bloodGroup && <div>Blood: {entry.bloodGroup}</div>}
                            {entry.dob && <div>DOB: {entry.dob}</div>}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <span className={entry.photoUrl ? styles.badgeYes : styles.badgeNo}>
                          {entry.photoUrl ? "Uploaded" : "Missing"}
                        </span>
                      </td>
                      <td className={styles.timeCell}>
                        {new Date(entry.submittedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(entry.id, entry.name)}
                          title="Delete Entry"
                          aria-label={`Delete ${entry.name}`}
                          disabled={deletingIds.includes(entry.id)}
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

      <div className={styles.paginationBar}>
        <div className={styles.bulkMeta}>
          {missingPhoto > 0 ? `${missingPhoto} item(s) on this page are missing photos` : "All visible entries have photos"}
        </div>
        <div className={styles.paginationControls}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
          >
            Prev
          </button>
          <div className={styles.pageNumberStrip} aria-label="Pagination">
            {visiblePageNumbers.map((pageNumber, index) => {
              const previousPage = visiblePageNumbers[index - 1];
              const showGap = previousPage && pageNumber - previousPage > 1;

              return (
                <span key={pageNumber} className={styles.pageNumberWrap}>
                  {showGap && <span className={styles.pageGap}>...</span>}
                  <button
                    className={`${styles.pageNumberBtn} ${pageNumber === page ? styles.pageNumberActive : ""}`}
                    onClick={() => setPage(pageNumber)}
                    disabled={loading}
                    aria-current={pageNumber === page ? "page" : undefined}
                  >
                    {pageNumber}
                  </button>
                </span>
              );
            })}
          </div>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>

      {previewImage && (
        <div className={styles.lightbox} onClick={() => setPreviewImage(null)}>
          <div className={styles.lightboxContent}>
            <Image src={previewImage} alt="Enlarged user photo" fill className={styles.lightboxImg} />
          </div>
          <button className={styles.lightboxClose} aria-label="Close image preview">×</button>
        </div>
      )}

      {confirmState && (
        <div className={styles.dialogBackdrop} onClick={closeConfirm}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="confirm-dialog-title" className={styles.dialogTitle}>
              {confirmState.title}
            </h2>
            <p className={styles.dialogText}>{confirmState.message}</p>
            <div className={styles.dialogActions}>
              <button className={styles.pageBtn} onClick={closeConfirm} disabled={confirmLoading}>
                Cancel
              </button>
              <button className={styles.dialogDangerBtn} onClick={runConfirmedAction} disabled={confirmLoading}>
                {confirmLoading ? "Working..." : confirmState.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
