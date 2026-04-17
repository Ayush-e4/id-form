import { supabase } from "./supabase";
import { plantConfigs } from "./plants";
import { schoolConfigs } from "./schools";
import { Submission } from "./types";

type SubmissionRow = Record<string, unknown>;
export class SubmissionNotFoundError extends Error {}
const MAX_INSERT_RETRIES = 10;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const REQUIRED_SUBMISSION_COLUMNS = new Set([
  "type",
  "photoKey",
  "sourceSlug",
  "plantSlug",
  "plantName",
  "schoolSlug",
  "schoolName",
]);
const SCHOOL_SLUG_BY_NAME = new Map(
  schoolConfigs.map((school) => [school.name.trim().toLowerCase(), school.slug])
);
const SCHOOL_NAME_BY_SLUG = new Map(
  schoolConfigs.map((school) => [school.slug, school.name])
);
const PLANT_SLUG_BY_NAME = new Map(
  plantConfigs.map((plant) => [plant.name.trim().toLowerCase(), plant.slug])
);
const PLANT_NAME_BY_SLUG = new Map(
  plantConfigs.map((plant) => [plant.slug, plant.name])
);

export interface SubmissionListOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  routeSlug?: string;
  all?: boolean;
}

export interface SubmissionListResult {
  items: Submission[];
  total: number;
  page: number;
  pageSize: number;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseMissingColumn(error: { code?: string; message?: string } | null) {
  if (!error || error.code !== "PGRST204" || !error.message) {
    return null;
  }

  const match = error.message.match(/Could not find the '([^']+)' column/);
  return match?.[1] ?? null;
}

function buildInsertPayload(entry: Submission, omittedColumns: Set<string>) {
  const payload: Record<string, unknown> = {
    id: entry.id,
    name: entry.name,
    phone: entry.phone,
    photoUrl: entry.photoUrl,
    photoKey: entry.photoKey,
    submittedAt: entry.submittedAt,
    type: entry.type,
    sourceSlug: entry.sourceSlug,
    plantSlug: entry.plantSlug,
    plantName: entry.plantName,
    schoolSlug: entry.schoolSlug,
    schoolName: entry.schoolName,
    fathersName: entry.fathersName,
    mothersName: entry.mothersName,
    class: entry.class,
    dob: entry.dob,
    address: entry.address,
    rollNo: entry.rollNo,
    admissionNo: entry.admissionNo,
    height: entry.height,
    weight: entry.weight,
    bloodGroup: entry.bloodGroup,
    houseName: entry.houseName,
  };

  for (const column of Array.from(omittedColumns)) {
    delete payload[column];
  }

  return payload;
}

function normalizeSubmission(row: SubmissionRow): Submission {
  const type = (asOptionalString(row.type) as Submission["type"]) ?? "plant";
  const rawSourceSlug = asOptionalString(row.sourceSlug ?? row.sourceslug);
  const rawPlantSlug = asOptionalString(row.plantSlug ?? row.plantslug);
  const rawPlantName = asOptionalString(row.plantName ?? row.plantname);
  const rawSchoolSlug = asOptionalString(row.schoolSlug ?? row.schoolslug);
  const rawSchoolName = asOptionalString(row.schoolName ?? row.schoolname);
  const normalizedPlantSlug =
    rawPlantSlug ??
    (rawPlantName ? PLANT_SLUG_BY_NAME.get(rawPlantName.trim().toLowerCase()) : undefined);
  const normalizedPlantName =
    rawPlantName ??
    (normalizedPlantSlug ? PLANT_NAME_BY_SLUG.get(normalizedPlantSlug) : undefined);
  const normalizedSchoolSlug =
    rawSchoolSlug ??
    (rawSchoolName ? SCHOOL_SLUG_BY_NAME.get(rawSchoolName.trim().toLowerCase()) : undefined);
  const normalizedSchoolName =
    rawSchoolName ??
    (normalizedSchoolSlug ? SCHOOL_NAME_BY_SLUG.get(normalizedSchoolSlug) : undefined);

  return {
    id: asOptionalString(row.id) ?? "",
    name: asOptionalString(row.name) ?? "",
    phone: asOptionalString(row.phone) ?? "",
    photoUrl: asOptionalString(row.photoUrl ?? row.photourl) ?? null,
    photoKey: asOptionalString(row.photoKey ?? row.photokey) ?? null,
    submittedAt: asOptionalString(row.submittedAt ?? row.submittedat) ?? new Date(0).toISOString(),
    type,
    sourceSlug: rawSourceSlug ?? normalizedSchoolSlug ?? normalizedPlantSlug,
    plantSlug: normalizedPlantSlug ?? (type === "plant" ? "bml-plant" : undefined),
    plantName: normalizedPlantName ?? (type === "plant" ? "BML Plant" : undefined),
    schoolSlug: normalizedSchoolSlug,
    schoolName: normalizedSchoolName,
    fathersName: asOptionalString(row.fathersName ?? row.fathersname),
    mothersName: asOptionalString(row.mothersName ?? row.mothersname),
    class: asOptionalString(row.class),
    dob: asOptionalString(row.dob),
    address: asOptionalString(row.address),
    rollNo: asOptionalString(row.rollNo ?? row.rollno),
    admissionNo: asOptionalString(row.admissionNo ?? row.admissionno),
    height: asOptionalString(row.height),
    weight: asOptionalString(row.weight),
    bloodGroup: asOptionalString(row.bloodGroup ?? row.bloodgroup),
    houseName: asOptionalString(row.houseName ?? row.housename),
  };
}

