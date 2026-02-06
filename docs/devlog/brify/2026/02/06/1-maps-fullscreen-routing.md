# 개발 로그 (2026-02-06)

질문 -> 문제해결 형식으로 정리합니다.

1. 질문: DraftMapCard에서 열기 버튼을 눌렀을 때 다이얼로그는 즉시 뜨고, 구조맵 데이터는 이후에 로딩되게 하고 싶다.
문제해결: FullscreenDialog는 즉시 오픈하고, 클라이언트에서 Supabase로 `maps.mind_elixir`를 비동기로 fetch하도록 구성. `ClientMindElixir`는 placeholder/샘플 데이터로 먼저 렌더 후 실제 데이터 도착 시 재초기화.

2. 질문: 구조맵 로딩 중에 보여줄 전용 placeholder 데이터가 필요하다.
문제해결: `app/lib/g6/sampleData.ts`에 `loadingMindElixir` 추가. root 노드는 “구조맵 데이터를 가져오는 중입니다...”로, depth1 노드 5개는 “구조맵 생성하는 중 ...” 계열 문구로 구성. `FullscreenDialog`에서 `placeholderData`로 전달.

3. 질문: /maps 페이지에서 “나의 맵” 메뉴 클릭 시 이동할 페이지를 만들고, 초기에는 텍스트만 보여주고 싶다.
문제해결: `app/[locale]/(main)/maps/page.tsx` 생성 및 기본 텍스트 렌더.

4. 질문: /maps 페이지에서 목록을 Supabase 클라이언트로 직접 fetch하고 DraftMapCard를 참고해서 목록 UI를 구성하고 싶다.
문제해결: `/maps` 페이지를 클라이언트 컴포넌트로 전환하여 `maps` 테이블을 직접 조회. `Database` 타입을 사용해 목록을 MapDraft로 매핑 후 리스트 렌더.

5. 질문: DraftMapCard 재활용 대신 맵 목록 전용 컴포넌트를 별도로 만들고 싶다.
문제해결: `components/maps/MapListItem.tsx` 생성. 목록 페이지에서 신규 컴포넌트 사용.

6. 질문: 목록에서 “열기”를 누르면 FullscreenDialog가 아니라 `/maps/[mapId]`로 페이지 이동하고, 상세 페이지는 헤더 없이 풀스크린으로 보여야 한다.
문제해결: `(fullscreen)` 라우트 그룹을 추가하여 헤더/푸터 없는 레이아웃 구성. `/maps/[mapId]` 상세 페이지를 풀스크린 UI로 구현하고, `MapListItem`의 “열기” 버튼을 링크로 변경. `/maps` 페이지에서는 다이얼로그 로직 제거.
