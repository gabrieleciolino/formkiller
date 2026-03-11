import { Database } from "@/lib/db/supabase.types";
import { SupabaseClient } from "@supabase/supabase-js";

export type TypedSupabaseClient = SupabaseClient<Database>;
