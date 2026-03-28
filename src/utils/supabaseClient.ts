import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase environment variables are missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.");
}

// Only create the client if we have a URL, otherwise export a dummy or handle it gracefully
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);
