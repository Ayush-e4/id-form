import { supabase } from "./supabase";
import { Submission } from "./types";

type SubmissionRow = Record<string, unknown>;
export class SubmissionNotFoundError extends Error {}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function normalizeSubmission(row: SubmissionRow): Submission {
  const type = (asOptionalString(row.type) as Submission["type"]) ?? "plant";
  const normalizedPlantSlug = asOptionalString(row.plantSlug ?? row.plantslug);
  const normalizedPlantName = asOptionalString(row.plantName ?? row.plantname);

  return {
    id: asOptionalString(row.id) ?? "",
    name: asOptionalString(row.name) ?? "",
    phone: asOptionalString(row.phone) ?? "",
    photoUrl: asOptionalString(row.photoUrl ?? row.photourl) ?? null,
    photoKey: asOptionalString(row.photoKey ?? row.photokey) ?? null,
    submittedAt: asOptionalString(row.submittedAt ?? row.submittedat) ?? new Date(0).toISOString(),
    type,
    plantSlug: normalizedPlantSlug ?? (type === "plant" ? "bml-plant" : undefined),
    plantName: normalizedPlantName ?? (type === "plant" ? "BML Plant" : undefined),
    schoolSlug: asOptionalString(row.schoolSlug ?? row.schoolslug),
    schoolName: asOptionalString(row.schoolName ?? row.schoolname),
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

export async function appendSubmission(entry: Submission): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .insert([entry]);

  if (error) throw error;
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
      await supabase.storage.from("photos").remove([storagePath]);
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
