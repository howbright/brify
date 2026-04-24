import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import type { Sql } from "postgres";

import { getDb } from "@/utils/db";

import { MapsOpenaiService, type MindNode } from "./maps.openai.service";
import {
  MAP_GENERATE_CONCURRENCY,
  MAP_GENERATE_JOB,
  MAP_GENERATE_QUEUE,
  type MapGeneratePayload,
} from "./maps.types";
import { mergeMapTags } from "./maps.tags";
import { normalizeForStructure } from "./maps.normalize";

@Processor(MAP_GENERATE_QUEUE, {
  concurrency: MAP_GENERATE_CONCURRENCY,
})
export class MapsProcessor extends WorkerHost {
  private readonly logger = new Logger(MapsProcessor.name);

  constructor(private readonly mapsOpenaiService: MapsOpenaiService) {
    super();
  }

  private getMaxLevel(node: MindNode | null | undefined, level = 1): number {
    if (!node) return level;
    const children = Array.isArray(node.children) ? node.children : [];
    if (children.length === 0) return level;
    return Math.max(
      ...children.map((child) => this.getMaxLevel(child, level + 1))
    );
  }

  private async refineShallowTreeIfNeeded(
    outputLanguage: string,
    nodeData: MindNode
  ) {
    const maxLevel = this.getMaxLevel(nodeData);
    if (maxLevel > 3) {
      return nodeData;
    }

    const rootChildren = Array.isArray(nodeData.children) ? nodeData.children : [];
    if (rootChildren.length === 0) {
      return nodeData;
    }
    this.logger.log(
      `[shallow-tree-refine] maxLevel=${maxLevel}, rootChildCount=${rootChildren.length}, mode=whole-tree`
    );

    const refined = await this.mapsOpenaiService.generateRefinedSubtree(
      outputLanguage,
      nodeData
    );
    return refined.nodeData;
  }

  private async processChunkJob(
    job: Job<Extract<MapGeneratePayload, { mode: "chunk" }>>,
    db = getDb()
  ) {
    const { chunkId, generationJobId, mapId } = job.data;
    this.logger.log(
      `[${job.id}] Start chunk generation: mapId=${mapId}, jobId=${generationJobId}, chunkId=${chunkId}`
    );

    const chunkRows = await db`
      SELECT
        c.id,
        c.job_id,
        c.chunk_index,
        c.chunk_count,
        c.chunk_text,
        c.status,
        j.output_language,
        j.source_type,
        j.final_map_id
      FROM map_generation_chunks c
      JOIN map_generation_jobs j ON j.id = c.job_id
      WHERE c.id = ${chunkId}
        AND c.job_id = ${generationJobId}
      LIMIT 1
    `;
    const chunk = chunkRows[0];

    if (!chunk) {
      throw new Error("CHUNK_NOT_FOUND");
    }

    const lockRows = await db`
      UPDATE map_generation_chunks
      SET status = ${"processing"},
          error_message = NULL,
          started_at = COALESCE(started_at, NOW()),
          updated_at = NOW()
      WHERE id = ${chunkId}
        AND status IN (${db.array(["queued", "failed"])}::map_generation_chunk_status[])
      RETURNING id
    `;

    if (!lockRows.length) {
      this.logger.warn(`[${job.id}] Skip chunk (already locked): ${chunkId}`);
      return { ok: true, skipped: "CHUNK_LOCKED", chunkId };
    }

    await db`
      UPDATE map_generation_jobs
      SET status = ${"processing_chunks"},
          current_step = ${`Generating chunk ${Number(chunk.chunk_index) + 1}/${Number(chunk.chunk_count)}`},
          started_at = COALESCE(started_at, NOW())
      WHERE id = ${generationJobId}
    `;

    try {
      const outputLanguage =
        typeof chunk.output_language === "string"
          ? chunk.output_language.trim() || null
          : null;

      const structureSourceText = normalizeForStructure(String(chunk.chunk_text));
      if (!structureSourceText) {
        throw new Error("NO_CHUNK_TEXT_AFTER_NORMALIZE");
      }

      const structureData = await this.mapsOpenaiService.generateStructure(
        (outputLanguage ?? "auto") as any,
        structureSourceText,
        chunk.source_type ?? null
      );
      const nodeData = await this.refineShallowTreeIfNeeded(
        (outputLanguage ?? "auto") as any,
        structureData.nodeData
      );

      await db`
        UPDATE map_generation_chunks
        SET status = ${"done"},
            structure_result = ${db.json({ nodeData })},
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = ${chunkId}
      `;

      const progressRows = await db`
        SELECT
          COUNT(*) FILTER (WHERE status = ${"done"})::int AS done_count,
          COUNT(*) FILTER (
            WHERE status IN (${db.array(["queued", "processing"])}::map_generation_chunk_status[])
          )::int AS pending_count
        FROM map_generation_chunks
        WHERE job_id = ${generationJobId}
      `;
      const progress = progressRows[0] as {
        done_count: number;
        pending_count: number;
      };

      if (progress.pending_count === 0) {
        await db`
          UPDATE map_generation_jobs
          SET status = ${"merging"},
              current_step = ${"All chunk maps are ready for merge"}
          WHERE id = ${generationJobId}
        `;
      } else {
        await db`
          UPDATE map_generation_jobs
          SET current_step = ${`Completed ${progress.done_count}/${Number(chunk.chunk_count)} chunks`}
          WHERE id = ${generationJobId}
        `;
      }

      return { ok: true, chunkId, generationJobId };
    } catch (error: any) {
      const message = String(error?.message ?? "Unknown chunk error");

      await db`
        UPDATE map_generation_chunks
        SET status = ${"failed"},
            error_message = ${message},
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = ${chunkId}
      `;

      await db`
        UPDATE map_generation_jobs
        SET status = ${"failed"},
            error_message = ${message},
            completed_at = NOW()
        WHERE id = ${generationJobId}
      `;

      await db`
        UPDATE maps
        SET map_status = ${"failed"},
            extract_error = ${message},
            updated_at = NOW()
        WHERE id = ${mapId}
      `;

      this.logger.error(
        `[${job.id}] Chunk generation failed: chunkId=${chunkId}, jobId=${generationJobId}`,
        error?.stack
      );

      throw error;
    }
  }

