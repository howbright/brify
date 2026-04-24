import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";
import { Queue as BullMQQueue } from "bullmq";

import type { Enums } from "@/lib/database.types";
import { CreditSpendingService } from "@/credits/credit-spending.service";
import { getBullMQConnection } from "@/queues/bullmq.connection";
import { getDb } from "@/utils/db";

import {
  CreateMapDto,
  UpdateMapMetadataDto,
  UpdateMindElixirDto,
} from "./maps.dto";
import { calculateGenerationPlan, splitTextIntoChunks } from "./maps.chunking";
import {
  MAP_GENERATE_ATTEMPTS,
  MAP_GENERATE_BACKOFF_MS,
  MAP_GENERATE_JOB,
  MAP_GENERATE_QUEUE,
} from "./maps.types";
import type { Sql } from "postgres";

const MAX_MIND_ELIXIR_BYTES = 2 * 1024 * 1024;

@Injectable()
export class MapsService {
  private readonly mapQueue: Queue;

  constructor(private readonly creditSpendingService: CreditSpendingService) {
    this.mapQueue = new BullMQQueue(MAP_GENERATE_QUEUE, {
      connection: getBullMQConnection(),
    });
  }

  async createMap(userId: string, dto: CreateMapDto) {
    const generationPlan = calculateGenerationPlan(dto.extracted_text);
    const generationChunks =
      generationPlan.chunkCount > 1
        ? splitTextIntoChunks(dto.extracted_text, generationPlan)
        : [];
    const db = getDb();
    const normalizedOutputLanguage = dto.output_language?.trim() || null;

    let createdMap: any;
    let createdGenerationJobId: string | null = null;
    const createdChunkJobs: Array<{ chunkId: string; chunkIndex: number }> = [];

    const tags = dto.tags ?? [];
    const schemaVersion = dto.schema_version ?? 1;
    const initialShortTitle = null;
    const tagsValue = tags;

    try {
      await db.begin(async (txx) => {
        const tx = txx as unknown as Sql;

        const inserted = await tx`
          INSERT INTO maps (
            user_id,
            title,
            youtube_title,
            description,
            tags,
            thumbnail_url,
            channel_name,
            source_type,
            source_url,
            extracted_text,
            source_char_count,
            required_credits,
            credits_charged,
            credits_charged_at,
            map_status,
            extract_status,
            output_language,
            schema_version,
            short_title,
            mind_elixir,
            mind_elixir_draft,
            extract_error,
            extract_job_id
          ) VALUES (
            ${userId},
            ${dto.title},
            ${dto.youtube_title ?? null},
            ${dto.description ?? null},
            ${tagsValue},
            ${dto.thumbnail_url ?? null},
            ${dto.channel_name ?? null},
            ${dto.source_type},
            ${dto.source_url ?? null},
            ${dto.extracted_text},
            ${generationPlan.normalizedLength},
            ${generationPlan.requiredCredits},
            ${0},
            ${null},
            'idle',
            'completed',
            ${normalizedOutputLanguage},
            ${schemaVersion},
            ${initialShortTitle},
            NULL,
            NULL,
            NULL,
            NULL
          )
          RETURNING
            id,
            map_status,
            extract_status,
            required_credits,
            credits_charged,
            credits_charged_at,
            source_char_count,
            title,
            youtube_title,
            short_title,
            thumbnail_url,
            source_type,
            source_url,
            tags
        `;

        await this.creditSpendingService.chargeMapGeneration(tx, {
          userId,
          mapId: inserted[0].id as string,
          requiredCredits: generationPlan.requiredCredits,
          sourceType: dto.source_type,
          sourceUrl: dto.source_url ?? null,
        });

        const generationJobRows = await tx`
          INSERT INTO map_generation_jobs (
            user_id,
            final_map_id,
            source_type,
            source_url,
            output_language,
            title,
            youtube_title,
            channel_name,
            thumbnail_url,
            tags,
            description,
            extracted_text,
            total_char_count,
            chunk_count,
            target_chunk_chars,
            overlap_chars,
            required_credits,
            charged_credits,
            status,
            current_step
          ) VALUES (
            ${userId},
            ${inserted[0].id as string},
            ${dto.source_type},
            ${dto.source_url ?? null},
            ${normalizedOutputLanguage},
            ${dto.title},
            ${dto.youtube_title ?? null},
            ${dto.channel_name ?? null},
            ${dto.thumbnail_url ?? null},
            ${tagsValue},
            ${dto.description ?? null},
            ${dto.extracted_text},
            ${generationPlan.normalizedLength},
            ${generationPlan.chunkCount},
            ${generationPlan.targetChunkChars},
            ${generationPlan.overlapChars},
            ${generationPlan.requiredCredits},
            ${generationPlan.requiredCredits},
            'queued',
            ${
              generationChunks.length > 0
                ? `Preparing ${generationChunks.length} chunk jobs`
                : "Preparing map generation"
            }
          )
          RETURNING id
        `;

        createdGenerationJobId = generationJobRows[0]?.id as string;

        for (const chunk of generationChunks) {
          const insertedChunkRows = await tx`
            INSERT INTO map_generation_chunks (
              job_id,
              user_id,
              chunk_index,
              chunk_count,
              start_char,
              end_char,
              overlap_start_char,
              overlap_end_char,
              char_count,
              chunk_text,
              status
            ) VALUES (
              ${createdGenerationJobId},
              ${userId},
              ${chunk.chunkIndex},
              ${chunk.chunkCount},
              ${chunk.startChar},
              ${chunk.endChar},
              ${chunk.overlapStartChar},
              ${chunk.overlapEndChar},
              ${chunk.charCount},
              ${chunk.chunkText},
              'queued'
            )
            RETURNING id, chunk_index
          `;

          createdChunkJobs.push({
            chunkId: insertedChunkRows[0].id as string,
            chunkIndex: Number(insertedChunkRows[0].chunk_index ?? chunk.chunkIndex),
          });
        }

        if (createdGenerationJobId && generationChunks.length > 0) {
          await tx`
            UPDATE map_generation_jobs
            SET current_step = ${`Prepared ${generationChunks.length} chunk records`}
            WHERE id = ${createdGenerationJobId}
          `;
        }

        const chargedMapRows = await tx`
          SELECT
            id,
            map_status,
            extract_status,
            required_credits,
            credits_charged,
            credits_charged_at,
            source_char_count,
            title,
            youtube_title,
            short_title,
            thumbnail_url,
            source_type,
            source_url,
            tags
          FROM maps
          WHERE id = ${inserted[0].id}
          LIMIT 1
        `;

        createdMap = chargedMapRows[0];
      });
    } catch (err) {
      throw err;
    }

    try {
      if (createdChunkJobs.length > 0) {
        await Promise.all(
          createdChunkJobs.map(({ chunkId }) =>
            this.mapQueue.add(
              MAP_GENERATE_JOB,
              {
                mode: "chunk",
                mapId: createdMap.id,
                generationJobId: createdGenerationJobId as string,
                chunkId,
              },
              {
                attempts: MAP_GENERATE_ATTEMPTS,
                backoff: {
                  type: "exponential",
                  delay: MAP_GENERATE_BACKOFF_MS,
                },
                removeOnComplete: true,
                removeOnFail: true,
              }
            )
          )
        );

        await db`
          UPDATE maps
          SET map_status = ${"queued"}
          WHERE id = ${createdMap.id}
        `;

        if (createdGenerationJobId) {
          await db`
            UPDATE map_generation_jobs
            SET status = ${"processing_chunks"},
                current_step = ${`Queued ${createdChunkJobs.length} structure-map chunks`},
                started_at = COALESCE(started_at, NOW())
            WHERE id = ${createdGenerationJobId}
          `;
        }
      } else {
        const job = await this.mapQueue.add(
          MAP_GENERATE_JOB,
          {
            mapId: createdMap.id,
          },
          {
            attempts: MAP_GENERATE_ATTEMPTS,
            backoff: {
              type: "exponential",
              delay: MAP_GENERATE_BACKOFF_MS,
            },
            removeOnComplete: true,
            removeOnFail: true,
          }
        );

        await db`
          UPDATE maps
          SET extract_job_id = ${String(job.id)},
              map_status = ${"queued"}
          WHERE id = ${createdMap.id}
        `;

        if (createdGenerationJobId) {
          await db`
            UPDATE map_generation_jobs
            SET current_step = ${"Queued structure-map generation"}
            WHERE id = ${createdGenerationJobId}
          `;
        }
      }
    } catch (err) {
      await db`
        UPDATE maps
        SET map_status = ${"failed"}
        WHERE id = ${createdMap.id}
      `;

      if (createdGenerationJobId) {
        await db`
          UPDATE map_generation_jobs
          SET status = ${"failed"},
              error_message = ${"Failed to enqueue map job"},
              completed_at = NOW()
          WHERE id = ${createdGenerationJobId}
        `;
      }

      throw new HttpException(
        "Failed to enqueue map job",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      ...(createdMap as {
        id: string;
        map_status: Enums<"map_status">;
        extract_status: Enums<"map_extract_status">;
        required_credits: number;
        credits_charged: number;
        credits_charged_at: string | null;
        source_char_count: number | null;
        title: string;
        youtube_title: string | null;
        short_title: string | null;
        thumbnail_url: string | null;
        source_type: Enums<"map_source_type">;
        source_url: string | null;
        tags: string[];
      }),
      generation_job_id: createdGenerationJobId,
      chunk_count: generationPlan.chunkCount,
    };
  }

  async updateMetadata(userId: string, mapId: string, dto: UpdateMapMetadataDto) {
    const db = getDb();

    const updated = await db`
      UPDATE maps
        SET
          title = COALESCE(${dto.title ?? null}::text, title),
          youtube_title = COALESCE(${dto.youtube_title ?? null}::text, youtube_title),
          description = COALESCE(${dto.description ?? null}::text, description),
          tags = COALESCE(${dto.tags ?? null}::text[], tags),
        thumbnail_url = COALESCE(${dto.thumbnail_url ?? null}::text, thumbnail_url),
        channel_name = COALESCE(${dto.channel_name ?? null}::text, channel_name),
        source_type = COALESCE(${dto.source_type ?? null}::map_source_type, source_type),
        source_url = COALESCE(${dto.source_url ?? null}::text, source_url),
        updated_at = NOW()
      WHERE id = ${mapId} AND user_id = ${userId}
      RETURNING
        id,
        title,
        youtube_title,
        short_title,
        description,
        tags,
        thumbnail_url,
        channel_name,
        source_type,
        source_url,
        updated_at
    `;

    if (!updated.length) {
      throw new HttpException("Map not found", HttpStatus.NOT_FOUND);
    }

    return updated[0];
  }

  async deleteOne(mapId: string, userId: string) {
    const db = getDb();

    const deleted = await db`
      DELETE FROM maps
      WHERE id = ${mapId} AND user_id = ${userId}
      RETURNING id
    `;

    if (!deleted.length) {
      throw new HttpException(
        { ok: false, message: "Map not found" },
        HttpStatus.NOT_FOUND
      );
    }

    return { ok: true, deletedCount: 1, id: deleted[0].id as string };
  }

  async deleteMany(ids: string[], userId: string) {
    if (!ids || ids.length === 0) {
      throw new HttpException(
        { ok: false, message: "ids is required" },
        HttpStatus.BAD_REQUEST
      );
    }

    if (ids.length > 100) {
      throw new HttpException(
        { ok: false, message: "ids must be <= 100" },
        HttpStatus.BAD_REQUEST
      );
    }

    const db = getDb();

    const deleted = await db`
      DELETE FROM maps
      WHERE id = ANY(${db.array(ids)}) AND user_id = ${userId}
      RETURNING id
    `;

    const deletedIds = deleted.map((row) => row.id as string);

    return { ok: true, deletedCount: deletedIds.length, ids: deletedIds };
  }

  async updateMindElixir(
    userId: string,
    mapId: string,
    dto: UpdateMindElixirDto
  ) {
    if (
      !dto?.mindElixir ||
      typeof dto.mindElixir !== "object" ||
      Array.isArray(dto.mindElixir)
    ) {
      throw new HttpException(
        { ok: false, message: "mindElixir must be an object" },
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    if (!("nodeData" in dto.mindElixir)) {
      throw new HttpException(
        { ok: false, message: "mindElixir.nodeData is required" },
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    const serialized = JSON.stringify(dto.mindElixir);
    const sizeBytes = Buffer.byteLength(serialized, "utf8");

    if (sizeBytes <= 0 || sizeBytes > MAX_MIND_ELIXIR_BYTES) {
      throw new HttpException(
        {
          ok: false,
          message: "mindElixir is too large",
          limitBytes: MAX_MIND_ELIXIR_BYTES,
        },
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    const db = getDb();

    const mapRows = await db`
      SELECT id, user_id, version
      FROM maps
      WHERE id = ${mapId}
      LIMIT 1
    `;

    if (!mapRows.length) {
      throw new HttpException("Map not found", HttpStatus.NOT_FOUND);
    }

    const map = mapRows[0] as { id: string; user_id: string; version: any };

    if (map.user_id !== userId) {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    const currentVersion = Number(map.version ?? 0);
    const shouldLock = dto.baseVersion !== undefined && dto.baseVersion !== null;
    const nextVersion = shouldLock ? currentVersion + 1 : currentVersion;

    if (shouldLock && currentVersion !== dto.baseVersion) {
      throw new HttpException("Version conflict", HttpStatus.CONFLICT);
    }

    const updated = shouldLock
      ? await db`
          UPDATE maps
          SET mind_elixir = ${db.json(dto.mindElixir)},
              updated_at = NOW(),
              version = ${nextVersion}
          WHERE id = ${mapId}
          RETURNING id, mind_elixir, updated_at, version
        `
      : await db`
          UPDATE maps
          SET mind_elixir = ${db.json(dto.mindElixir)},
              updated_at = NOW()
          WHERE id = ${mapId}
          RETURNING id, mind_elixir, updated_at, version
        `;

    const row = updated[0];

    return {
      id: row.id as string,
      mindElixir: row.mind_elixir,
      version: row.version,
      updatedAt: row.updated_at,
    };
  }
}
