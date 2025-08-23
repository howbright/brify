// utils/diagram.ts
export const safeParseJSON = <T = any,>(text: string | null): T | null => {
    if (!text) return null;
    try { return JSON.parse(text) as T; } catch { return null; }
  };
  
  export const now = () =>
    (typeof performance !== "undefined" ? performance.now() : Date.now());
  
  export const shortId = () => Math.random().toString(36).slice(2, 8);
  
  export const makeNodeId = () =>
    `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  
  export const makeEdgeId = (s: string | number, t: string | number) =>
    `e_${String(s)}_${String(t)}_${Math.random().toString(36).slice(2, 5)}`;
  