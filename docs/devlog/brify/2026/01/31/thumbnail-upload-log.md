## 썸네일 이미지 업로드 작업 로그 (2026-01-31)

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
