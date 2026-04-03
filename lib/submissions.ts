import { supabase } from "./supabase";
import { Submission } from "./types";

export async function readSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('submittedAt', { ascending: false });
  
  if (error) {
    if (error.code === '42P01') return []; // Relation does not exist
    throw error;
  }
  return data || [];
}

export async function appendSubmission(entry: Submission): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .insert([entry]);

  if (error) throw error;
}

export async function deleteSubmission(id: string): Promise<void> {
  // 1. Get the submission to find photo URL
  const { data: entry } = await supabase
    .from('submissions')
    .select('photoUrl')
    .eq('id', id)
    .single();

  // 2. Delete the photo from storage if it exists
  if (entry?.photoUrl) {
    try {
      const url = new URL(entry.photoUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1]; // Get the filename from the end of the URL
      await supabase.storage.from('photos').remove([fileName]);
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
