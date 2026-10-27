import { supabase } from "./supabase.js";

// Rows from the public.images table, each with a ready-to-use public url.
export async function getImages() {
  const { data, error } = await supabase.from("images").select("*").order("filename");
  if (error) throw error;
  return data.map((row) => ({
    ...row,
    url: supabase.storage.from("images").getPublicUrl(row.filename).data.publicUrl,
  }));
}
