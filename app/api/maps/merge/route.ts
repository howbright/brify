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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const rootTitle = String(body?.rootTitle ?? "").trim();
    const orderedMapIds = Array.isArray(body?.orderedMapIds)
      ? body.orderedMapIds.map((id: any) => String(id)).filter(Boolean)
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
      .select("id,title,tags,mind_elixir,mind_elixir_draft")
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
    const orderedIds = orderedMapIds.slice();
    orderedIds.forEach((id) => {
      const row = rowById.get(id);
      if (!row) return;
      if (Array.isArray(row.tags)) {
        row.tags.forEach((tag) => tagSet.add(tag));
      }
      const raw = row.mind_elixir_draft ?? row.mind_elixir ?? null;
      const cloned = cloneData(raw);
      const root = getRootNode(cloned);
      if (!root) return;
      const remapped = remapNodeIds(root);
      children.push(remapped);
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
