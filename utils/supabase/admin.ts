// utils/supabase/admin.ts
import { Database } from "@/app/types/database.types";
import { createClient } from "@supabase/supabase-js";

// ⚠️ 이 파일은 서버에서만 import 해야 함 (Route Handler, Server Action 등)
export const adminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,      // 공개 URL이라 NEXT_PUBLIC OK
  process.env.SUPABASE_SERVICE_ROLE_KEY!,     // 절대 클라이언트로 노출되면 안 됨
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
