import { adminSupabase } from "@/utils/supabase/admin";

const DELETED_USER_ID = "00000000-0000-0000-0000-000000000000";

async function ensureOk<T>(
  label: string,
  promise: PromiseLike<{ data: T | null; error: { message: string } | null }>
) {
  const { data, error } = await promise;
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  return data;
}

function idsFromRows(rows: Array<{ id: string }> | null | undefined) {
  return Array.from(new Set((rows ?? []).map((row) => row.id).filter(Boolean)));
}

type DeleteAccountDataOptions = {
  deleteAuthUser?: boolean;
};

export async function deleteAccountData(
  userId: string,
  options: DeleteAccountDataOptions = {}
) {
  const [maps, summaries, creditTransactions, creditLots] = await Promise.all([
    ensureOk(
      "maps.select",
      adminSupabase.from("maps").select("id").eq("user_id", userId)
    ),
    ensureOk(
      "summaries.select",
      adminSupabase.from("summaries").select("id").eq("user_id", userId)
    ),
    ensureOk(
      "credit_transactions.select",
      adminSupabase
        .from("credit_transactions")
        .select("id")
        .eq("user_id", userId)
    ),
    ensureOk(
      "credit_lots.select",
      adminSupabase.from("credit_lots").select("id").eq("user_id", userId)
    ),
  ]);

  const mapIds = idsFromRows(maps);
  const summaryIds = idsFromRows(summaries);
  const creditTransactionIds = idsFromRows(creditTransactions);
  const creditLotIds = idsFromRows(creditLots);

  if (summaryIds.length > 0) {
    await ensureOk(
      "summary_questions.delete",
      adminSupabase.from("summary_questions").delete().in("summary_id", summaryIds)
    );
    await ensureOk(
      "summary_keywords.delete",
      adminSupabase.from("summary_keywords").delete().in("summary_id", summaryIds)
    );
    await ensureOk(
      "terminologies.delete",
      adminSupabase.from("terminologies").delete().in("summary_id", summaryIds)
    );
  }

  if (mapIds.length > 0) {
    await ensureOk(
      "map_terms.delete",
      adminSupabase.from("map_terms").delete().in("map_id", mapIds)
    );
    await ensureOk(
      "map_notes.delete",
      adminSupabase.from("map_notes").delete().in("map_id", mapIds)
    );
    await ensureOk(
      "map_user_states.delete",
      adminSupabase.from("map_user_states").delete().in("map_id", mapIds)
    );
    await ensureOk(
      "map_term_requests.delete",
      adminSupabase.from("map_term_requests").delete().in("map_id", mapIds)
    );
  }

  if (creditLotIds.length > 0) {
    await ensureOk(
      "credit_lot_consumptions.delete.by_lot",
      adminSupabase
        .from("credit_lot_consumptions")
        .delete()
        .in("lot_id", creditLotIds)
    );
  }

  if (creditTransactionIds.length > 0) {
    await ensureOk(
      "credit_lot_consumptions.delete.by_transaction",
      adminSupabase
        .from("credit_lot_consumptions")
        .delete()
        .in("credit_transaction_id", creditTransactionIds)
    );
  }

  await ensureOk(
    "map_generation_chunks.delete",
    adminSupabase.from("map_generation_chunks").delete().eq("user_id", userId)
  );
  await ensureOk(
    "map_generation_jobs.delete",
    adminSupabase.from("map_generation_jobs").delete().eq("user_id", userId)
  );
  await ensureOk(
    "summaries.delete",
    adminSupabase.from("summaries").delete().eq("user_id", userId)
  );
  await ensureOk(
    "youtube_scripts.delete",
    adminSupabase.from("youtube_scripts").delete().eq("user_id", userId)
  );
  await ensureOk(
    "notifications.delete",
    adminSupabase.from("notifications").delete().eq("user_id", userId)
  );
  await ensureOk(
    "support_tickets.delete",
    adminSupabase.from("support_tickets").delete().eq("user_id", userId)
  );
  await ensureOk(
    "store_admins.delete",
    adminSupabase.from("store_admins").delete().eq("user_id", userId)
  );
  await ensureOk(
    "credit_lots.delete",
    adminSupabase.from("credit_lots").delete().eq("user_id", userId)
  );
  await ensureOk(
    "credit_transactions.delete",
    adminSupabase.from("credit_transactions").delete().eq("user_id", userId)
  );
  await ensureOk(
    "maps.delete",
    adminSupabase.from("maps").delete().eq("user_id", userId)
  );
  await ensureOk(
    "payments.anonymize",
    adminSupabase
      .from("payments")
      .update({
        user_id: DELETED_USER_ID,
        provider_customer_id: null,
        provider_payment_key: null,
        raw_payload: null,
        receipt_url: null,
      })
      .eq("user_id", userId)
  );
  await ensureOk(
    "profiles.delete",
    adminSupabase.from("profiles").delete().eq("id", userId)
  );

  if (options.deleteAuthUser) {
    const { error } = await adminSupabase.auth.admin.deleteUser(userId);
    if (error && !error.message.toLowerCase().includes("not found")) {
      throw new Error(`auth.deleteUser: ${error.message}`);
    }
  }
}
