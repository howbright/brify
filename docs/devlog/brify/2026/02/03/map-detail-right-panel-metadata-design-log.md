# Map 상세보기 RightPanel 메타데이터 설계 작업 로그

## 작업 배경
Map 상세보기를 FullStackDialog로 구성하고 있으며,  
오른쪽 RightPanel 영역에 maps 테이블 기반의 메타데이터 정보를 체계적으로 표시할 필요가 있었다.

---

## 질문 1  
**“하나의 아이템 상세보기를 FullStackDialog로 해놨는데, RightPanel에는 어떤 정보가 들어가야 할까?”**

### 문제 인식
- maps 테이블의 컬럼 수가 많아 그대로 노출하면 가독성이 떨어짐
- 사용자가 실제로 확인하고 싶은 정보와 시스템용 메타데이터가 섞여 있음
- RightPanel은 ‘본문’이 아니라 ‘구조화 / 상태 / 컨텍스트’ 역할을 해야 함

### 해결 방향
- maps.Row 컬럼을 성격별로 분류
- RightPanel을 “메타데이터 구조화 패널”로 정의
- 시각적으로 밀도는 높지만 부담 없는 구조로 설계

### 결과
RightPanel 메타데이터를 아래 5개 섹션으로 분리:

1. **핵심 정보**
   - title
   - thumbnail_url
   - description
   - tags

2. **상태 / 작업 정보**
   - map_status
   - extract_status
   - extract_job_id
   - extract_error
   - credits_charged / required_credits

3. **소스 정보**
   - source_type
   - source_url
   - channel_name

4. **설정 / 버전**
   - output_language
   - schema_version

5. **시스템 정보**
   - id
   - user_id
   - created_at
   - updated_at

---

## 질문 2  
**“RightPanel UI는 어떤 형태가 적절할까?”**

### 문제 인식
- 정보량은 많지만 ‘관리자 페이지’처럼 보이면 안 됨
- 기존 서비스 UI 컨셉(얇은 border, 과한 shadow 없음)을 유지해야 함
- 긴 텍스트(extract_error, source_url) 처리 필요

### 해결 방향
- label-value 형태의 밀도 높은 레이아웃 채택
- 섹션 단위로 border + padding 구분
- 상태 값은 Badge 형태로 시각적 강조
- copy 버튼, 접기/펼치기 등 실사용 UX 추가

### 결과
- 모든 값은 `null → "-"`로 통일
- 상태값(map_status, extract_status)은 badge 스타일
- extract_error는 접기/펼치기 가능한 경고 박스
- id, job_id, source_url은 Copy 버튼 제공
- 날짜는 ko-KR 포맷으로 가독성 개선

---

## 질문 3  
**“maps 테이블의 모든 컬럼을 RightPanel에 넣어야 할까?”**

### 문제 인식
- mind_elixir, extracted_text 등은 메타데이터 성격이 아님
- RightPanel이 과도하게 길어질 위험
- 좌측 본문 영역과 역할이 겹칠 수 있음

### 해결 방향
- RightPanel의 역할을 ‘컨텍스트 구조화’으로 한정
- 본문 데이터는 좌측 메인 영역 또는 별도 탭으로 분리

### 결과
RightPanel에서 제외하기로 결정한 컬럼:
- mind_elixir
- mind_elixir_draft
- extracted_text

→ 해당 데이터는 본문 영역(탭 / 아코디언 / 전용 뷰)에서 다루는 것이 더 적절하다고 판단

---

## 최종 정리

이번 작업을 통해 RightPanel의 역할을 다음과 같이 명확히 정의함:

- **무엇을 구조화해서 보여주는가**
- **현재 Map의 상태가 어떤지**
- **어떤 소스에서 왔는지**
- **시스템적으로 언제/누가 생성했는지**

이를 기반으로 FullStackDialog 내 RightPanel을  
“관리자용이 아닌, 사용자 친화적인 메타데이터 패널”로 구성할 수 있는 기준을 확보함.

---

## 다음 작업 후보
- map_status / extract_status → 사용자 친화 문구 매핑
- 모바일 환경에서 RightPanel → bottom sheet 전환
- 메타데이터 섹션 접기/펼치기 기능 추가
