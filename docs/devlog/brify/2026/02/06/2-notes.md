# 노트 기능 개발 로그 (2026-02-06)

질문 -> 문제해결
- 노트 기능 데이터베이스 설계가 필요함 -> `map_notes` 테이블/인덱스/RLS/트리거 기반 설계 SQL 제공
- 노트 CRUD API 위치가 고민됨 -> Next.js API route로 결정
- Next.js에서 노트 CRUD API route 생성 요청 -> `app/api/notes` 및 `app/api/notes/[id]` CRUD 라우트 추가
- 노트 단일 컴포넌트 분리 요청 -> `components/maps/NoteItem.tsx` 분리
- RightPanel에 노트 fetch/상태관리 연결 요청 -> `RightPanel.tsx`에서 조회/추가/삭제 연동
- Enter로도 노트 추가 요청 -> 입력창 Enter 추가되도록 변경
- 노트 수정 기능 요청 -> NoteItem에 편집/저장/취소 + PATCH 연동 추가
- 노트 간격이 붙어있음 -> 리스트 레이아웃을 `flex flex-col gap-`으로 변경
- 수정/삭제 버튼을 아이콘으로 변경 요청 -> Iconify 아이콘 버튼으로 교체
- 버튼을 더 연하게/작게 요청 -> 텍스트 제거, 연한 테두리 작은 아이콘 버튼 적용
- 삭제 아이콘을 X로 변경 요청 -> `mdi:close` 아이콘 적용

파일 변경 요약
- `components/maps/NoteItem.tsx` 신규 및 스타일/기능 개선
- `components/maps/RightPanel.tsx` 노트 상태/CRUD 연동
- `app/api/notes/route.ts` 노트 목록/생성 API
- `app/api/notes/[id]/route.ts` 노트 수정/삭제 API
- `app/[locale]/(fullscreen)/maps/[mapId]/page.tsx` RightPanel props 정리
- `components/ui/FullscreenDialog.tsx` RightPanel props 정리
