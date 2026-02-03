# MindElixir UI/스타일 적용 & RightPanel 정비 로그 (2026-02-03)

## 1) 질문 → 해결: 다이얼로그 컴포넌트 폴더 구조
**질문**  
- “이 다이얼로그에 들어갈 컴포넌트들을 구조맵 상세보기 페이지에도 재활용할 예정인데, components의 어느 폴더 밑이 좋을까요?”

**해결**  
- 재사용 범위가 “구조맵 도메인(상세/편집/뷰어)” 전체라면, 공용 UI 폴더가 아니라 도메인 폴더로 분리하는 것이 유지보수에 유리합니다.  
- 예)  
  - `components/maps/` (구조맵 전용 재사용 컴포넌트)  
  - `components/maps/panels/` (SidePanel, RightPanel 같은 패널류)  
  - `components/maps/dialogs/` (Modal/Dialog 류)  
  - 완전 공통 UI면 `components/ui/`로 이동


---

## 2) 질문 → 해결: MindElixir 배경을 격자무늬 + 투명하게
**질문**  
- MindElixir 인스턴스 옵션에서 배경을 격자무늬로 만들고, 배경을 투명하게 할 수 있을까요?

**해결**  
- MindElixir 자체 캔버스를 “투명” 처리하고, **부모 레이어에 격자 배경 div를 깔아** 해결하였습니다.
- 즉, 구조는:
  - (1) `absolute inset-0` 격자 배경 레이어
  - (2) 그 위에 MindElixir DOM 렌더링 레이어(`ref={elRef}`)


---

## 3) 질문 → 해결: (노드 카드) 루트/일반 노드 스타일 분리
**질문**  
- “각 노드에도 배경색이 있어야 하는데 루트 노드만 적용됩니다. 그리고 전체 느낌이 ‘닝닝’합니다.”  
- “루트 노드는 타이틀 같은 역할이라 더 특별해야 합니다.”

**해결**  
- `.me-surface` 스코프 기반으로 노드 카드 스타일을 정리하고,
  - 일반 노드: 유리감 + 톤 다운(완전 흰색 금지) + 얕은 깊이감 그림자
  - 다크모드: 차콜 유리 카드
  - 선택 상태: outline으로 강조  
  형태로 CSS를 구축하였습니다.
- 루트 노드 특별 스타일은 “클래스가 붙으면 강제 적용” 구조로 설계하였습니다.
  - 단, 실제 DOM 구조 상 루트가 `<me-root><me-tpc .../></me-root>` 형태이므로, 루트에 클래스가 기대한 위치에 붙지 않을 수 있어 디버깅 포인트로 남겼습니다.


---

## 4) 질문 → 해결: 노드 border를 branchColor(라인 색)와 동일하게 만들기
**질문**  
- “각 노드의 border 색깔을 자기에게 들어오는 line 선 색깔(= branchColor)과 같게 할 수 있을까요?”  
- “1 depth는 되는데, 2 depth부터는 회색 border입니다.”  
- “적용 함수(`applyBorderFromBranchColor`)를 어디에 넣어야 하나요?”

**해결(시도한 접근)**  
- 트리 데이터를 순회하며 `branchColor`를 수집 → DOM에서 `[data-nodeid="..."]` 또는 `me-tpc[data-nodeid="..."]`를 찾아 `style.borderColor`에 주입하는 방식으로 접근했습니다.
- 적용 타이밍 이슈(렌더 지연/재렌더) 가능성이 높아:
  - `requestAnimationFrame` 2회
  - `setTimeout` 재시도
  - `ResizeObserver`로 재적용  
  같은 “여러 타이밍 재적용” 전략을 포함했습니다.

**테스트 결과 / 남은 문제**
- 사용자의 테스트 결과:
  1) 루트는 기존부터 적용되므로 더 논의하지 않음  
  2) 첫 번째 depth의 border 컬러도 사라짐  
  3) 즉, 제안한 방식이 현재 DOM/데이터 구조에서는 제대로 먹지 않았음

**디버깅에서 확인된 DOM 구조(중요)**
- 루트 노드:
  - `<me-root><me-tpc data-nodeid="me0"...><span class="text">...</span></me-tpc></me-root>`
- 2번째 depth 예시:
  - `<me-wrapper><me-parent><me-tpc data-nodeid="me0-0-0"...>...</me-tpc></me-parent></me-wrapper>`

**결론(현시점)**
- “노드 DOM 셀렉터”는 일반 div가 아니라 **`me-tpc`(커스텀 엘리먼트)** 중심으로 잡아야 하고,
- `branchColor` 데이터가 실제로 “2 depth 이후에도 존재하는지/어디에 존재하는지” 확인이 필요합니다.
- 즉, 해결책은 “함수 위치”보다도:
  - (1) 실제 데이터에서 branchColor가 depth별로 유지되는지
  - (2) MindElixir가 렌더 과정에서 style을 다시 덮어쓰는지
  - (3) 어떤 엘리먼트에 border가 그려지는지(me-tpc인지 wrapper인지)
  를 기준으로 다시 설계해야 하는 상태입니다.


---

## 5) 질문 → 해결: 코드 전체 정비 요청(패널 코드 중복 문제)
**질문**  
- “현재 코드가 너무 꼬여서 전체 코드로 정리해달라”  
- RightPanel 코드가 여러 번 중복되어 붙어있고, 버전도 섞여있습니다.

**해결**  
- RightPanel은 “노트/용어 탭 버전”을 기준으로 하나의 파일로 정리하는 방향으로 정비했습니다.
- 중복 제거 포인트:
  - 동일 RightPanel 코드가 여러 번 반복된 부분 제거
  - import/타입/props 구조 정리
  - SidePanel/Tabs/Blocks로 책임 분리
- 결과: “최종 RightPanel.tsx” 형태로 단일본을 구성했습니다.


---

## 다음 액션(To-do)
- [ ] MindElixir 노드 border = branchColor 문제는 “데이터 구조와 DOM 대상”을 다시 확정해야 합니다.
  - depth 2+에서 branchColor가 실제 데이터에 존재하는지 콘솔로 확인
  - border가 적용되어야 하는 대상이 `me-tpc`인지, 상위 wrapper인지 확인
  - MindElixir가 style을 덮어쓰는 경우 MutationObserver 기반 재적용 고려
- [ ] 루트 노드 스타일은 이미 OK, 이후는 depth별 브랜치 컬러 규칙/상속 규칙 확정 필요
