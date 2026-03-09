# 개발 로그 (2026-03-09) - 맵 풀스크린 UI/메타데이터 오류 대응

1. 문제: MetadataDialog 저장 시 DB 제약 위반 오류(`maps_title_check`) 발생
2. 해결: DB 제약 확인 후 제목 길이 제한(80자) 원인 파악, 이후 정책에 맞게 DB 제약을 200자로 늘리는 SQL 제공

1. 문제: FullscreenDialog 헤더가 page.tsx 헤더와 다르고 코드 중복이 많음
2. 해결: 공통 헤더 컴포넌트(`components/maps/FullscreenHeader.tsx`)로 분리하고 양쪽에서 재사용

1. 문제: FullscreenDialog에서 MapControls가 보이지 않음
2. 해결: 헤더 우측에 MapControls 추가 및 MindElixir ref 연결

1. 문제: 헤더 좌측 탭(정보/노트/용어)이 가려짐/사라짐
2. 해결: 우측 영역 폭 제한 제거 및 레이아웃 조정, 탭 노출 우선 처리

1. 문제: FullscreenDialog 모바일 UI가 page.tsx와 다르게 보임
2. 해결: 모바일 액션 스택(편집/이동/줌/맵조작/테마/PNG)을 동일한 구성으로 추가

1. 문제: FullscreenDialog 헤더에 노트/용어 버튼이 남아 page.tsx와 불일치
2. 해결: 헤더에서 노트/용어 버튼 제거, 검색 UI만 유지해 page.tsx와 동일화

1. 문제: LeftPanel 내부 탭(정보/노트/용어)이 FullscreenDialog에서 노출되지 않음
2. 해결: `mapId`, `tab`, `onTabChange` 전달 및 탭 상태 연동

1. 문제: LeftPanel 토글 버튼 아이콘 요구사항 변경
2. 해결: 패널 열림 시 X 아이콘 표시, 크기 조정(`h-6 w-6`) 반영

1. 문제: 헤더 상단 닫기 버튼이 아이콘만 표시됨
2. 해결: 텍스트 버튼 “맵 닫기”로 변경하고 흰색 테두리 적용

1. 문제: LeftPanel 닫기 동작이 직관적이지 않음
2. 해결: 탭 영역 우측에 반원 모양 파란색 닫기 버튼 추가 및 onClose 연결

1. 문제: FullscreenDialog 헤더가 1079px 폭 제한으로 보임
2. 해결: 최상위 컨테이너를 뷰포트 고정으로 조정하고 포털 렌더링으로 부모 레이아웃 제약 해제

1. 문제: MapControls 폭 제한으로 텍스트가 뭉개짐
2. 해결: FullscreenDialog에서 MapControls 래퍼 `max-w` 제한 제거

1. 문제: 페이지 진입 시 맵 루트 노드가 아래로 치우침
2. 해결: 로딩 완료 후 `centerMap()`을 한 번 실행하도록 초기 정렬 보정 추가

1. 문제: 맵 조작 메뉴에 정렬 기능(좌/우/가운데) 필요
2. 해결: MindElixir `initLeft/initRight/initSide` 호출용 `setLayout` 핸들 추가 후 맵조작/모바일 메뉴에 연결

1. 문제: 맵 조작 드롭다운 메뉴에 아이콘 부재
2. 해결: 메뉴 항목(펴기/접기/정렬)에 적절한 아이콘 추가