  private async processFinalJob(
    job: Job<Extract<MapGeneratePayload, { mode?: "final" }>>,
    db = getDb()
  ) {
    const mapId = job.data.mapId;
    this.logger.log(`[${job.id}] Start map generation: mapId=${mapId}`);

    const mapRows = await db`
      SELECT id, extracted_text, map_status, output_language, tags, title, youtube_title, short_title, source_type, extract_job_id
      FROM maps
      WHERE id = ${mapId}
      LIMIT 1
    `;
    const map = mapRows?.[0];

    if (!map) {
      this.logger.warn(`[${job.id}] Map not found: ${mapId}`);
      throw new Error("MAP_NOT_FOUND");
    }

    const currentJobId = String(job.id);

    if (
      map.map_status !== "queued" &&
      !(
        (
          map.map_status === "processing_structure" ||
          map.map_status === "processing_metadata" ||
          map.map_status === "failed"
        ) &&
        typeof (map as any).extract_job_id === "string" &&
        (map as any).extract_job_id === currentJobId
      )
    ) {
      this.logger.warn(
        `[${job.id}] Skip (map_status is not queued): mapId=${mapId}, status=${map.map_status}`
      );
      return { ok: true, mapId, skipped: "NOT_QUEUED" };
    }

    if (!map.extracted_text || String(map.extracted_text).trim().length === 0) {
      this.logger.warn(`[${job.id}] No extracted_text: ${mapId}`);

      await db`
        UPDATE maps
        SET map_status = ${"failed"},
            extract_error = ${"No extracted_text"},
            updated_at = NOW()
        WHERE id = ${mapId}
      `;

      throw new Error("NO_EXTRACTED_TEXT");
    }

    const lockRows = await db`
      UPDATE maps
      SET map_status = ${"processing_structure"},
          extract_error = NULL,
          updated_at = NOW()
      WHERE id = ${mapId}
        AND (
          map_status = ${"queued"}
          OR (
            (
              map_status = ${"processing_structure"}
              OR map_status = ${"processing_metadata"}
              OR map_status = ${"failed"}
            )
            AND extract_job_id = ${currentJobId}
          )
        )
      RETURNING id
    `;

    if (!lockRows || lockRows.length === 0) {
      this.logger.warn(
        `[${job.id}] Skip (already locked or status changed): ${mapId}`
      );
      return { ok: true, mapId, skipped: "LOCKED_OR_STATUS_CHANGED" };
    }

    let aiStartMs: number | null = null;
    try {
      const outputLanguage =
        typeof map.output_language === "string"
          ? map.output_language.trim() || null
          : null;

      const structureSourceText = normalizeForStructure(
        String(map.extracted_text)
      );
      if (!structureSourceText) {
        throw new Error("NO_EXTRACTED_TEXT_AFTER_NORMALIZE");
      }

      aiStartMs = Date.now();

      const structureData = await this.mapsOpenaiService.generateStructure(
        (outputLanguage ?? "auto") as any,
        structureSourceText,
        map.source_type ?? null
      );
      const nodeData = await this.refineShallowTreeIfNeeded(
        (outputLanguage ?? "auto") as any,
        structureData.nodeData
      );
      this.logger.log(`[${job.id}] Structure ready: mapId=${mapId}`);

      await db`
        UPDATE maps
        SET mind_elixir = ${db.json({ nodeData })},
            mind_elixir_draft = NULL,
            map_status = ${"processing_metadata"},
            updated_at = NOW()
        WHERE id = ${mapId}
      `;

      const metadata = await this.mapsOpenaiService.generateMetadata(
        (outputLanguage ?? "auto") as any,
        nodeData
      );
      const summary = metadata.summary.trim();
      const aiShortTitle =
        metadata.shortTitle.trim().length > 0
          ? metadata.shortTitle.trim()
          : null;
      const keywords = metadata.keywords;
      const aiProcessingMs = Date.now() - aiStartMs;
      await db.begin(async (txx) => {
        const tx = txx as unknown as Sql;
        const latestMapRows = await tx`
          SELECT tags, title, youtube_title, short_title, source_type
          FROM maps
          WHERE id = ${mapId}
          LIMIT 1
        `;
        const latestMap = latestMapRows?.[0] ?? map;
        const shortTitle =
          aiShortTitle ??
          (typeof latestMap.short_title === "string" &&
          latestMap.short_title.trim().length > 0
              ? latestMap.short_title.trim()
              : typeof latestMap.title === "string"
                ? latestMap.title.trim()
                : null);
        const currentTitle =
          typeof latestMap.title === "string" && latestMap.title.trim().length > 0
            ? latestMap.title.trim()
            : null;
        const mergedTags = mergeMapTags(
          Array.isArray(latestMap.tags) ? (latestMap.tags as string[]) : [],
          keywords,
          currentTitle
        );
        this.logger.log(
          `[${job.id}] Metadata ready: mapId=${mapId}, existingTags=${JSON.stringify(
            Array.isArray(latestMap.tags) ? latestMap.tags : []
          )}, aiKeywords=${JSON.stringify(
            keywords
          )}, mergedTags=${JSON.stringify(mergedTags)}`
        );

        if (latestMap.source_type === "youtube") {
          await tx`
            UPDATE maps
            SET extracted_text = NULL,
                title = ${currentTitle},
                summary = ${summary || null},
                short_title = ${shortTitle},
                tags = ${mergedTags},
                ai_processing_ms = ${aiProcessingMs},
                map_status = ${"done"},
                updated_at = NOW()
            WHERE id = ${mapId}
          `;
        } else {
          await tx`
            UPDATE maps
            SET extracted_text = NULL,
                summary = ${summary || null},
                tags = ${mergedTags},
                ai_processing_ms = ${aiProcessingMs},
                map_status = ${"done"},
                updated_at = NOW()
            WHERE id = ${mapId}
          `;
        }
      });

      this.logger.log(`[${job.id}] Map generated: ${mapId}`);
      return { ok: true, mapId };
    } catch (error: any) {
      const message = String(error?.message ?? "Unknown error");
      const aiProcessingMs =
        typeof aiStartMs === "number" ? Date.now() - aiStartMs : null;

      await db`
        UPDATE maps
        SET map_status = ${"failed"},
            extract_error = ${message},
            ai_processing_ms = ${aiProcessingMs},
            updated_at = NOW()
        WHERE id = ${mapId}
      `;

      this.logger.error(
        `[${job.id}] Map generation failed: ${mapId}`,
        error?.stack
      );

      throw error;
    }
  }

  async process(job: Job<MapGeneratePayload>) {
    const db = getDb();

    if (job.name !== MAP_GENERATE_JOB) {
      this.logger.warn(`[${job.id}] Unexpected job name: ${job.name}`);
      return { ok: true, skipped: "UNEXPECTED_JOB_NAME", jobName: job.name };
    }

    if (job.data?.mode === "chunk") {
      return this.processChunkJob(
        job as Job<Extract<MapGeneratePayload, { mode: "chunk" }>>,
        db
      );
    }

    return this.processFinalJob(
      job as Job<Extract<MapGeneratePayload, { mode?: "final" }>>,
      db
    );
  }
}
