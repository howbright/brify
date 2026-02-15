# Terms Polling & Metadata Updates — Dev Log

질문: TermsBlock에서 전체 용어 해설 요청 후 `done`인데도 폴링이 멈추지 않고 목록이 갱신되지 않음
해결방법: `terms/status` 응답 값을 클라이언트 상태로 정규화하고 `done`일 때 폴링 중지 + `fetchTerms(..., true)`로 목록 갱신하도록 처리

질문: `map_term_requests.status`를 enum으로 바꾸려다 default 캐스팅 오류 발생
해결방법: `status` 기본값 제거 → enum 타입 생성 → 컬럼 타입 변경 → 기본값 재설정 순서로 실행

질문: 기존 enum(`queued, running, succeeded, failed`)을 `processing, done, failed, idle, queued`로 바꾸고 싶음
해결방법: 기존 enum이 사용되지 않는 상태에서 삭제 후 동일 이름으로 새 enum 생성, 이후 컬럼 타입을 새 enum으로 변경

질문: enum 변경 시 `operator does not exist: map_term_request_status = text` 에러
해결방법: 체크 제약/부분 인덱스/RLS 등에서 text 비교가 남아 있어서 발생; 해당 제약/인덱스를 제거 후 타입 변경, 필요하면 enum 캐스트로 재생성

질문: `mode` 컬럼도 enum(`map_term_request_kind`)으로 변경하고 싶음
해결방법: `mode` 관련 체크 제약/부분 인덱스 삭제 → enum 생성 → 컬럼 타입 변경 → 부분 인덱스 재생성(필요 시 enum 캐스트)

질문: `processing`인데 진행바가 사라짐
해결방법: 로딩 조건을 `queued/processing` 기준으로 수정하고, 이전 `running` 상태 의존 제거

질문: 요청하지 않았는데 진행중 박스가 보임 (`idle` 상태)
해결방법: “요청이 실제로 존재하는지”를 세션 플래그로 분리하고, 요청 전에는 로딩을 표시하지 않도록 로직 변경

질문: 커스텀 요청(“용어해설 받기”)에서 `queued`인데 폴링이 멈춤
해결방법: 커스텀 요청에서도 `termsStatus = "queued"` 설정과 폴링 시작을 추가해 전체 해설과 동일한 흐름으로 통일

질문: 커스텀 입력에서 Enter로 바로 요청하고 싶음
해결방법: 입력에 `onKeyDown` 처리 추가하여 Enter 시 제출되도록 변경

질문: 요청 진행 중에도 입력 박스가 열려 있음
해결방법: 요청 시작 시 입력 박스를 자동으로 닫도록 처리

질문: `MetadataDialog`에서 제목 80자 제한을 200자로 늘리고 싶음
해결방법: `title` 입력 `slice(0, 200)`와 카운터 표시를 200 기준으로 변경
