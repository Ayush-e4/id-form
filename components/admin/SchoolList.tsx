"use client";

import { useState } from "react";
import styles from "@/app/admin/page.module.css";

type SchoolSummary = {
  slug: string;
  name: string;
  configuredFields: number;
  entryCount: number;
  withPhoto: number;
  lastSubmittedAt: string;
};

export default function SchoolList({ schools }: { schools: SchoolSummary[] }) {
  const [search, setSearch] = useState("");

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(search.toLowerCase()) ||
      school.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder="Search schools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "35%" }}>School Name</th>
              <th style={{ width: "15%" }}>Fields</th>
              <th style={{ width: "15%" }}>Entries</th>
              <th style={{ width: "15%" }}>Photos</th>
              <th style={{ width: "20%" }}>Last Submission</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchools.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  No schools found.
                </td>
              </tr>
            ) : (
              filteredSchools.map((school) => (
                <tr key={school.slug}>
                  <td>
                    <div className={styles.schoolName}>{school.name}</div>
                    <div className={styles.schoolSlug}>{school.slug}</div>
                  </td>
                  <td className={styles.mono}>{school.configuredFields}</td>
                  <td className={styles.mono}>{school.entryCount}</td>
                  <td className={styles.mono}>{school.withPhoto}</td>
                  <td className={styles.timeCell}>
                    {school.lastSubmittedAt
                      ? new Date(school.lastSubmittedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "No data"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
