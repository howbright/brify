// app/lib/diagram/normalize.ts
export type TreeItem = {
    id: string;
    title: string;
    children: string[];
    nodeType: "title" | "description";
    description: string;
  };
  
  export type Flow = {
    nodes: any[];
    edges: any[];
  } | null;
  
  export type ApiSummary = {
    diagram_json: TreeItem[] | null;
    temp_diagram_json: Flow;
    effective_diagram_json: Flow;
    diagram_source: "original" | "temp" | "overlay" | null;
    // ... 필요시 다른 필드들 추가
  };
  
  export function normalizeSummary(api: ApiSummary) {
    const tree: TreeItem[] = Array.isArray(api.diagram_json) ? api.diagram_json : [];
  
    let overlay: Flow = null;
    switch (api.diagram_source) {
      case "overlay":
        overlay = api.effective_diagram_json ?? null;
        break;
      case "temp":
        overlay = api.temp_diagram_json ?? null;
        break;
      default:
        overlay = null;
    }
  
    const safeNodes = overlay?.nodes && Array.isArray(overlay.nodes) ? overlay.nodes : [];
    const safeEdges = overlay?.edges && Array.isArray(overlay.edges) ? overlay.edges : [];
  
    return { tree, overlay, nodes: safeNodes, edges: safeEdges };
  }
  