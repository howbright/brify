# Mind Map Anchor Spec v1 (Step 1)

이 문서는 `원문 점프(anchorText)` 기능을 위한 **생성 스펙 확정안**입니다.
목표는 타임스탬프 품질 이슈를 제거하고, 각 노드에서 원문 위치를 빠르게 찾게 만드는 것입니다.

## 1) 핵심 원칙
- 타임스탬프/시간코드 필드 완전 제거
- 각 노드마다 `anchorText` 1~2개 생성
- 각 노드마다 `anchorKeywords` 2~6개 생성
- 앵커는 **원문에 실제 존재하는 짧은 문장/구**여야 함 (요약문 금지)

## 2) 노드 메타 스키마 (v1)
```json
{
  "id": "node-uuid-or-seq",
  "topic": "노드 제목",
  "children": [],
  "meta": {
    "anchorText": [
      "원문에 실제로 있는 고유 문장 또는 구 1",
      "원문에 실제로 있는 고유 문장 또는 구 2"
    ],
    "anchorKeywords": [
      "핵심키워드1",
      "핵심키워드2"
    ]
  }
}
```

### 필드 규칙
- `meta.anchorText`
  - 개수: 1~2
  - 길이: 권장 18~120자
  - 조건: 원문 그대로 복원 가능한 고유 구절
  - 금지: "핵심은 ~이다" 같은 생성 요약문
- `meta.anchorKeywords`
  - 개수: 2~6
  - 조건: 검색 보조용 명사/전문용어 중심

## 3) 프롬프트 요구사항 (백엔드 시스템 지시문에 추가)
아래 요구를 모델 시스템 프롬프트에 명시:

1. 시간코드/타임스탬프를 절대 생성하지 말 것
2. 각 노드 `meta.anchorText`를 1~2개 생성할 것
3. `anchorText`는 반드시 원문에 존재하는 구절일 것
4. 각 노드 `meta.anchorKeywords`를 2~6개 생성할 것
5. 최종 출력은 지정 JSON 스키마만 반환할 것

## 4) 백엔드 검증(필수)
모델 응답 수신 후 서버에서 검증:
- `timestamp`, `timecode`, `hh:mm:ss` 패턴 존재 시 실패 처리 또는 정정 재시도
- `anchorText` 비어 있으면 재시도
- `anchorKeywords` 비어 있으면 재시도
- JSON 스키마 불일치 시 재시도

## 5) 수용 기준 (Step 1 완료 조건)
- 생성 결과에서 타임스탬프 필드가 0건
- 노드의 95% 이상이 `anchorText` 1개 이상 포함
- 노드의 95% 이상이 `anchorKeywords` 2개 이상 포함
- 기존 mind map 렌더링과 호환 (추가 meta는 optional)

## 6) 다음 단계(참고)
- Step 2: 원문 24시간 TTL 저장 정책
- Step 3: 노드 클릭 시 `find(anchorText)` 점프 UI
- Step 4: 검색 실패 시 유사검색 + 후보 3개 제시