function filterSubmissions(entries: Submission[], options: SubmissionListOptions) {
  const routeSlug = options.routeSlug?.trim();
  const search = options.search?.trim().toLowerCase();

  let filtered = entries;

  if (routeSlug && routeSlug !== "all") {
    filtered = filtered.filter(
      (entry) =>
        entry.sourceSlug === routeSlug ||
        entry.schoolSlug === routeSlug ||
        entry.plantSlug === routeSlug
    );
  }

  if (search) {
    filtered = filtered.filter((entry) => {
      return [
        entry.name,
        entry.sourceSlug,
        entry.plantName,
        entry.plantSlug,
        entry.schoolName,
        entry.schoolSlug,
        entry.phone,
        entry.admissionNo,
        entry.class,
      ].some((value) => value?.toLowerCase().includes(search));
    });
  }

  return filtered;
}

export async function readSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('submittedAt', { ascending: false });
  
  if (error) {
    if (error.code === '42P01') return []; // Relation does not exist
    throw error;
  }
  return (data || []).map((row) => normalizeSubmission(row as SubmissionRow));
}

export async function readSubmissionsPage(options: SubmissionListOptions = {}): Promise<SubmissionListResult> {
  const pageSize = options.all
    ? MAX_PAGE_SIZE * 50
    : Math.min(Math.max(options.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const page = options.all ? 1 : Math.max(options.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const entries = await readSubmissions();
  const filtered = filterSubmissions(entries, options);

  return {
    items: options.all ? filtered : filtered.slice(from, to),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function appendSubmission(entry: Submission): Promise<void> {
  const omittedColumns = new Set<string>();

  for (let attempt = 0; attempt < MAX_INSERT_RETRIES; attempt += 1) {
    const payload = buildInsertPayload(entry, omittedColumns);
    const { error } = await supabase
      .from("submissions")
      .insert([payload]);

    if (!error) {
      return;
    }

    const missingColumn = parseMissingColumn(error);
    if (!missingColumn || omittedColumns.has(missingColumn)) {
      throw error;
    }

    if (REQUIRED_SUBMISSION_COLUMNS.has(missingColumn)) {
      throw new Error(
        `Supabase schema is missing required submissions column "${missingColumn}". Run the latest migrations before accepting new submissions.`
      );
    }

    omittedColumns.add(missingColumn);
  }

  throw new Error("Failed to insert submission after retrying unsupported columns");
}

export async function deleteSubmission(id: string): Promise<void> {
  // 1. Get the submission to find the storage object
  type SubmissionDeleteLookup = { photoUrl?: string | null; photoKey?: string | null };
  let entry: SubmissionDeleteLookup | null = null;

  const initialLookup = await supabase
    .from('submissions')
    .select('photoUrl, photoKey')
    .eq('id', id)
    .single();

  let selectError = initialLookup.error;
  let selectedEntry: SubmissionDeleteLookup | null = initialLookup.data;

  if (selectError?.code === "42703") {
    const fallbackResult = await supabase
      .from("submissions")
      .select("photoUrl")
      .eq("id", id)
      .single();

    selectedEntry = fallbackResult.data as SubmissionDeleteLookup | null;
    selectError = fallbackResult.error;
  }

  if (selectError) {
    if (selectError.code === "PGRST116") {
      throw new SubmissionNotFoundError(`Submission ${id} was not found`);
    }
    throw selectError;
  }

  entry = selectedEntry;

  // 2. Delete the photo from storage if it exists
  const storagePath =
    asOptionalString(entry?.photoKey) ||
    (() => {
      const photoUrl = asOptionalString(entry?.photoUrl);
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
    })();

  if (storagePath) {
    try {
      const { error: storageError } = await supabase.storage.from("photos").remove([storagePath]);
      if (storageError) {
        console.error("Failed to delete storage file:", storageError);
      }
    } catch (e) {
      console.error("Failed to delete storage file:", e);
    }
  }

  // 3. Delete the database record
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
