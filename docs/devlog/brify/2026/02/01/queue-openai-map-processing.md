---
title: "큐 기반 구조맵 생성 처리(프롬프트 → OpenAI → DB 저장)"
date: "2026-02-01"
scope: "brify-backend maps processor"
type: "devlog"
---

# 큐 기반 구조맵 생성 처리 기록

이 문서는 **구조맵 생성 기능을 큐 기반으로 설계하고 구현하는 전체 과정**을 기록한다.  
특히 이번 작업은 단순 구현이 아니라, **상태 설계 · 중복 방지 · 프롬프트 구조 · 데이터 확정 시점**까지 함께 정리하는 것이 목적이다.

---

## <1부 - ChatGPT와 작업한 내용>

### 1. 문제 인식: 왜 단순 OpenAI 호출이 아니었는가

구조맵 생성은 다음과 같은 특성을 가진다.

- 입력 텍스트가 매우 길다
- OpenAI 응답 시간이 길다
- 실패 가능성이 존재한다
- 동시에 여러 요청이 들어올 수 있다

이 조건에서 HTTP 요청 안에서 바로 처리하는 방식은 적절하지 않았다.  
그래서 다음 요구사항을 만족하는 구조가 필요했다.

- 사용자 요청은 즉시 응답
- 실제 생성은 비동기 처리
- 중복 실행 방지
- 서버 재시작에도 안전

결론적으로 **Queue + Processor 기반 처리**를 선택했다.

---

### 2. 생성 결과는 언제 “확정”되는가

초기 논의에서 가장 중요한 질문 중 하나는 이것이었다.

> OpenAI가 처음 생성한 결과는 draft인가, 확정본인가?

결론은 명확했다.

- OpenAI의 최초 결과는 **확정본**
- 사용자가 편집을 시작하는 순간에만 draft가 필요

이에 따라 다음 규칙을 정했다.

- OpenAI 결과 → `mind_elixir`
- `mind_elixir_draft`는 `NULL`
- 사용자가 “편집” 버튼을 누르면  
  → `mind_elixir`를 복사해서 `mind_elixir_draft` 생성

이 구조 덕분에:
- 보기 모드 / 편집 모드가 명확해지고
- 원본 데이터가 항상 보존된다

---

### 3. map_status 설계 재정의

구현 중 치명적인 문제가 하나 발견되었다.

- map이 생성될 때부터 `processing` 상태로 들어가면
- Processor는 이를 처리하지 못한다

그래서 상태 흐름을 다시 정의했다.

#### map_status 흐름

### 3. map_status 설계 재정의 (idle → queued → processing → done)

초기 구현 과정에서 가장 중요한 문제는 **상태 시작점**이었다.

처음에는 map 생성 시 바로 `processing` 상태로 들어가도록 구현했는데,  
이 방식은 Processor 입장에서 치명적인 문제를 만들었다.

- Processor는 “처리 가능한 상태”만 집어야 한다
- 그런데 최초 생성부터 `processing`이면
- Processor는 영원히 해당 map을 집지 못한다

그래서 `map_status`의 **현실적인 생명주기**를 다시 정의했다.

---

#### map_status 전체 흐름




---

#### 각 상태의 의미

- **idle**
  - map 레코드만 생성된 상태
  - 아직 큐 작업을 걸지 않은 상태
  - 메타데이터 수정, 썸네일 업로드 등이 가능한 초기 상태

- **queued**
  - 큐에 job이 정상적으로 enqueue 된 상태
  - 아직 어떤 Processor도 잡지 않은 상태
  - “이제 처리 대기열에 들어갔다”는 명확한 신호

- **processing**
  - Processor가 DB 락을 획득한 상태
  - OpenAI 호출 및 구조맵 생성이 진행 중
  - 이 상태에서는 **절대 다른 Processor가 작업하면 안 됨**

- **done**
  - 구조맵 생성 완료
  - `mind_elixir`에 최종 결과가 저장된 상태
  - 사용자에게 “생성 완료”로 노출되는 상태

- **failed**
  - 처리 중 오류 발생
  - `extract_error`에 실패 원인이 기록됨
  - 재시도 여부를 판단할 수 있는 상태

---

#### 핵심 규칙

- **Processor는 오직 `queued` 상태만 처리한다**
- `idle` 상태에서는 절대 OpenAI 호출이 발생하지 않는다
- `processing` 전환은 반드시 **조건부 UPDATE**로 수행한다

```sql
UPDATE maps
SET map_status = 'processing'
WHERE id = :mapId
  AND map_status = 'queued'
RETURNING id;
```






---

### 4. 중복 실행을 막는 핵심 전략

큐만으로는 중복 실행을 완전히 막을 수 없다고 판단했다.

- 동일 job 중복 enqueue 가능
- 여러 worker 동시 실행 가능
- 서버 재시작 시 재처리 가능

그래서 **DB를 기준으로 한 조건부 락 방식**을 채택했다.

