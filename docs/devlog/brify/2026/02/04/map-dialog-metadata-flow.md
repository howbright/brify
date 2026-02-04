# 구조맵 FullscreenDialog 메타데이터 연동 작업 로그

## 작업 배경
DraftMapCard에서 "열기" 버튼을 눌렀을 때  
FullscreenDialog 안에서 구조맵(ClientMindElixir)과 메타데이터(LeftPanel)를 함께 보여주고 싶었다.

초기 구현에서는:
- FullscreenDialog 내부에서 가짜(meta) 데이터를 만들고
- LeftPanel에 전달하는 구조였음

실제 DB 데이터로 연결하면서,
**어디에서 데이터를 가져오고, 누가 책임질지**를 정리할 필요가 생김.

---

## 질문 1  
**FullscreenDialog가 열릴 때 데이터를 가져오는 게 맞을까?  
아니면 DraftMapCard에서 미리 가져와서 넘기는 게 맞을까?**

### 결론
👉 **하이브리드 구조가 정답**

- DraftMapCard:
  - 가벼운 메타데이터(meta)를 이미 가지고 있음
  - Dialog를 열 때 meta를 props로 전달
- FullscreenDialog:
  - 열리는 시점(open)에
  - mind_elixir 같은 **무거운 detail 데이터만 추가 fetch**

즉,
- meta = 리스트 단계
- detail = Dialog 단계

---

## 질문 2  
**그럼 detail fetch는 누가 담당해야 할까?**

### 결론
👉 **FullscreenDialog가 담당하되, 훅으로 분리**

- Dialog가 “detail이 필요한 시점(open)”을 가장 잘 알고 있음
- 하지만 Dialog 컴포넌트가 비대해지지 않도록
  - `useMapDetail()` 같은 커스텀 훅으로 분리
  - 내부에서는 React Query 사용

정리:
- UI 책임: FullscreenDialog
- 데이터/캐시 책임: React Query + custom hook

---

## 질문 3  
**React Query를 써야 할까? 그냥 훅만 써야 할까?**

### 결론
👉 **React Query + 커스텀 훅 조합이 정석**

- React Query는:
  - 캐시
  - 중복 요청 방지
  - open 조건부 fetch
  - 상태 기반 polling 등에 최적
- 훅은:
  - 코드 구조/역할 분리용

즉,
- React Query = 도구
- 훅 = 구조

---

## 질문 4  
**DraftMapCard에서 쓰는 타입(MapDraft)을  
LeftPanel에서도 그대로 쓰기로 했는데,  
생성시간 / 수정시간 / 크레딧 정보가 없다?**

### 원인
- DraftMapCard에서 maps 리스트를 가져올 때
- select가 “카드에 필요한 최소 필드”만 포함하고 있었음
- LeftPanel에서 쓰고 싶은 일부 meta 필드가
  애초에 리스트 쿼리에 포함되어 있지 않았음

---

## 질문 5  
**LeftPanel을 위해 추가로 받아와야 하는 컬럼은 정확히 뭐지?**

### 현재 LeftPanel이 실제로 사용하는 필드
(MapDraft 기준)

- title
- createdAt
- thumbnailUrl
- sourceUrl
- channelName
- tags
- description

👉 **현재 UI 기준으로는 추가 컬럼 없음**

---

## 하지만!
LeftPanel에 아래 정보들을 다시 보여주고 싶다면,
DraftMapCard의 리스트 쿼리에서 meta를 확장해야 함.

### 추가로 필요한 DB 컬럼 (maps 테이블)
- created_at
- updated_at
- credits_charged
- credits_charged_at
- required_credits

(선택)
- map_status
- extract_status

### 매핑 예시
- created_at → createdAt
- updated_at → updatedAt
- thumbnail_url → thumbnailUrl
- source_url → sourceUrl
- channel_name → channelName
- credits_charged → creditsCharged
- required_credits → requiredCredits

---

## 최종 구조 정리

### DraftMapCard / 리스트
- maps 테이블에서 **meta 전체** select
- mind_elixir / extracted_text 등 무거운 필드는 제외
- MapDraft 타입으로 관리
- Dialog 열 때 map(meta) 그대로 전달

### FullscreenDialog
- 최초 open 시:
  - LeftPanel은 전달받은 meta로 즉시 렌더
  - leftOpen 기본값 = true
- 동시에:
  - React Query로 detail(mind_elixir 등) fetch
  - ClientMindElixir에 주입

---

## 결론
- 데이터 흐름이 명확해짐
- UX 빠름 (Dialog 열자마자 메타 표시)
- 역할 분리 깔끔
- 이후 polling / 저장 / invalidate 확장하기 쉬운 구조

---

## Codex 작업 로그 (2026-02-04)
- 문제 -> MetadataDialog 저장 후 draft 리스트가 로컬 업데이트만 되어 서버 최신 정보가 반영되지 않음. 해결 -> 저장 성공 직후 maps 테이블에서 해당 mapId를 재조회하고 draft 리스트를 갱신하도록 변경.
- 문제 -> FullscreenDialog/LeftPanel이 가데이터를 사용함. 해결 -> MapDraft 데이터를 부모 page에서 전달하고 LeftPanel은 MapDraft 타입만 사용하도록 변경.
- 문제 -> LeftPanel에 source_type이 URL 기반 추론으로 표시됨. 해결 -> maps 테이블의 source_type을 select하여 MapDraft에 매핑 후 실제 값을 표시.
- 문제 -> FullscreenDialog의 early return으로 hooks 규칙 위반 빌드 오류 발생. 해결 -> hooks 호출 후 return 하도록 이동하고 불필요한 useMemo 제거.
