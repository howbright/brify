// utils/supabase/admin.ts  ← 새로 추가
import { Database } from "@/app/types/database.types";
import { createClient } from "@supabase/supabase-js";

export const adminSupabase = await createClient<Database>(
  process.env.SUPABASE_URL!,               // ⚠️ NEXT_PUBLIC 아님
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ⚠️ NEXT_PUBLIC 절대 금지
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
