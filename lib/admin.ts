import { BUCKET, supabase } from "./supabase";
import { schoolConfigs } from "./schools";
import { Submission } from "./types";

export const REPORT_TIME_ZONE = "Asia/Kolkata";
const STORAGE_PAGE_SIZE = 100;

type StorageListItem = {
  name?: string;
  id?: string | null;
  metadata?: {
    size?: number;
    contentLength?: number;
  } | null;
};

type StorageUsage = {
  bytes: number;
  objectCount: number;
};

export function getCalendarDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function buildSchoolSummary(entries: Submission[]) {
  const schoolMap = new Map(
    schoolConfigs.map((school) => [
      school.slug,
      {
        slug: school.slug,
        name: school.name,
        configuredFields: school.fields.length,
        entryCount: 0,
        withPhoto: 0,
        lastSubmittedAt: "",
      },
    ])
  );

  for (const entry of entries) {
    if (!entry.schoolSlug) continue;
    const current = schoolMap.get(entry.schoolSlug) || {
      slug: entry.schoolSlug,
      name: entry.schoolName || entry.schoolSlug,
      configuredFields: 0,
      entryCount: 0,
      withPhoto: 0,
      lastSubmittedAt: "",
    };

    current.entryCount += 1;
    if (entry.photoUrl) current.withPhoto += 1;
    if (!current.lastSubmittedAt || new Date(entry.submittedAt) > new Date(current.lastSubmittedAt)) {
      current.lastSubmittedAt = entry.submittedAt;
    }

    schoolMap.set(entry.schoolSlug, current);
  }

  return Array.from(schoolMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeFolderPath(parentPath: string, name: string) {
  return parentPath ? `${parentPath}/${name}` : name;
}

async function readStorageUsage(path = ""): Promise<StorageUsage> {
  let bytes = 0;
  let objectCount = 0;
  const folders = new Set<string>();

  for (let offset = 0; ; offset += STORAGE_PAGE_SIZE) {
    const { data, error } = await supabase.storage.from(BUCKET).list(path, {
      limit: STORAGE_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const item of data as StorageListItem[]) {
      if (!item.name) continue;

      const size = item.metadata?.size ?? item.metadata?.contentLength;
      if (typeof size === "number") {
        bytes += size;
        objectCount += 1;
        continue;
      }

      folders.add(normalizeFolderPath(path, item.name));
    }

    if (data.length < STORAGE_PAGE_SIZE) {
      break;
    }
  }

  for (const folder of Array.from(folders)) {
    const nestedUsage = await readStorageUsage(folder);
    bytes += nestedUsage.bytes;
    objectCount += nestedUsage.objectCount;
  }

  return { bytes, objectCount };
}

function extractStoragePath(photoUrl: string | null | undefined) {
  if (!photoUrl) return null;

  try {
    const url = new URL(photoUrl);
    const marker = "/object/public/photos/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex >= 0) {
      return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    }

    const pathParts = url.pathname.split("/");
    return decodeURIComponent(pathParts[pathParts.length - 1] || "");
  } catch {
    return null;
  }
}

export async function getPhotoStorageUsage(entries: Submission[]) {
  try {
    const total = await readStorageUsage();
    const referencedPaths = new Set(
      entries
        .map((entry) => entry.photoKey || extractStoragePath(entry.photoUrl))
        .filter((value): value is string => Boolean(value))
    );

    const accumulateLinked = async (path = ""): Promise<StorageUsage> => {
      let bytes = 0;
      let objectCount = 0;
      const folders = new Set<string>();

      for (let offset = 0; ; offset += STORAGE_PAGE_SIZE) {
        const { data, error } = await supabase.storage.from(BUCKET).list(path, {
          limit: STORAGE_PAGE_SIZE,
          offset,
          sortBy: { column: "name", order: "asc" },
        });

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          break;
        }

        for (const item of data as StorageListItem[]) {
          if (!item.name) continue;

          const nestedPath = normalizeFolderPath(path, item.name);
          const size = item.metadata?.size ?? item.metadata?.contentLength;

          if (typeof size === "number") {
            if (referencedPaths.has(nestedPath)) {
              bytes += size;
              objectCount += 1;
            }
            continue;
          }

          folders.add(nestedPath);
        }

        if (data.length < STORAGE_PAGE_SIZE) {
          break;
        }
      }

      for (const folder of Array.from(folders)) {
        const nestedUsage = await accumulateLinked(folder);
        bytes += nestedUsage.bytes;
        objectCount += nestedUsage.objectCount;
      }

      return { bytes, objectCount };
    };

    const linkedUsage = await accumulateLinked();

    return {
      total,
      linked: linkedUsage,
      orphaned: {
        bytes: Math.max(total.bytes - linkedUsage.bytes, 0),
        objectCount: Math.max(total.objectCount - linkedUsage.objectCount, 0),
      },
    };
  } catch (error: any) {
    if (error?.statusCode === "404" || error?.message?.includes("Bucket not found")) {
      return {
        total: { bytes: 0, objectCount: 0 },
        linked: { bytes: 0, objectCount: 0 },
        orphaned: { bytes: 0, objectCount: 0 },
      };
    }

    throw error;
  }
}

export function formatStorageUsage(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
