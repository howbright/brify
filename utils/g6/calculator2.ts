import { OriginalDiagramNode } from "@/app/lib/g6/types";
import { calcWrapped } from "./calcuator";


// 1) 배열 → 트리 변환 (children id 기반)
export function buildTree(arr: OriginalDiagramNode[]) {
    console.log('original:', arr);
    const map = new Map<string, OriginalDiagramNode>();
    arr.forEach(n => map.set(n.id, n));
  
    // 루트 찾기: 다른 누구의 children에도 포함되지 않은 id
    const allIds = new Set(arr.map(n => n.id));
    const childIds = new Set<string>();
    arr.forEach(n => n.children?.forEach(c => childIds.add(c)));
    const roots = [...allIds].filter(id => !childIds.has(id));
    const rootId = roots[0] ?? arr[0]?.id;
  
    function walk(id: string):any {
      const n = map.get(id);
      if (!n) return null;
      return {
        id: n.id,
        data: n, // 원본 보관
        children: (n.children ?? []).map(walk).filter(Boolean),
      };
    }
  
    const hhh:any = walk(rootId!);
    console.log('data:: ', hhh);
    return hhh;
  }

// 1) 트리 데이터에 size/label을 미리 주입
type Tree = { id: string; data: any; children?: Tree[]; style?: any };

const LINE_HEIGHT = 16;
const PADDING_X = 12;   // 좌우 패딩
const PADDING_Y = 8;    // 상하 패딩
const MIN_W = 140;
const MIN_H = 44;
const MAX_W = 260;      // 너무 길면 강제 줄바꿈(내부 calcWrapped가 사용)

export function enhanceTreeSizes(root: Tree): Tree {
  function walk(node: Tree, depth = 0): Tree {
    const raw = node.data ?? {};
    const text = String(raw.title ?? raw.description ?? "");

    // calcWrapped를 쓸 때 폭 힌트가 필요하다면 labelMaxWidth 같은 옵션을 네 util에 반영
    let computedLabel = text;
    let w = MIN_W, h = MIN_H;
    try {
      const r = calcWrapped({
        ...node,
        labelText: text,
        LINE_HEIGHT,
        // 필요하면 너의 calcWrapped에 maxWidth 옵션 추가해서 사용
        maxWidth: MAX_W,
      });
      computedLabel = r.label ?? text;
      const cw = Number(r.width);
      const ch = Number(r.height);
      w = (Number.isFinite(cw) && cw > 0 ? cw : MIN_W) + PADDING_X * 2;
      h = (Number.isFinite(ch) && ch > 0 ? ch : MIN_H) + PADDING_Y * 2;
      // 폭 상한 적용(글이 너무 길면 적당히 줄바꿈 하게)
      if (w > MAX_W + PADDING_X * 2) w = MAX_W + PADDING_X * 2;
    } catch {
      // fail-safe 기본값 유지
    }

    const styled: Tree = {
      ...node,
      style: { ...(node.style ?? {}), size: [w, h] }, // ✅ 레이아웃이 참조할 실제 사이즈
      data: { ...raw, _label: computedLabel, _depth: depth }, // ✅ 라벨 캐시/깊이
      children: node.children?.map((c) => walk(c, depth + 1)),
    };
    return styled;
  }

  const result:any = walk(root, 0);
  console.log('result:', result);

  return result;
}
