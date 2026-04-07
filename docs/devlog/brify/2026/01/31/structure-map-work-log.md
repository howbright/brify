
## docs/devlog/brify/2026/01/31/structure-map-work-log.md
## 구조맵 작업 로그 (2026-01-26)

### 구조화 흐름
- NestJS에서 구조맵 생성 플로우 구현, Next.js에서 호출 연결
- 구조맵 생성과 메타데이터 업데이트를 2단계로 분리
- YouTube 공식 API(googleapis)로 메타데이터 자동 채우기 구현
- 메타데이터 저장 후 Draft 목록이 페이지 내에 유지되도록 복구
- DraftMapCard 처리중 UI/라벨 개선

### 작업 흐름 (구현된 동작)
1. 클라이언트가 raw text + 최소 메타로 POST `/maps` 요청
2. 서버가 required_credits 계산 후 DB 트랜잭션으로 차감
3. `maps` 및 `credit_transactions` insert 후 커밋, 커밋 이후 큐 enqueue
4. 클라이언트에서 MetadataDialog 열어 메타데이터 보완
5. 클라이언트가 POST `/maps/:id/metadata`로 메타 저장
6. DraftMapCard 목록에 새 항목을 현재 페이지에 표시(리다이렉트 없음)

### 문제와 해결

#### 1) 시작 시 "mapId not found"
- 증상: “크레딧 차감하고 시작하기” 클릭 시 `mapId가 없습니다.`
- 원인: `/maps` 응답 전 mapId 체크가 먼저 실행됨
- 해결: 시작 단계 체크 제거, 메타 저장 단계에서만 mapId 체크

#### 2) 메타 저장 시 페이지가 이동됨
- 증상: “저장하고 계속하기”가 `/maps/:id`로 이동
- 원인: `handleSaveMetadata`의 `router.push`
- 해결: 리다이렉트 제거, Draft 목록만 갱신

#### 3) 유튜브 자동 채우기 실패 ("Could not extract functions")
- 증상: `/youtube-scripts/meta` 500 에러
- 원인: `ytdl-core`가 유튜브 변경에 깨짐
- 해결: `googleapis` + `YOUTUBE_API_KEY`로 공식 API 사용

#### 4) 로컬 개발에서 Redis 연결 실패
- 증상: 큐 enqueue 실패 → 메타 다이얼로그가 안 뜸
- 원인: `REDIS_HOST=redis`는 도커 네트워크에서만 유효
- 해결: 로컬 백엔드 + 로컬 Redis일 때 `REDIS_HOST=127.0.0.1` 사용

### 결과
- 구조맵 생성/메타 업데이트가 명확히 분리됨
- 유튜브 자동 채우기가 공식 API 기반으로 안정 동작
- 메타 저장 후 Draft 목록이 동일 페이지에 유지됨
- 처리중 UI가 개선됨
