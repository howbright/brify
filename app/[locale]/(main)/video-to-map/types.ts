export type MapJobStatus =
  | "idle"
  | "queued"
  | "retrying"
  | "processing_structure"
  | "processing_metadata"
  | "done"
  | "failed";

export type MapDraftKind = "map" | "chunk" | "merge";

export type MapDraft = {
  id: string;
  version?: number;
  createdAt: number;
  updatedAt?: number;
  visible?: boolean;
  kind?: MapDraftKind;
  parentMapId?: string;
  generationJobId?: string;
  chunkId?: string;
  chunkIndex?: number;
  chunkCount?: number;
  helperText?: string;

  // user 입력/자동추출 메타
  sourceUrl?: string;
  sourceType?: "youtube" | "website" | "file" | "manual";
  title: string;
  youtubeTitle?: string;
  shortTitle?: string;
  channelName?: string;
  tags: string[];
  description?: string;
  summary?: string;
  sourceCharCount?: number;

  // 썸네일: 프로토타입이라 URL or 로컬 미리보기
  thumbnailUrl?: string;
  notesCount?: number;
  termsCount?: number;
  readStatus?: "unread" | "in_progress" | "read";
  starred?: boolean;
  progressPercent?: number;
  lastViewedAt?: number;

  // 작업 상태
  status: MapJobStatus;

  // 결과(가짜)
  result?: unknown;
  error?: string;

  // 크레딧/정산
  requiredCredits?: number;
  creditsCharged?: number;
  creditsChargedAt?: number;
};
