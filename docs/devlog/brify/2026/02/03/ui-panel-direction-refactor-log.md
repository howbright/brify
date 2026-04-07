# UI 패널 방향 및 구조 정리 작업 로그

## 파일명
ui-panel-direction-refactor-log.md

---

## 1. 질문  
DraftMapCard에서 사용하던 구조맵 메타데이터 정보를  
FullscreenDialog 내부 패널에서도 상세하게 보여주고 싶었다.  
RightPanel 컴포넌트를 새로 만드는 게 맞는지 고민했다.

### 문제  
- Supabase `maps` 테이블 구조가 복잡함
- 어떤 필드를 상세 패널에 노출할지 기준이 애매함
- Draft 카드와 Fullscreen UI 간 톤을 맞춰야 함

### 해결  
- `maps.Row` 구조를 기준으로 `MapRow` 타입 정의
- 상세 패널을 섹션 단위로 분리
  - 출처 / 태그 / 시간 / 크레딧 / 상태 / 데이터
- 긴 텍스트(JSON, extracted_text)는 구조화 미리보기 형태로 표시
- DraftMapCard의 디자인 감성을 유지한 패널 UI 구현

---

## 2. 질문  
구현한 메타데이터 패널이 사실 RightPanel이 아니라  
LeftPanel에 있어야 한다는 걸 뒤늦게 인지했다.  
컴포넌트 이름만 바꾸면 해결될 거라고 착각했다.

### 문제  
- 컴포넌트 이름을 LeftPanel로 변경했는데
- UI는 계속 오른쪽에서 슬라이드 인됨
- 원인이 직관적으로 보이지 않음

### 해결  
- 문제의 원인은 컴포넌트 이름이 아니라 레이아웃 설정
- 슬라이드 패널의 방향은 다음 요소들의 조합으로 결정됨
  1. 위치 클래스 (`right-0` / `left-0`)
  2. transform 방향 (`translate-x-full` / `-translate-x-full`)
  3. 경계선과 그림자 방향 (`border-l` / `border-r`)
- 수정 내용
  - `right-0` → `left-0`
  - `translate-x-full` → `-translate-x-full`
  - `border-l` → `border-r`
- 패널이 왼쪽에서 자연스럽게 슬라이드 인되도록 수정 완료

---

## 3. 질문  
헤더에 아래와 같은 상태 표시 문구가 꼭 필요한지 고민했다.

```tsx
{(leftOpen || rightOpen) && (
  <span className="hidden sm:inline text-[11px]">
    패널 열림
  </span>
)}
