# 2026-02-05 작업 로그

## 요약
- 구조맵 다이얼로그를 즉시 열고, 내부 맵은 샘플/스켈레톤에서 실제 데이터로 교체되는 흐름을 구현했다.
- Supabase 클라이언트에서 `maps.mind_elixir`를 직접 조회해 구조맵 데이터를 가져오도록 했다.

## 변경 사항
- `app/[locale]/(main)/video-to-map/page.tsx`
- `components/ui/FullscreenDialog.tsx`
- `components/ClientMindElixir.tsx`

## 상세
- 다이얼로그 오픈 시점에 `maps.mind_elixir` 데이터를 비동기 조회하도록 로직 추가.
- 맵 데이터 로딩 상태 및 에러 상태를 다이얼로그에 전달.
- `ClientMindElixir`에 `data`, `placeholderData`, `loading` props를 추가하여
  샘플 데이터로 즉시 렌더 후 실제 데이터 도착 시 재초기화 되도록 개선.
- 로딩 중에는 “구조맵 불러오는 중…” 배지를 표시.

## 메모
- MindElixir 초기 데이터는 `data ?? placeholderData ?? sampled` 순으로 결정.
- 실제 데이터 도착 시 `mind.init()` 재호출로 맵을 교체함.
