# 용어 해설 UI/기획 정리 개발 로그 (2026-02-09)

질문 -> 해결
- 용어 탭에서 에러 없이 가데이터 보이게 요청 -> `page.tsx`/`FullscreenDialog.tsx`에 mock terms/로딩 연결
- 용어 리스트 레이아웃 space-y 대신 gap 사용 요청 -> `RightPanel.tsx`에서 `flex flex-col gap-`로 변경
- 용어 UI를 컴포넌트 분리 요청 -> `components/maps/TermsBlock.tsx` 분리
- TermsBlock props 타입 에러 -> 새 props 시그니처에 맞게 `RightPanel.tsx` 호출 수정
- 초기 기획 변경(용어 0개일 때 모드 선택) -> TermsBlock UI 전면 재구성
- 용어가 1개 이상일 때 커스텀 입력만 노출 요청 -> mock data 1개 넣고 커스텀 입력 전용 UI 구성
- 개별 용어 삭제 아이콘 추가 요청 -> NoteItem 스타일의 X 버튼 추가
- 추가 입력 박스가 리스트와 구분 안 됨 -> 강조 카드 스타일 적용
- 추가 입력이 스크롤 아래로 내려감 -> 상단 sticky CTA로 변경
- sticky가 위와 겹쳐 보임 -> RightPanel 상단 패딩 제거 및 탭 라인에 pt 추가
- 버튼이 하단에 붙는 문제 -> TermsBlock 렌더 순서 조정으로 상단 고정
- sticky가 겹쳐 보임 -> RightPanel 패딩 재조정 (`pt-0`)
- 버튼 클릭 시 바텀시트가 너무 멀리 보임 -> 버튼 바로 아래 인라인 입력 토글로 변경

파일 변경 구조화
- `components/maps/TermsBlock.tsx` 용어 UI 재구성, 삭제 아이콘, 인라인 입력 토글
- `components/maps/RightPanel.tsx` 탭 간격/패딩 조정 및 TermsBlock 연결
- `app/[locale]/(fullscreen)/maps/[mapId]/page.tsx` mock terms/로딩 연결
- `components/ui/FullscreenDialog.tsx` mock terms/로딩 연결