```sql
UPDATE maps
SET map_status = 'processing'
WHERE id = :mapId
  AND map_status = 'queued'
RETURNING id
```

업데이트 성공 → 내가 처리 주체

업데이트 실패 → 이미 다른 작업이 처리 중

이 방식으로 중복 실행 문제를 구조적으로 해결했다.

5. 출력 언어(output_language) 설계
프롬프트를 다듬는 과정에서 새로운 요구가 생겼다.

원문 언어와 출력 언어를 분리해야 한다

아무 설정이 없으면 원문 언어 그대로 출력

이에 따라:

maps.output_language 컬럼 추가

기본값은 NULL

Processor에서:

값이 있으면 해당 언어 사용

없으면 “스크립트의 언어를 그대로 따름”

프롬프트에 이 조건을 명시적으로 포함시켰다.

6. 설계 원칙 구조화
이번 구조의 핵심 원칙은 하나다.

큐는 실행 순서를 담당하고, 상태의 진실은 DB에 있다

그래서:

Processor는 항상 DB 상태를 먼저 확인

상태 전환은 조건부 업데이트

OpenAI 호출은 락 이후에만 수행





## <2부 - Cursor와 작업한 내용>

# 큐에서 꺼내 처리하는 전체 흐름 (상세 절차)

이 문서는 **큐에서 job을 꺼내 프롬프트를 만들고 OpenAI에 요청한 뒤 결과를 DB에 저장**하는 전체 과정을 상세 절차로 기록한다.  
작업 대상은 `brify-backend`의 `maps` 모듈이며, 큐는 BullMQ(`map_generate`)를 사용한다.

---

## 1) 큐 처리 시작점: Processor 진입

- **파일**: `brify-backend/src/maps/maps.processor.ts`
- **핵심 역할**: `MAP_GENERATE_JOB`을 꺼내서 map 생성 파이프라인을 실행

절차:
1. BullMQ가 `MAP_GENERATE_QUEUE`에서 `MAP_GENERATE_JOB`을 dequeue
2. `handleGenerate(job)`로 진입
3. `job.data.mapId`가 없으면 즉시 에러(`MISSING_MAP_ID`)로 종료

---

## 2) 대상 map 조회 및 유효성 체크

절차:
1. `maps` 테이블에서 `mapId` 조회  
   - `id, extracted_text, map_status, output_language` 로딩
2. map이 없으면 `MAP_NOT_FOUND` 에러
3. `extracted_text`가 비어 있으면 실패 처리  
   - `map_status = 'failed'`
   - `extract_error = 'No extracted_text'`

목적:
- 생성 대상이 유효한지 확인
- 생성 불가능한 상황을 빠르게 종료

---

## 3) 중복 작업 방지: Processing 락

절차:
1. 아래 조건부 업데이트로 **락 획득**
   - `map_status`가 `processing` 또는 `done`이면 업데이트 0건
2. 업데이트가 0건이면 **이미 처리 중/완료**된 것으로 판단하고 스킵

효과:
- 같은 `mapId`가 중복 처리되는 것을 방지

---

## 4) 출력 언어 결정

절차:
1. `maps.output_language` 확인
2. 값이 있으면 그 값을 사용
3. 값이 `null`이면 다음 문구로 대체  
   - **"스크립트의 언어를 그대로 따름"**

목적:
- 하드코딩된 `"ko"` 제거
- 사용자 선택 언어가 있으면 우선 적용

---

## 5) 프롬프트 생성 및 OpenAI 요청

절차:
1. `MapsOpenaiService.generateMindElixir(outputLanguage, extracted_text)` 호출
2. 내부에서 `buildStructurePrompt(...)`로 프롬프트 구성
3. `gpt-5.2` 모델에 요청
4. 응답 JSON 파싱 (유효성 검사 포함)

포인트:
- 프롬프트는 `getTreeDataFromText.ts` 템플릿 사용
- 응답은 JSON으로 강제 (`response_format: json_object`)

---

## 6) 결과 저장 (DB 업데이트)

성공 시:
1. `maps.mind_elixir`에 JSON 저장
2. `maps.mind_elixir_draft`는 `NULL`로 정리
3. `map_status = 'done'`
4. `updated_at = NOW()`

실패 시:
1. `map_status = 'failed'`
2. `extract_error`에 에러 메시지 기록
3. 에러를 다시 던져 worker 로그에 남김

---

## 7) 상태 구조화 흐름

1. **큐 dequeue**
2. **map 조회**
3. **락 획득**
4. **output_language 결정**
5. **프롬프트 생성 → OpenAI 호출**
6. **결과 저장**
7. **done 또는 failed 처리**

---

## 참고 파일

- `brify-backend/src/maps/maps.processor.ts`
- `brify-backend/src/maps/maps.openai.service.ts`
- `brify-backend/src/utils/getTreeDataFromText.ts`

