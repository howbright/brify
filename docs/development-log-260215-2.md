# Development Log

## 질문 -> 문제해결
- 질문: LeftPanel에서 메타데이터 수정 UX 및 버튼 위치
- 문제해결: LeftPanel 헤더에 편집 버튼 추가, MetadataDialog 재활용, 상세 페이지에서 편집 진입 연결

## 질문 -> 문제해결
- 질문: 구조맵 생성 직후 DraftMapCard 즉시 생성
- 문제해결: POST /maps 응답에서 받은 id로 optimistic draft 생성 및 카드 즉시 렌더

## 질문 -> 문제해결
- 질문: 메타데이터 저장 시 카드 버튼 상태 표시
- 문제해결: DraftMapCard에 저장 중 상태 추가(로딩/비활성), page.tsx에서 savingMetaId 관리

## 질문 -> 문제해결
- 질문: 생성 요청 후 textarea 원문 초기화
- 문제해결: POST /maps 성공 직후 setScriptText("") 실행

## 질문 -> 문제해결
- 질문: 목록 아이템 삭제 버튼 추가 및 UI 부담 완화
- 문제해결: MapListItem에 더보기(⋯) 메뉴 도입, 삭제는 메뉴 안으로 이동

## 질문 -> 문제해결
- 질문: 삭제 실패 알림과 토스트 통일
- 문제해결: window.alert 제거, sonner toast.error로 통일

## 질문 -> 문제해결
- 질문: 삭제 확인 다이얼로그 공통 컴포넌트 사용
- 문제해결: ConfirmDialog 재활용 및 z-index 보정으로 상세/목록 모두 표시

## 질문 -> 문제해결
- 질문: 상세 페이지 삭제 위치 및 동작
- 문제해결: 헤더 ⋯ 메뉴 내 삭제 추가, 확인 후 삭제, 성공 시 toast 후 목록 이동

## 질문 -> 문제해결
- 질문: 상태 배지 표시 단순화
- 문제해결: 완료 배지는 숨김, 실패/처리중만 표시

