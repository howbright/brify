// 라벨 텍스트 추출 (네가 쓰던 함수면 유지)
export function labelOf(d: any) {
    const info = d?.data ?? {};
    if (info.nodeType === "description") return info.description || info.title || d.id;
    return info.title || info.description || d.id;
  }
  
  // 정확한 텍스트 폭 측정용 캔버스
  const _measureCtx: { ctx?: CanvasRenderingContext2D } = {};
  export  function measureTextWidth(
    text: string,
    font = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
  ) {
    if (!_measureCtx.ctx) {
      const canvas = document.createElement("canvas");
      _measureCtx.ctx = canvas.getContext("2d")!;
    }
    _measureCtx.ctx.font = font;
    return _measureCtx.ctx.measureText(text ?? "").width;
  }
  
  /** 단어 단위 줄바꿈: maxWidth 기준으로 텍스트를 라인 배열로 변환 */
  export function wrapByWidth(
    text: string,
    maxWidth: number,
    font = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
  ) {
    const words = (text ?? "").split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? cur + " " + w : w;
      if (measureTextWidth(next, font) <= maxWidth) {
        cur = next;
      } else {
        if (cur) lines.push(cur);
        // 단어 하나가 너무 길면 강제 쪼개기
        if (measureTextWidth(w, font) > maxWidth) {
          let buf = "";
          for (const ch of w) {
            const tryBuf = buf + ch;
            if (measureTextWidth(tryBuf, font) > maxWidth) {
              lines.push(buf);
              buf = ch;
            } else {
              buf = tryBuf;
            }
          }
          cur = buf;
        } else {
          cur = w;
        }
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }