# Brify | 구조맵 생성 플로우 구현 (Maps + Credits + Transaction)

이번 영상에서는  
Brify 서비스에서 **[구조맵 생성] 버튼을 눌렀을 때 실제로 어떤 일이 일어나는지**를  
프론트엔드(Next.js)와 백엔드(NestJS) 기준으로 **끝까지 구현**했다.

단순히 API 하나 추가하는 작업이 아니라,

- 크레딧 차감
- DB 트랜잭션 설계
- 구조맵(Maps) 도메인 정리
- credit_transactions 기록
- 큐 enqueue까지

**실제 돈이 걸린 서비스에서 반드시 필요한 흐름**을 처음부터 다시 잡는 과정이다.

---

## 🎯 이번 영상의 목표

사용자가 Brify에서 텍스트 + 메타데이터를 입력하고  
**[구조맵 생성] 버튼을 누르면** 다음 흐름이 실행된다.

1. 서버에서 required_credits 계산 (extracted_text 기준)
2. 크레딧 차감 (DB 트랜잭션, 원자적 처리)
3. maps 테이블에 구조맵 row 생성
4. credit_transactions 테이블에 spend 로그 1건 기록
5. 트랜잭션 커밋
6. 구조맵 생성 작업을 큐에 enqueue
7. mapId + 상태 정보를 응답
8. 프론트는 `/maps/[id]` 로 이동

> ❗ 이 과정에서 **summaries라는 용어는 완전히 제거**하고  
> 모든 도메인을 **maps / 구조맵** 기준으로 통일했다.

---

## 🧱 데이터베이스 설계 정리

### maps 테이블 (핵심)
- source_type → enum (`youtube | website | file | manual`)
- extract_status → enum  
  → **현재 단계에서는 항상 `completed`로 고정**
- map_status → enum (`processing | done | failed`)
- required_credits / credits_charged / credits_charged_at
- extract_job_id → 큐 job id 저장용(임시)
- mind_elixir / mind_elixir_draft → 결과 저장용

### credit_transactions 테이블
기존 `summary_id` 컬럼을 제거하고 **map_id FK**로 전환했다.

- tx_type: `spend`
- source: `system`
- reason: `create_map`
- delta_free / delta_paid / delta_total (음수)
- balance_*_after (차감 후 잔액)
- map_id → `maps.id` FK

> 이제 크레딧 차감은  
> **“잔액 변경 + 거래 로그 기록”이 항상 같이 움직인다.**

---

## 🔁 크레딧 차감 정책

- 무료 크레딧 → 먼저 차감
- 부족하면 유료 크레딧 차감
- 모든 계산은 **NestJS 서버에서만** 수행
- 프론트의 예상 크레딧 계산과 **동일한 기준**을 서버에서 재검증
  - 기준 로직은 `video-to-map/page.tsx` 기준으로 서버에 동일 구현

---

## 🧠 서버 처리 흐름 (NestJS)

### POST /maps

- Map 모듈 신규 구현 (Controller / Service / DTO)
- `CreateMapDto` + class-validator
- Supabase DB 직접 연결 (pg Pool)
- DB 트랜잭션으로 다음 작업을 한 번에 처리:
  - 크레딧 잔액 확인
  - 차감
  - maps insert
  - credit_transactions insert

트랜잭션 커밋 **이후에만** 큐 enqueue 실행.

enqueue 실패 시:
- maps.map_status → `failed`
- 환불 로직은 이번 범위에서는 제외

---

## 🖥️ 프론트엔드 처리 (Next.js)

- Metadata Dialog에서 모든 입력값 수집
  - title
  - description
  - tags
  - thumbnail_url
  - channel_name
  - source_type
  - source_url
  - extracted_text
  - schema_version
- Supabase access_token을 Authorization 헤더에 포함
- POST /maps 호출
- 성공 시 `/maps/[id]` 로 이동
- 실패 시 에러 메시지 표시

---

## ⚠️ 이번 영상에서 의도적으로 제외한 것

- 워커 구현 (실제 OpenAI 호출)
- 결과 생성 로직
- 환불 처리
- 재시도 전략

이번 영상의 목적은  
**“구조맵 생성의 시작 지점과 돈이 오가는 구조를 정확히 잡는 것”**이다.

---

## ✨ 왜 이 작업이 중요한가

AI 서비스에서 가장 위험한 순간은  
**“요청은 성공했는데, 돈 처리는 애매한 상태”**다.

그래서 이번 구현에서는:

- 모든 금전 관련 로직을 DB 트랜잭션 안에 넣고
- 상태(map_status)를 단일 진실 원천으로 만들고
- 큐는 항상 커밋 이후에만 실행하도록 설계했다

이 구조는  
**혼자 만드는 서비스라도, 팀이 커져도 그대로 가져갈 수 있는 구조**다.

---

## 🔗 관련 링크

- Brify 서비스: https://brify.app
- (코드/문서 링크는 여기에 추가)

---

다음 영상에서는  
**큐 워커 구현 + 구조맵 실제 생성(OpenAI) + 실패/환불 처리**로 이어갈 예정이다.
