// === Text helpers ===
export function labelOf(d: any) {
  const info = d?.data ?? {};
  if (info.nodeType === "description") return info.description || info.title || d.id;
  return info.title || info.description || d.id;
}

const _measureCtx: { ctx?: CanvasRenderingContext2D } = {};
export function measureTextWidth(
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

/** 단어 단위 줄바꿈 (너무 긴 단어는 글자 단위로 쪼갬) */
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
      if (measureTextWidth(w, font) > maxWidth) {
        // 긴 단어 강제 쪼개기
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


// === Layout constants ===
const FONT = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const LINE_HEIGHT = 16;
export const PADDING_L = 10, PADDING_R = 10, PADDING_T = 6, PADDING_B = 6;
const MIN_W = 140;
const MAX_W = 420;

/** 줄바꿈 라인/폭/높이를 동시 계산 (라벨 → 박스 크기 반영) */
export function calcWrapped(d: any) {
  const text = labelOf(d);

  // 1) 최대 내부폭 기준으로 줄바꿈
  const maxInner = MAX_W - (PADDING_L + PADDING_R);
  const lines = wrapByWidth(text, maxInner, FONT);

  // 2) 라인 중 최대 폭 측정
  const widest = Math.max(...lines.map(line => measureTextWidth(line, FONT)), 0);

  // 3) 박스 폭 = 컨텐츠폭 + 패딩 (MIN~MAX clamp)
  const width = Math.max(MIN_W, Math.min(MAX_W, Math.ceil(widest + PADDING_L + PADDING_R)));

  // 4) 박스 높이 = 패딩 + 라인수 * LINE_HEIGHT
  const height = Math.ceil(PADDING_T + PADDING_B + lines.length * LINE_HEIGHT);

  // 5) \n으로 줄바꿈한 라벨 텍스트
  const label = lines.join("\n");

  return { label, width, height };
}
