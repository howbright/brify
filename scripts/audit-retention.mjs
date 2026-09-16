import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

Object.assign(process.env, loadEnv(path.join(process.cwd(), ".env")));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const days = Number(process.argv[2] || 120);
const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function percent(numerator, denominator) {
  return denominator ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

function groupCount(rows, getKey) {
  const counts = new Map();
  for (const row of rows) {
    const key = getKey(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function day(value) {
  return String(value || "").slice(0, 10);
}

function shortId(id) {
  return String(id || "").slice(0, 8);
}

async function selectAll(table, columns, queryBuilder) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    let query = supabase.from(table).select(columns).range(from, from + pageSize - 1);
    if (queryBuilder) query = queryBuilder(query);
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

const maps = await selectAll(
  "maps",
  "id,user_id,created_at,updated_at,title,short_title,source_type,map_status,extract_status,structure_phase,credits_charged,required_credits,notes_count,terms_count,source_char_count,share_enabled,output_language,ai_processing_ms",
  (query) => query.gte("created_at", since).order("created_at", { ascending: true })
);

const events = await selectAll(
  "map_open_events",
  "id,map_id,user_id,access_mode,opened_at,session_key,locale",
  (query) => query.gte("opened_at", since).order("opened_at", { ascending: true })
);

const profiles = await selectAll(
  "profiles",
  "id,email,created_at,credits_free,credits_paid,locale,terms_accepted",
  (query) => query.gte("created_at", since).order("created_at", { ascending: true })
);

const notes = await selectAll(
  "map_notes",
  "id,map_id,user_id,created_at,updated_at",
  (query) => query.gte("created_at", since)
);

const terms = await selectAll(
  "map_terms",
  "id,map_id,created_at,lang",
  (query) => query.gte("created_at", since)
);

const transactions = await selectAll(
  "credit_transactions",
  "id,user_id,map_id,payment_id,tx_type,source,delta_total,created_at",
  (query) => query.gte("created_at", since)
);

const payments = await selectAll(
  "payments",
  "id,user_id,status,amount,created_at,provider",
  (query) => query.gte("created_at", since)
);

const mapsByUser = groupCount(maps, (row) => row.user_id);
const creatorIds = Array.from(mapsByUser.keys());
const usersWithTwoPlusMaps = creatorIds.filter((id) => mapsByUser.get(id) >= 2);
const usersWithThreePlusMaps = creatorIds.filter((id) => mapsByUser.get(id) >= 3);
const eventsByMap = new Map();

for (const event of events) {
  const list = eventsByMap.get(event.map_id) || [];
  list.push(event);
  eventsByMap.set(event.map_id, list);
}

const mapsOwnerReopenedAfter24h = maps.filter((map) =>
  (eventsByMap.get(map.id) || []).some(
    (event) =>
      event.access_mode === "owner" &&
      new Date(event.opened_at).getTime() - new Date(map.created_at).getTime() >=
        24 * 60 * 60 * 1000
  )
);

const usersOwnerReopenedAfter24h = new Set(mapsOwnerReopenedAfter24h.map((map) => map.user_id));
const usersCreatedSecondAfter24h = new Set();
const mapRowsByUser = new Map();

for (const map of maps) {
  const list = mapRowsByUser.get(map.user_id) || [];
  list.push(map);
  mapRowsByUser.set(map.user_id, list);
}

for (const [userId, userMaps] of mapRowsByUser) {
  userMaps.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  if (
    userMaps.length >= 2 &&
    new Date(userMaps[1].created_at).getTime() - new Date(userMaps[0].created_at).getTime() >=
      24 * 60 * 60 * 1000
  ) {
    usersCreatedSecondAfter24h.add(userId);
  }
}

const lengthBuckets = {
  "<=500": 0,
  "<=2000": 0,
  "<=8000": 0,
  "<=20000": 0,
  "<=50000": 0,
  ">50000": 0,
};

for (const map of maps) {
  const charCount = map.source_char_count ?? 0;
  if (charCount <= 500) lengthBuckets["<=500"] += 1;
  else if (charCount <= 2000) lengthBuckets["<=2000"] += 1;
  else if (charCount <= 8000) lengthBuckets["<=8000"] += 1;
  else if (charCount <= 20000) lengthBuckets["<=20000"] += 1;
  else if (charCount <= 50000) lengthBuckets["<=50000"] += 1;
  else lengthBuckets[">50000"] += 1;
}

const paidPayments = payments.filter((payment) =>
  ["completed", "paid", "confirmed", "done"].some((status) =>
    String(payment.status).toLowerCase().includes(status)
  )
);

const mapsOpened = maps.filter((map) => eventsByMap.has(map.id));
const mapsWithTwoOpens = maps.filter((map) => (eventsByMap.get(map.id) || []).length >= 2);
const mapsAnyOpenAfter24h = maps.filter((map) =>
  (eventsByMap.get(map.id) || []).some(
    (event) =>
      new Date(event.opened_at).getTime() - new Date(map.created_at).getTime() >=
      24 * 60 * 60 * 1000
  )
);
const mapsEditedAfter10Min = maps.filter(
  (map) => new Date(map.updated_at).getTime() - new Date(map.created_at).getTime() > 10 * 60 * 1000
);

const mapDays = Object.fromEntries(groupCount(maps, (row) => day(row.created_at)).entries());
const topUsers = Array.from(mapsByUser.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([userId, count]) => ({
    user: shortId(userId),
    maps: count,
    ownerReopenedAfter24h: usersOwnerReopenedAfter24h.has(userId),
  }));
const topCreatorId = topUsers[0]?.user
  ? Array.from(mapsByUser.entries()).sort((a, b) => b[1] - a[1])[0][0]
  : null;
const mapsWithoutTopCreator = topCreatorId
  ? maps.filter((map) => map.user_id !== topCreatorId)
  : maps;
const creatorsWithoutTopCreator = new Set(mapsWithoutTopCreator.map((map) => map.user_id));
const usersOwnerReopenedAfter24hWithoutTopCreator = new Set(
  mapsOwnerReopenedAfter24h
    .filter((map) => map.user_id !== topCreatorId)
    .map((map) => map.user_id)
);
const mapCountsWithoutTopCreator = groupCount(mapsWithoutTopCreator, (map) => map.user_id);
const usersWithTwoPlusMapsWithoutTopCreator = Array.from(mapCountsWithoutTopCreator.values()).filter(
  (count) => count >= 2
).length;

const recentMaps = maps.slice(-20).map((map) => ({
  date: day(map.created_at),
  title: String(map.short_title || map.title || "").slice(0, 70),
  user: shortId(map.user_id),
  status: map.map_status,
  source: map.source_type,
  chars: map.source_char_count,
  notes: map.notes_count,
  terms: map.terms_count,
  opens: (eventsByMap.get(map.id) || []).length,
}));

const result = {
  periodDays: days,
  profiles: profiles.length,
  maps: maps.length,
  uniqueCreators: creatorIds.length,
  usersWithTwoPlusMaps: usersWithTwoPlusMaps.length,
  usersWithThreePlusMaps: usersWithThreePlusMaps.length,
  repeatCreatorRate: percent(usersWithTwoPlusMaps.length, creatorIds.length),
  secondMapAfter24hUsers: usersCreatedSecondAfter24h.size,
  secondMapAfter24hRate: percent(usersCreatedSecondAfter24h.size, creatorIds.length),
  statuses: Object.fromEntries(groupCount(maps, (row) => row.map_status).entries()),
  extractStatuses: Object.fromEntries(groupCount(maps, (row) => row.extract_status).entries()),
  structurePhases: Object.fromEntries(
    groupCount(maps, (row) => row.structure_phase || "null").entries()
  ),
  sourceTypes: Object.fromEntries(groupCount(maps, (row) => row.source_type).entries()),
  outputLanguages: Object.fromEntries(groupCount(maps, (row) => row.output_language || "null").entries()),
  mapOpenEvents: events.length,
  mapsOpened: mapsOpened.length,
  mapsOpenedRate: percent(mapsOpened.length, maps.length),
  mapsWithTwoOpens: mapsWithTwoOpens.length,
  mapsWithTwoOpensRate: percent(mapsWithTwoOpens.length, maps.length),
  mapsOwnerReopenedAfter24h: mapsOwnerReopenedAfter24h.length,
  ownerReopenAfter24hRate: percent(mapsOwnerReopenedAfter24h.length, maps.length),
  usersOwnerReopenedAfter24h: usersOwnerReopenedAfter24h.size,
  userOwnerReopenAfter24hRate: percent(usersOwnerReopenedAfter24h.size, creatorIds.length),
  mapsAnyOpenAfter24h: mapsAnyOpenAfter24h.length,
  mapsEditedAfter10Min: mapsEditedAfter10Min.length,
  mapsEditedAfter10MinRate: percent(mapsEditedAfter10Min.length, maps.length),
  mapsWithNotes: maps.filter((map) => map.notes_count > 0).length,
  mapsWithNotesRate: percent(
    maps.filter((map) => map.notes_count > 0).length,
    maps.length
  ),
  mapsWithTerms: maps.filter((map) => map.terms_count > 0).length,
  mapsWithTermsRate: percent(
    maps.filter((map) => map.terms_count > 0).length,
    maps.length
  ),
  sharedMaps: maps.filter((map) => map.share_enabled).length,
  sharedMapsRate: percent(
    maps.filter((map) => map.share_enabled).length,
    maps.length
  ),
  notesRows: notes.length,
  termsRows: terms.length,
  consumedCreditTransactions: transactions.filter((tx) => tx.map_id && tx.delta_total < 0).length,
  payments: payments.length,
  paidPayments: paidPayments.length,
  lengthBuckets,
  mapsByDayLast30: Object.fromEntries(Object.entries(mapDays).slice(-30)),
  topUsers,
  withoutTopCreator: {
    maps: mapsWithoutTopCreator.length,
    uniqueCreators: creatorsWithoutTopCreator.size,
    usersWithTwoPlusMaps: usersWithTwoPlusMapsWithoutTopCreator,
    repeatCreatorRate: percent(usersWithTwoPlusMapsWithoutTopCreator, creatorsWithoutTopCreator.size),
    usersOwnerReopenedAfter24h: usersOwnerReopenedAfter24hWithoutTopCreator.size,
    userOwnerReopenAfter24hRate: percent(
      usersOwnerReopenedAfter24hWithoutTopCreator.size,
      creatorsWithoutTopCreator.size
    ),
    mapsOwnerReopenedAfter24h: mapsOwnerReopenedAfter24h.filter(
      (map) => map.user_id !== topCreatorId
    ).length,
    ownerReopenAfter24hRate: percent(
      mapsOwnerReopenedAfter24h.filter((map) => map.user_id !== topCreatorId).length,
      mapsWithoutTopCreator.length
    ),
  },
  recentMaps,
};

console.log(JSON.stringify(result, null, 2));
