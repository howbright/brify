import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/server";

type MindNode = {
  id?: string;
  topic?: string;
  root?: boolean;
  expanded?: boolean;
  children?: MindNode[];
  [key: string]: any;
};

type MergeSourcePart = {
  title: string;
  text: string;
};

function getRootNode(data: any): MindNode | null {
  if (!data) return null;
  if (data.nodeData) return data.nodeData as MindNode;
  if (data.data?.nodeData) return data.data.nodeData as MindNode;
  if (data.root?.nodeData) return data.root.nodeData as MindNode;
  if (data.topic || data.children) return data as MindNode;
  return null;
}

function cloneData<T>(value: T): T {
  try {
    if (typeof structuredClone === "function") return structuredClone(value);
  } catch {}
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function remapNodeIds(node: MindNode): MindNode {
  const next: MindNode = { ...node, id: uuidv4() };
  if (next.root) {
    delete next.root;
  }
  if (Array.isArray(node.children) && node.children.length > 0) {
    next.children = node.children.map((child) => remapNodeIds(child));
  } else {
    delete next.children;
  }
  if ("parent" in next) {
    delete next.parent;
  }
  return next;
}

function mergeSourceText(parts: MergeSourcePart[]) {
  return parts
    .map((part, index) => {
      const title = part.title.trim() || `Map ${index + 1}`;
      return `# ${index + 1}. ${title}\n\n${part.text.trim()}`;
    })
    .join("\n\n---\n\n");
}

function getEarliestIsoDate(values: Array<string | null | undefined>) {
  const dates = values
    .map((value) => {
      if (!value) return null;
      const time = new Date(value).getTime();
      return Number.isFinite(time) ? { value, time } : null;
    })
    .filter((value): value is { value: string; time: number } => Boolean(value));

  if (dates.length === 0) return null;
  return dates.reduce((earliest, current) =>
    current.time < earliest.time ? current : earliest
  ).value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const rootTitle = String(body?.rootTitle ?? "").trim();
    const orderedMapIds = Array.isArray(body?.orderedMapIds)
      ? body.orderedMapIds
          .map((id: unknown) => String(id))
          .filter(Boolean)
      : [];

    if (!rootTitle) {
      return NextResponse.json(
        { error: "root_title_required" },
        { status: 400 }
      );
    }
    if (orderedMapIds.length < 2) {
      return NextResponse.json(
        { error: "not_enough_maps" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("maps")
      .select(
        "id,title,tags,mind_elixir,mind_elixir_draft,extracted_text,source_expires_at,source_retention_hours"
      )
      .in("id", orderedMapIds);

    if (error) throw error;
    const rows = data ?? [];
    const rowById = new Map(rows.map((row) => [row.id, row]));
    if (rowById.size !== orderedMapIds.length) {
      return NextResponse.json(
        { error: "missing_maps" },
        { status: 400 }
      );
    }

    const children: MindNode[] = [];
    const tagSet = new Set<string>();
    const sourceParts: MergeSourcePart[] = [];
    const sourceExpiresAtValues: Array<string | null | undefined> = [];
    const sourceRetentionValues: number[] = [];
    const orderedIds = orderedMapIds.slice();
    orderedIds.forEach((id: string) => {
      const row = rowById.get(id);
      if (!row) return;
      if (Array.isArray(row.tags)) {
        row.tags.forEach((tag: string) => tagSet.add(tag));
      }
      const raw = row.mind_elixir_draft ?? row.mind_elixir ?? null;
      const cloned = cloneData(raw);
      const root = getRootNode(cloned);
      if (!root) return;
      const remapped = remapNodeIds(root);
      children.push(remapped);

      const sourceText = String(row.extracted_text ?? "").trim();
      if (sourceText) {
        sourceParts.push({
          title: String(row.title ?? ""),
          text: sourceText,
        });
      }
      sourceExpiresAtValues.push(row.source_expires_at);
      if (typeof row.source_retention_hours === "number") {
        sourceRetentionValues.push(row.source_retention_hours);
      }
    });

    if (children.length < 2) {
      return NextResponse.json(
        { error: "invalid_maps" },
        { status: 400 }
      );
    }

    const merged = {
      nodeData: {
        id: uuidv4(),
        topic: rootTitle,
        root: true,
        expanded: true,
        children,
      },
    };
    const mergedSourceText =
      sourceParts.length > 0 ? mergeSourceText(sourceParts) : null;
    const mergedSourceRetentionHours =
      sourceRetentionValues.length > 0 ? Math.min(...sourceRetentionValues) : 24;
    const mergedSourceExpiresAt = getEarliestIsoDate(sourceExpiresAtValues);

    const { data: inserted, error: insertError } = await supabase
      .from("maps")
      .insert({
        title: rootTitle,
        user_id: userData.user.id,
        mind_elixir: merged,
        mind_elixir_draft: merged,
        map_status: "done",
        tags: Array.from(tagSet),
        description: `Merged ${orderedMapIds.length} maps`,
        extracted_text: mergedSourceText,
        source_char_count: mergedSourceText?.length ?? 0,
        source_retention_hours: mergedSourceRetentionHours,
        source_expires_at: mergedSourceExpiresAt,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ id: inserted.id });
  } catch (error) {
    console.error("[maps/merge] failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
