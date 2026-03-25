export type MapJobStatus =
  | "idle"
  | "queued"
  | "processing"
  | "done"
  | "failed";

export type MapDraft = {
  id: string;
  createdAt: number;
  updatedAt?: number;

  // user 입력/자동추출 메타
  sourceUrl?: string;
  sourceType?: "youtube" | "website" | "file" | "manual";
  title: string;
  channelName?: string;
  tags: string[];
  description?: string;
  summary?: string;
  sourceCharCount?: number;

  // 썸네일: 프로토타입이라 URL or 로컬 미리보기
  thumbnailUrl?: string;

  // 작업 상태
  status: MapJobStatus;

  // 결과(가짜)
  result?: any;
  error?: string;

  // 크레딧/정산
  requiredCredits?: number;
  creditsCharged?: number;
  creditsChargedAt?: number;
};
