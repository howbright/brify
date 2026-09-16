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

const mapId = process.argv[2];
if (!mapId) {
  throw new Error("Usage: node scripts/inspect-map-structure.mjs <mapId>");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function getRoot(mind) {
  return mind?.nodeData || mind?.node || mind?.data?.nodeData || null;
}

function walk(root, visitor) {
  const stack = root ? [{ node: root, depth: 0, path: [] }] : [];
  while (stack.length) {
    const item = stack.shift();
    visitor(item);
    const children = Array.isArray(item.node?.children) ? item.node.children : [];
    children.forEach((child, index) => {
      stack.push({ node: child, depth: item.depth + 1, path: [...item.path, index] });
    });
  }
}

function nodeText(node) {
  return String(node?.topic || node?.title || node?.dangerouslySetInnerHTML || "").replace(
    /\s+/g,
    " "
  ).trim();
}

function summarizeMind(mind) {
  const root = getRoot(mind);
  let totalNodes = 0;
  let maxDepth = 0;
  let leaves = 0;
  let nodesWithSourceRange = 0;
  const rootChildren = Array.isArray(root?.children) ? root.children : [];
  const firstChild = rootChildren[0] || null;

  walk(root, ({ node, depth }) => {
    totalNodes += 1;
    maxDepth = Math.max(maxDepth, depth);
    const children = Array.isArray(node?.children) ? node.children : [];
    if (children.length === 0) leaves += 1;
    const meta = node?.meta || {};
    if (
      Number.isFinite(meta.sourceStart) ||
      Number.isFinite(meta.sourceEnd) ||
      Number.isFinite(meta.source_start) ||
      Number.isFinite(meta.source_end) ||
      Number.isFinite(meta.startChar) ||
      Number.isFinite(meta.endChar)
    ) {
      nodesWithSourceRange += 1;
    }
  });

  return {
    rootTopic: nodeText(root),
    totalNodes,
    maxDepth,
    leaves,
    rootChildCount: rootChildren.length,
    nodesWithSourceRange,
    firstChild: firstChild
      ? {
          id: firstChild.id,
          topic: nodeText(firstChild),
          childCount: Array.isArray(firstChild.children) ? firstChild.children.length : 0,
          expanded: firstChild.expanded,
          meta: firstChild.meta || null,
          keys: Object.keys(firstChild),
        }
      : null,
    rootChildren: rootChildren.map((child) => ({
      id: child.id,
      topic: nodeText(child).slice(0, 100),
      childCount: Array.isArray(child.children) ? child.children.length : 0,
      hasMeta: Boolean(child.meta),
      meta: child.meta || null,
    })),
  };
}

const { data: map, error: mapError } = await supabase
  .from("maps")
  .select(
    "id,user_id,created_at,updated_at,title,short_title,youtube_title,channel_name,source_url,source_type,map_status,extract_status,structure_phase,source_char_count,required_credits,credits_charged,output_language,ai_processing_ms,extracted_text,mind_elixir,mind_elixir_draft,extract_error,extract_job_id"
  )
  .eq("id", mapId)
  .maybeSingle();

if (mapError) throw new Error(`maps: ${mapError.message}`);
if (!map) throw new Error(`map not found: ${mapId}`);

const [{ data: jobs, error: jobsError }, { data: chunks, error: chunksError }, { data: expansions, error: expansionsError }, { data: reservations, error: reservationsError }] =
  await Promise.all([
    supabase
      .from("map_generation_jobs")
      .select(
        "id,status,current_step,error_message,total_char_count,chunk_count,source_type,source_url,youtube_title,title,created_at,started_at,completed_at,updated_at,final_map_id"
      )
      .eq("final_map_id", mapId)
      .order("created_at", { ascending: false }),
    supabase
      .from("map_generation_chunks")
      .select(
        "id,job_id,status,chunk_index,chunk_count,char_count,start_char,end_char,error_message,completed_at,structure_result"
      )
      .eq("chunk_map_id", mapId)
      .order("chunk_index", { ascending: true }),
    supabase
      .from("map_node_expansions")
      .select(
        "id,node_id,status,attempt_count,error_message,queue_job_id,created_at,started_at,completed_at,updated_at,children_json"
      )
      .eq("map_id", mapId)
      .order("created_at", { ascending: false }),
    supabase
      .from("youtube_reservations")
      .select(
        "id,status,status_reason,url,video_id,requester_email,required_credits,charged_credits,manual_email_sent_at,user_email_sent_at,created_at,updated_at,processed_at,result_map_id"
      )
      .eq("result_map_id", mapId)
      .order("created_at", { ascending: false }),
  ]);

if (jobsError) throw new Error(`jobs: ${jobsError.message}`);
if (chunksError) throw new Error(`chunks: ${chunksError.message}`);
if (expansionsError) throw new Error(`expansions: ${expansionsError.message}`);
if (reservationsError) throw new Error(`reservations: ${reservationsError.message}`);

const summary = {
  map: {
    id: map.id,
    userId: String(map.user_id).slice(0, 8),
    title: map.title,
    youtubeTitle: map.youtube_title,
    channelName: map.channel_name,
    sourceUrl: map.source_url,
    sourceType: map.source_type,
    mapStatus: map.map_status,
    extractStatus: map.extract_status,
    structurePhase: map.structure_phase,
    sourceCharCount: map.source_char_count,
    requiredCredits: map.required_credits,
    creditsCharged: map.credits_charged,
    outputLanguage: map.output_language,
    aiProcessingMs: map.ai_processing_ms,
    extractError: map.extract_error,
    extractJobId: map.extract_job_id,
    extractedTextPreview: String(map.extracted_text || "").slice(0, 500),
  },
  mindElixir: summarizeMind(map.mind_elixir),
  mindElixirDraft: map.mind_elixir_draft ? summarizeMind(map.mind_elixir_draft) : null,
  jobs: (jobs || []).map((job) => ({
    ...job,
    error_message: job.error_message ? String(job.error_message).slice(0, 300) : null,
  })),
  chunks: (chunks || []).map((chunk) => ({
    id: chunk.id,
    job_id: chunk.job_id,
    status: chunk.status,
    chunk_index: chunk.chunk_index,
    chunk_count: chunk.chunk_count,
    char_count: chunk.char_count,
    start_char: chunk.start_char,
    end_char: chunk.end_char,
    error_message: chunk.error_message,
    completed_at: chunk.completed_at,
    structureSummary: summarizeMind(chunk.structure_result),
  })),
  expansions: (expansions || []).map((expansion) => ({
    id: expansion.id,
    node_id: expansion.node_id,
    status: expansion.status,
    attempt_count: expansion.attempt_count,
    error_message: expansion.error_message,
    queue_job_id: expansion.queue_job_id,
    created_at: expansion.created_at,
    started_at: expansion.started_at,
    completed_at: expansion.completed_at,
    updated_at: expansion.updated_at,
    childCount: Array.isArray(expansion.children_json) ? expansion.children_json.length : null,
    childrenPreview: Array.isArray(expansion.children_json)
      ? expansion.children_json.slice(0, 3).map((child) => ({
          id: child?.id,
          topic: nodeText(child).slice(0, 120),
          childCount: Array.isArray(child?.children) ? child.children.length : 0,
        }))
      : null,
  })),
  reservations: reservations || [],
};

console.log(JSON.stringify(summary, null, 2));
