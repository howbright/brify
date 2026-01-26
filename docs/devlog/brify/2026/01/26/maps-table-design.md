# Brify 구조맵(Maps) 테이블 설계 기록

이 문서는 Brify 서비스에서  
**새로운 구조맵(Map)을 생성하기 위해 필요한 데이터베이스 테이블을 설계하는 과정**을 기록한 문서입니다.

이 작업은 단순히 SQL 문법을 설명하기 위한 것이 아니라,  
**실제 서비스에서 UI·UX·비즈니스 로직을 어떻게 데이터 구조로 연결하는지**를 보여주기 위한 목적을 가지고 있습니다.

---

## 이 영상은 누구를 위한 것인가

- 혼자서 서비스를 기획·개발·운영하고 있는 **1인 개발자**
- 실무에서 **“DB를 어떻게 설계해야 할지” 항상 막막했던 주니어 개발자**
- 강의용 예제가 아니라 **실제 운영되는 서비스의 구조**를 보고 싶은 분
- AI 도구(ChatGPT 등)를 활용해 **현실적인 의사결정을 배우고 싶은 분**

이 영상에서는  
“정답 스키마”가 아니라  
**왜 이런 선택을 했는지, 무엇을 버렸는지**를 그대로 보여줍니다.

---

## 테이블 이름: 왜 `maps` 인가

Brify의 핵심은  
> 텍스트 / 영상 / 문서 → 구조화 → 시각적 맵

그래서 이 테이블은  
- 다이어그램에만 한정되지 않고
- 마인드맵, 구조도, 요약 맵 등
- 다양한 형태를 포괄할 수 있어야 했습니다.

그 결과, 너무 기술적이지도 않고  
사용자 관점에서도 이해 가능한 이름인 **`maps`**를 선택했습니다.

---

## 설계의 기준

이번 테이블 설계에서 중요하게 잡은 기준은 다음과 같습니다.

1. **UI에 이미 존재하는 모든 상태를 DB에 그대로 반영할 수 있어야 한다**
2. “나중에 정규화하자”가 아니라, **지금 서비스에 맞는 현실적인 구조**
3. Supabase(Postgres)를 그대로 활용하고, 불필요한 복잡성은 제거
4. `updated_at` 등은 **프로그래밍적으로 관리** (DB 트리거 사용 X)

---

## maps 테이블 SQL

```sql
create table public.maps (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null check (char_length(title) <= 80),
  description text,
  tags text[] not null default '{}',

  source_type text not null
    check (source_type in ('youtube','website','file','manual')),
  source_url text,
  channel_name text,
  thumbnail_url text,

  extract_status text not null default 'idle'
    check (extract_status in (
      'idle','queued','processing','cached',
      'completed','failed','error','not_found'
    )),
  extract_job_id text,
  extracted_text text,
  extract_error text,

  map_status text not null default 'processing'
    check (map_status in ('processing','done','failed')),

  required_credits integer not null default 0 check (required_credits >= 0),
  credits_charged integer not null default 0 check (credits_charged >= 0),
  credits_charged_at timestamptz,

  mind_elixir jsonb,
  mind_elixir_draft jsonb,
  schema_version int not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
); 
```

## 왜 tags를 `text[]`로 설계했는가

Brify의 태그는 다음과 같은 성격을 가집니다.

- 사용자가 직접 입력
- 최대 개수 제한
- 태그 자체에 별도 메타데이터가 없음

이 조건에서는  
정규화된 `tags` 테이블보다 `text[]` 타입이 더 단순하고 효율적이라고 판단했습니다.

### 이 설계로 가능한 것

- 모든 태그 목록 조회 가능
- 태그 클릭 → 해당 태그를 가진 맵 필터링 가능
- GIN 인덱스를 통한 충분한 검색 성능 확보

> 중요한 것은  
> **지금 정규화하지 않는 이유를 알고 선택하는 것**이라고 생각했습니다.

---

## `updated_at`을 DB가 아닌 코드에서 관리하는 이유

PostgreSQL 트리거와 함수는 편리해 보이지만, 실제 운영에서는 다음과 같은 문제가 있습니다.

- 디버깅이 어렵다
- 서비스 로직을 코드 기준으로 추적하기 힘들다
- “언제, 왜 갱신됐는지”를 파악하기가 까다롭다

Brify에서는 다음 원칙을 선택했습니다.

- 모든 update 로직을 코드에서 통제
- update 시 항상 `updated_at`을 명시적으로 갱신

이 방식이  
**1인 개발 + 장기 운영** 환경에서는 더 안전하다고 판단했습니다.

---

## 마무리

이 테이블은 “완벽한 설계”를 목표로 한 것이 아니라,  
**지금의 Brify 서비스, UI, 그리고 운영 현실에 맞춘 선택의 결과**입니다.

앞으로 다음과 같은 요구가 생긴다면:

- 태그 정규화
- 맵 버전 관리
- 협업 기능
- 크레딧 트랜잭션 분리

그때 구조를 **새로 설계하는 것이 아니라, 진화**시키면 된다고 생각합니다.

이 영상과 문서가  
**“혼자서도 실제 서비스를 만들 수 있다”**는  
작은 기준점이 되었으면 합니다.
