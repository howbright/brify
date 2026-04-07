export type ShortcutItem = { key: string; description: string };
export type ShortcutMessages = {
  title?: string;
  description?: string;
  close?: string;
  columns?: {
    shortcut?: string;
    action?: string;
  };
  items?: ShortcutItem[];
};

export function getShortcutCopy(
  locale: string,
  messages?: { ShortcutsDialog?: ShortcutMessages }
) {
  const fallback: Required<Omit<ShortcutMessages, "items">> & {
    items: ShortcutItem[];
  } =
    locale === "ko"
      ? {
          title: "단축키 안내",
          description: "Mind Elixir 기본 단축키 목록입니다.",
          close: "닫기",
          columns: {
            shortcut: "단축키",
            action: "기능",
          },
          items: [
            { key: "Enter", description: "형제 노드 삽입" },
            { key: "Shift + Enter", description: "앞쪽에 형제 노드 삽입" },
            { key: "Tab", description: "자식 노드 삽입" },
            { key: "Ctrl + Enter", description: "부모 노드 삽입" },
            { key: "F1", description: "맵 중앙 정렬" },
            { key: "F2", description: "현재 노드 편집" },
            { key: "↑", description: "이전 노드 선택" },
            { key: "↓", description: "다음 노드 선택" },
            { key: "← / →", description: "좌/우 노드 선택" },
            { key: "PageUp / Alt + ↑", description: "위로 이동" },
            { key: "PageDown / Alt + ↓", description: "아래로 이동" },
            { key: "Ctrl + ↑", description: "양쪽 레이아웃" },
            { key: "Ctrl + ←", description: "좌측 레이아웃" },
            { key: "Ctrl + →", description: "우측 레이아웃" },
            { key: "Ctrl + C", description: "복사" },
            { key: "Ctrl + X", description: "잘라내기" },
            { key: "Ctrl + V", description: "붙여넣기" },
            { key: "Delete / Backspace", description: "노드/화살표/구조화 삭제" },
            { key: "Ctrl + +", description: "확대" },
            { key: "Ctrl + -", description: "축소" },
            { key: "Ctrl + 0", description: "확대/축소 초기화" },
            { key: "Ctrl + K, Ctrl + 0", description: "전체 접기" },
            { key: "Ctrl + K, Ctrl + =", description: "전체 펼치기" },
            { key: "Ctrl + K, Ctrl + 1-9", description: "N단계까지 펼치기" },
          ],
        }
      : {
          title: "Keyboard Shortcuts",
          description: "Default Mind Elixir keyboard shortcuts.",
          close: "Close",
          columns: {
            shortcut: "Shortcut",
            action: "Action",
          },
          items: [
            { key: "Enter", description: "Insert sibling node" },
            { key: "Shift + Enter", description: "Insert sibling node before" },
            { key: "Tab", description: "Insert child node" },
            { key: "Ctrl + Enter", description: "Insert parent node" },
            { key: "F1", description: "Center the map" },
            { key: "F2", description: "Edit current node" },
            { key: "↑", description: "Select previous node" },
            { key: "↓", description: "Select next node" },
            { key: "← / →", description: "Select left/right node" },
            { key: "PageUp / Alt + ↑", description: "Move up" },
            { key: "PageDown / Alt + ↓", description: "Move down" },
            { key: "Ctrl + ↑", description: "Both-side layout" },
            { key: "Ctrl + ←", description: "Left layout" },
            { key: "Ctrl + →", description: "Right layout" },
            { key: "Ctrl + C", description: "Copy" },
            { key: "Ctrl + X", description: "Cut" },
            { key: "Ctrl + V", description: "Paste" },
            { key: "Delete / Backspace", description: "Delete node/edge/summary" },
            { key: "Ctrl + +", description: "Zoom in" },
            { key: "Ctrl + -", description: "Zoom out" },
            { key: "Ctrl + 0", description: "Reset zoom" },
            { key: "Ctrl + K, Ctrl + 0", description: "Collapse all" },
            { key: "Ctrl + K, Ctrl + =", description: "Expand all" },
            { key: "Ctrl + K, Ctrl + 1-9", description: "Expand to level N" },
          ],
        };

  return {
    title: messages?.ShortcutsDialog?.title ?? fallback.title,
    description: messages?.ShortcutsDialog?.description ?? fallback.description,
    close: messages?.ShortcutsDialog?.close ?? fallback.close,
    columns: {
      shortcut:
        messages?.ShortcutsDialog?.columns?.shortcut ?? fallback.columns.shortcut,
      action:
        messages?.ShortcutsDialog?.columns?.action ?? fallback.columns.action,
    },
    items: messages?.ShortcutsDialog?.items ?? fallback.items,
  };
}
