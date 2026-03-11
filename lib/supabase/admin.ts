import { Database } from "@/lib/db/supabase.types";
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);
