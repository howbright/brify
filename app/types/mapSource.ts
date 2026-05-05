import type { Database } from "@/app/types/database.types";

export type MapRow = Database["public"]["Tables"]["maps"]["Row"];
export type MapSourceExpiresAt = MapRow extends { source_expires_at: infer T }
  ? T
  : string | null;
export type MapSourceRetentionHours =
  MapRow extends { source_retention_hours: infer T } ? T : number;

export type SourceFindStatus = "found" | "not_found" | "expired";

export type SourceFindCandidate = {
  start: number;
  end: number;
  score: number;
  matchedAnchor: string;
  snippet: string;
  snippetStart: number;
  snippetEnd: number;
};

export type SourceFindResponse = {
  status?: SourceFindStatus;
  message?: string;
  error?: unknown;
  candidates?: SourceFindCandidate[];
  sourceText?: string | null;
  expiresAt?: MapSourceExpiresAt;
  retentionHours?: MapSourceRetentionHours;
  hasPaidAccess?: boolean;
  allowedOptions?: number[];
};
