너는 내 코드베이스에 “구조맵 생성” 플로우를 구현하는 작업자야.
프로젝트는 두 개 레포/패키지로 구성되어 있다:

- brify (Next.js App Router)
- brify-backend (NestJS)

목표:
사용자가 브리파이에서 텍스트/메타데이터를 입력하고 [구조맵생성]을 누르면,
NestJS의 POST /maps 로 요청이 가고, 서버가 다음을 처리한다:

1) required_credits 계산 (extracted_text 기준)
2) 크레딧 차감 (DB 트랜잭션으로 원자적으로)
3) maps row 생성
4) credit_transactions에 spend 로그 1건 insert (map_id FK 사용)
5) 트랜잭션 커밋 후 큐에 map 생성 job enqueue
6) enqueue 성공 시 maps.extract_job_id에 jobId 저장
7) 응답으로 mapId 및 상태/차감정보 반환
프론트는 응답받은 mapId로 /maps/[id] 로 이동한다.

중요 조건/용어:
- “summaries” 용어는 쓰지 않는다. 전부 “maps/구조맵”으로 통일한다.
- Supabase DB enum:
  - maps.source_type: 'youtube'|'website'|'file'|'manual'
  - maps.extract_status: 'idle'|'queued'|'processing'|'cached'|'completed'|'failed'|'error'|'not_found'
  - maps.map_status: 'processing'|'done'|'failed'
- 지금 단계에서는 추출 단계를 사용하지 않는다.
  => maps.extract_status는 항상 'completed'로 고정한다.
- 지금 단계에서는 raw text(extracted_text)만으로 map 생성 job을 큐에 넣는다.
- 요청 바디는 Metadata Dialog의 입력값을 모두 받는다:
  title, description, tags, thumbnail_url, channel_name, source_type, source_url, extracted_text, schema_version
  (source_url, thumbnail_url 모두 수동 입력 가능)
- credits 차감은 반드시 NestJS에서 DB 트랜잭션으로 처리한다.
- 큐 enqueue는 반드시 트랜잭션 커밋 이후에 한다.
- enqueue 결과 jobId는 maps.extract_job_id 컬럼에 저장한다(임시로 job id 저장소로 사용).당연히 map_status도 업데이트. 

credit_transactions 기록(필수):
- credit_transactions 테이블 스키마(요지):
  - user_id
  - tx_type: enum credit_transaction_type ('spend' 사용)
  - source: enum credit_transaction_source ('system' 사용)
  - reason: 문자열 (예: 'create_map')
  - map_id: maps.id FK
  - delta_free, delta_paid, delta_total: 차감량은 음수
  - balance_free_after, balance_paid_after, balance_total_after: 차감 후 잔액
  - payment_id: null
- free/paid 분리가 있으면: free 먼저 차감하고 부족분을 paid에서 차감한다.
  만약 기존 코드베이스에 “크레딧 차감 함수/정책”이 이미 있으면 그걸 재사용한다.

이번 작업 범위:
1) brify-backend (NestJS)
  A. POST /maps 구현:
     - Controller: POST /maps
     - DTO(CreateMapDto): validation 포함 (class-validator)
     - Service: createMap()
  B. required_credits 계산 함수(calcRequiredCredits):
     - extracted_text 길이를 기반으로 단순 계산으로 시작(예: 글자수/토큰 근사)
     - 현재 front쪽에 크레딧 차감기준이 모두 설정되어있음 raw_text를 먼저 정규화해준 다움에 일정 수를 기준으로 차감크레딧을 결정하게 되어있음. 서버쪽에도 그것을 확인해서 반드시 같은 기준으로 계산해야함. 
     - video-to-mapp/page.tsx 이 파일에 다 나와있음 
  C. 트랜잭션 처리(중요):
     1) user_id 확인(기존 인증 가드/미들웨어 사용)
     2) 현재 잔액 조회(무료/유료/총)
        - 코드베이스를 탐색해서 “잔액이 저장된 테이블/컬럼”과 기존 서비스를 찾아 재사용
     3) credits 충분한지 검사
     4) 차감액 계산: spentFree/spentPaid
     5) 잔액 업데이트(기존 로직/테이블에 반영)
     6) maps insert:
        - user_id
        - title (필수)
        - description (null ok)
        - tags (없으면 [])
        - thumbnail_url (null ok)
        - channel_name (null ok)
        - source_type (enum)
        - source_url (null ok)
        - extracted_text (필수)
        - required_credits
        - credits_charged = required_credits
        - credits_charged_at = now()
        - map_status = 'processing'
        - extract_status = 'completed'
        - schema_version (기본 1)
        - mind_elixir = null
        - mind_elixir_draft = null
        - extract_error = null
        - extract_job_id = null
     7) mapId 확보
     8) credit_transactions insert:
        - user_id
        - tx_type='spend'
        - source='system'
        - reason='create_map'
        - map_id = mapId
        - delta_free = -spentFree
        - delta_paid = -spentPaid
        - delta_total = -(spentFree+spentPaid)
        - balance_free_after / balance_paid_after / balance_total_after = 차감 후 잔액
        - payment_id = null
  D. 트랜잭션 커밋 이후:
     - 큐에 job enqueue(payload { mapId })
     - 성공하면 maps.extract_job_id 업데이트
     - enqueue 실패하면 maps.map_status='failed'로 업데이트하고 에러 반환 (환불은 이번 범위에서 제외)
  E. 응답(JSON):
     id, map_status, extract_status, required_credits, credits_charged, credits_charged_at,
     title, thumbnail_url, source_type, source_url, tags

2) brify (Next.js)
  A. Metadata Dialog의 입력값을 모아 POST /maps 호출
  B. Authorization 헤더에 supabase access_token 포함(현재 프로젝트의 인증 유틸을 찾아 사용)
  C. 요청 바디:
     { title, description, tags, thumbnail_url, channel_name, source_type, source_url, extracted_text, schema_version }
  D. 성공 시 router.push(`/maps/${id}`)
  E. 실패 시 에러 메시지 표시

추가 요구:
- 가능한 한 supabase Database 타입을 활용한다.
- “summaries” 관련 이름이 이번 변경 범위 안에서 보이면 “maps”로 교체한다.
- 변경된 파일 목록과 실행 방법을 마지막에 간단히 출력한다.
- 이번 작업에서는 워커 구현은 하지 않는다. 큐 enqueue 까지만 한다.

작업을 시작해.
