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

const [mapId, nodeId] = process.argv.slice(2);
if (!mapId || !nodeId) {
  throw new Error("Usage: node scripts/repair-map-expansion.mjs <mapId> <nodeId>");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function getRoot(mind) {
  return mind?.nodeData || mind?.node || mind?.data?.nodeData || null;
}

function findNode(root, targetId) {
  if (!root) return null;
  const stack = [root];
  while (stack.length) {
    const current = stack.shift();
    if (String(current?.id || "") === targetId) return current;
    const children = Array.isArray(current?.children) ? current.children : [];
    stack.unshift(...children);
  }
  return null;
}

function countNodes(root) {
  let count = 0;
  const stack = root ? [root] : [];
  while (stack.length) {
    const current = stack.shift();
    count += 1;
    const children = Array.isArray(current?.children) ? current.children : [];
    stack.unshift(...children);
  }
  return count;
}

const { data: map, error: mapError } = await supabase
  .from("maps")
  .select("id,mind_elixir,structure_phase,extract_error")
  .eq("id", mapId)
  .maybeSingle();

if (mapError) throw new Error(`maps: ${mapError.message}`);
if (!map?.mind_elixir) throw new Error(`map mind_elixir not found: ${mapId}`);

const { data: expansion, error: expansionError } = await supabase
  .from("map_node_expansions")
  .select("id,node_id,status,children_json,error_message,completed_at")
  .eq("map_id", mapId)
  .eq("node_id", nodeId)
  .not("children_json", "is", null)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (expansionError) throw new Error(`map_node_expansions: ${expansionError.message}`);
if (!expansion?.children_json || !Array.isArray(expansion.children_json)) {
  throw new Error(`No cached children_json found for ${mapId}/${nodeId}`);
}

const nextMind = structuredClone(map.mind_elixir);
const root = getRoot(nextMind);
const target = findNode(root, nodeId);

if (!target) {
  throw new Error(`Target node not found in mind_elixir: ${nodeId}`);
}

const beforeChildCount = Array.isArray(target.children) ? target.children.length : 0;
target.children = expansion.children_json;
target.expanded = true;

const now = new Date().toISOString();
const { error: updateMapError } = await supabase
  .from("maps")
  .update({
    mind_elixir: nextMind,
    structure_phase: "complete",
    extract_error: null,
    updated_at: now,
  })
  .eq("id", mapId);

if (updateMapError) throw new Error(`maps.update: ${updateMapError.message}`);

const { error: updateExpansionError } = await supabase
  .from("map_node_expansions")
  .update({
    status: "done",
    error_message: null,
    completed_at: expansion.completed_at || now,
    updated_at: now,
  })
  .eq("id", expansion.id);

if (updateExpansionError) {
  throw new Error(`map_node_expansions.update: ${updateExpansionError.message}`);
}

const { error: updateReservationError } = await supabase
  .from("youtube_reservations")
  .update({
    status: "ready",
    status_reason:
      "구조맵 세부 보강을 반영했습니다. 관리자 확인 후 완료 메일을 발송해 주세요.",
    updated_at: now,
  })
  .eq("result_map_id", mapId);

if (updateReservationError) {
  throw new Error(`youtube_reservations.update: ${updateReservationError.message}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mapId,
      nodeId,
      beforeChildCount,
      afterChildCount: target.children.length,
      totalNodes: countNodes(root),
      structurePhase: "complete",
      expansionId: expansion.id,
    },
    null,
    2
  )
);
