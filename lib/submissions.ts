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
