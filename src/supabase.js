import { createClient } from "@supabase/supabase-js";

// Values come from .env (VITE_ prefix) and are inlined at build time.
// Never use the secret key (sb_secret_...) here: everything in this file is public.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
