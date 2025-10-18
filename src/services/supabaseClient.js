import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zkhkzzywjnuppklqtaux.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraGt6enl3am51cHBrbHF0YXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDMxMjYsImV4cCI6MjA3NDcxOTEyNn0.JEft7YjJFCeVRPpT-sZ4sywCbvjRYrKk59biSmAlV3k";

export const supabase = createClient(supabaseUrl, supabaseKey);
