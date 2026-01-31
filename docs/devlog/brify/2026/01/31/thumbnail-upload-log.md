## 썸네일 이미지 업로드 작업 로그 (2026-01-31)

### 문제 인식
MetadataDialog에 썸네일 업로드 기능을 추가하면서, 단순 URL 저장이 아니라  
**Supabase Storage를 이용한 실제 이미지 업로드 구조**를 어떻게 설계해야 할지 정리할 필요가 있었다.

특히 다음과 같은 질문들이 있었다.

ChatGPT에게 질문 

### 질문 1) Supabase에서 이미지 업로드는 보통 어떤 방식으로 구현하나?
- Storage 버킷을 생성하고 public bucket으로 설정
- RLS 정책으로 **본인 폴더만 업로드/수정 허용**
- 클라이언트에서 직접 업로드
- 업로드 후 public URL을 DB에 저장하는 방식이 일반적

이를 기준으로 서버를 거치지 않고 클라이언트에서 직접 업로드하는 방향으로 결정했다.

---

### 질문 2) 썸네일 업로드는 언제 실행해야 하는가?
썸네일 입력 케이스는 다음 3가지로 정리되었다.

1. 기존 썸네일을 그대로 유지
2. 유튜브 URL을 입력해 자동으로 썸네일 사용
3. 사용자가 직접 이미지 파일을 업로드

결론:
- **Supabase Storage 업로드는 3번(수동 업로드)일 때만 실행**
- 1, 2번의 경우에는 URL만 저장하고 업로드는 하지 않음

이 기준으로 `thumbFile`이 있을 때만 업로드하도록 로직을 명확히 분리했다.

---

### 질문 3) 썸네일 저장 단위는 user 기준이 맞을까?
초기에는 `{userId}/thumbnail.webp` 구조를 고려했으나,
Brify 서비스 특성상 **구조맵(map) 하나당 썸네일 1개가 더 자연스럽다고 판단**했다.

최종 경로 결정:
{userId}/maps/{mapId}/thumbnail.webp

- mapId 기준으로 항상 동일 경로 사용
- 업로드 시 `upsert`로 덮어쓰기
- map당 썸네일 1개 유지



Cursor에 질문 

### 목적
- MetadataDialog에서 수동 썸네일 업로드를 지원
- mapId당 썸네일 1개 유지 (storage path 고정)
- 캐시 문제로 인해 DraftMapCard 이미지가 갱신되지 않는 이슈 해결

### 구현 흐름
1. 사용자가 MetadataDialog에서 이미지 파일 선택
2. 프론트에서 이미지 검증 → webp 변환/리사이즈
3. Supabase Storage `thumbnails` 버킷에 업로드 (path: `{userId}/maps/{mapId}/thumbnail.webp`)
4. 업로드 후 public URL 반환
5. `/maps/:id/metadata`로 썸네일 URL 저장
6. DraftMapCard에 썸네일 반영

### 문제와 해결

#### 1) mapId가 없어 업로드 실패
- 증상: “mapId가 없어 썸네일을 업로드할 수 없습니다.”
- 원인: MetadataDialog에 mapId prop이 전달되지 않음
- 해결: MetadataDialog 호출 시 `mapId` 전달 (editingDraft.id 또는 createdMapId)

#### 2) 이미지 덮어쓰기 후 UI 갱신 안 됨
- 증상: Storage에는 덮어쓰기 됐는데 DraftMapCard가 이전 이미지 표시
- 원인: 동일 경로(`thumbnail.webp`) 덮어쓰기로 인해 브라우저 캐시 사용
- 해결: DraftMapCard에 캐시 버스터(`?t=timestamp`) 적용
  - 데이터는 mapId당 1개 유지
  - 화면 렌더링만 최신 이미지로 갱신

### 결과
- mapId당 썸네일 1개 유지
- 수동 업로드 후 DraftMapCard에 즉시 반영
- 캐시 문제로 인한 이미지 갱신 실패 해결
