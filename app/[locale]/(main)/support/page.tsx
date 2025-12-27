// app/support/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupportTicketCategory, SupportTicketCreateBody } from "@/app/types/support";

const categoryValues = ["bug", "idea", "billing", "other"] as const;

const SupportTicketSchema = z.object({
    category: z.enum(categoryValues),
    title: z.string().trim().min(1, "제목을 입력해 주세요."),
    message: z.string().trim().min(1, "상세 내용을 입력해 주세요."),
    email: z
      .union([
        z.string().trim().email("이메일 형식이 올바르지 않아요."),
        z.literal(""),
        z.null(),
        z.undefined(),
      ])
      .optional(),
    needs_reply: z.boolean().optional(),
  
    // ✅ fix: key/value schema 둘 다 넣기
    meta: z.record(z.string(), z.any()).nullable().optional(),
  });
  

type SupportTicketFormValues = z.infer<typeof SupportTicketSchema>;

export default function SupportPage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const categoryLabel: Record<SupportTicketCategory, string> = useMemo(
    () => ({
      bug: "버그 제보",
      idea: "기능 제안",
      billing: "결제·크레딧",
      other: "기타 문의",
    }),
    []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportTicketFormValues>({
    resolver: zodResolver(SupportTicketSchema),
    defaultValues: {
      category: "bug",
      title: "",
      message: "",
      email: "",
      needs_reply: true,
      meta: null,
    },
    mode: "onSubmit",
  });

  const category = watch("category");
  const needsReply = watch("needs_reply");

  async function onSubmit(values: SupportTicketFormValues) {
    setStatus("idle");

    // ✅ types/supports.ts의 요청 바디 타입을 그대로 따르되,
    // email은 ""면 null로 보내는게 보통 깔끔함
    const body: SupportTicketCreateBody = {
      category: values.category,
      title: values.title,
      message: values.message,
      email: values.email && values.email.length > 0 ? values.email : null,
      needs_reply: values.needs_reply ?? true,
      meta: values.meta ?? null,
    };

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      reset(
        {
          category: values.category, // 카테고리/needsReply/email 유지하고 싶으면 이렇게
          title: "",
          message: "",
          email: values.email ?? "",
          needs_reply: values.needs_reply ?? true,
          meta: values.meta ?? null,
        },
        { keepErrors: false }
      );
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-background-soft dark:bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        {/* 상단 헤더 영역 */}
        <section className="flex flex-col gap-3">
          <div className="inline-flex w-fit items-center rounded-full border border-border bg-[color:var(--glass)] px-3 py-1 text-xs font-medium text-muted-foreground">
            문의 / 피드백
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            브리피에게 한마디
          </h1>
        </section>

        {/* 메인 2열 레이아웃 */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* 문의 폼 */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-white p-5 shadow-sm dark:bg-card/95 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">문의 내용 작성</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              최대한 구체적으로 적어 주시면 더 빠르고 정확하게 도와드릴 수 있어요.
            </p>

            <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              {/* 카테고리 선택 */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground/80">문의 유형</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(categoryLabel) as SupportTicketCategory[]).map((key) => {
                    const isActive = category === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setValue("category", key, { shouldDirty: true })}
                        className={[
                          "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          isActive
                            ? "border-[color:var(--color-primary-300)] bg-[rgb(var(--primary-rgb)/0.06)] text-[color:var(--color-primary-600)]"
                            : "border-border bg-background text-muted-foreground hover:bg-muted",
                        ].join(" ")}
                      >
                        {categoryLabel[key]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 제목 */}
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-xs font-medium text-foreground/80">
                  제목
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="예: 요약 결과가 보이지 않는 문제가 있어요"
                  className={[
                    "w-full rounded-[var(--radius-md)] border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground/70 dark:bg-card",
                    "focus:border-[color:var(--color-primary-500)] focus:ring-2 focus:ring-[rgba(37,99,235,0.12)]",
                    errors.title ? "border-red-300 focus:border-red-500 focus:ring-[rgba(239,68,68,0.12)]" : "border-border",
                  ].join(" ")}
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs font-medium text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* 내용 */}
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-medium text-foreground/80">
                  상세 내용
                </label>
                <textarea
                  id="message"
                  placeholder={`어떤 상황에서 문제가 발생했는지,\n사용하던 브라우저·OS, 오류 화면이 있었다면 메시지를 적어 주세요.\n기능 제안이라면 어떤 작업을 더 쉽게 하고 싶은지도 알려주시면 좋아요.`}
                  rows={7}
                  className={[
                    "w-full rounded-[var(--radius-md)] border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground/70 dark:bg-card",
                    "focus:border-[color:var(--color-primary-500)] focus:ring-2 focus:ring-[rgba(37,99,235,0.12)]",
                    errors.message ? "border-red-300 focus:border-red-500 focus:ring-[rgba(239,68,68,0.12)]" : "border-border",
                  ].join(" ")}
                  {...register("message")}
                />
                {errors.message && (
                  <p className="text-xs font-medium text-red-600">{errors.message.message}</p>
                )}
              </div>

              {/* 이메일 + 답장 필요 여부 */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-foreground/80">
                  답변을 받을 이메일 (선택)
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="회원 이메일로 답장 드려요. 다른 메일로 받고 싶다면 적어 주세요."
                  className={[
                    "w-full rounded-[var(--radius-md)] border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground/70 dark:bg-card",
                    "focus:border-[color:var(--color-primary-500)] focus:ring-2 focus:ring-[rgba(37,99,235,0.12)]",
                    errors.email ? "border-red-300 focus:border-red-500 focus:ring-[rgba(239,68,68,0.12)]" : "border-border",
                  ].join(" ")}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs font-medium text-red-600">
                    {errors.email.message as string}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setValue("needs_reply", !(needsReply ?? true), { shouldDirty: true })}
                  className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <span
                    className={[
                      "flex h-4 w-4 items-center justify-center rounded border text-[10px] leading-none transition",
                      (needsReply ?? true)
                        ? "border-[color:var(--color-primary-500)] bg-[rgb(var(--primary-rgb)/0.08)] text-[color:var(--color-primary-600)]"
                        : "border-border bg-background text-transparent",
                    ].join(" ")}
                  >
                    ✓
                  </span>
                  <span>이 문의에 대한 답장이 필요해요</span>
                </button>
              </div>

              {/* 상태 메시지 */}
              {status === "success" && (
                <p className="text-xs font-medium text-emerald-600">
                  문의가 정상적으로 접수되었어요. 빠르게 확인하고 답장 드릴게요.
                </p>
              )}
              {status === "error" && (
                <p className="text-xs font-medium text-red-600">
                  제목과 내용을 다시 한 번 확인해 주세요. 계속 문제가 발생하면 다른 브라우저에서 다시 시도해 주세요.
                </p>
              )}

              {/* 제출 버튼 */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={[
                    "inline-flex w-full items-center justify-center rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold transition",
                    "bg-[color:var(--color-primary-500)] text-[color:var(--color-primary-foreground)]",
                    "hover:bg-[color:var(--color-primary-hover)] hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-sm",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  ].join(" ")}
                >
                  {isSubmitting ? "보내는 중..." : "문의 보내기"}
                </button>
              </div>
            </form>
          </div>

          {/* 우측 안내 패널 */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-[var(--radius-lg)] border border-border bg-white p-4 text-sm dark:bg-card/90">
              <h2 className="text-sm font-semibold text-foreground">응답 속도 안내</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                문의가 많지 않은 현재에는 보통{" "}
                <span className="font-medium text-foreground">24시간 이내</span>에 답장을 드리려고 노력하고 있어요.
                <br />
                주말·공휴일에는 다소 늦어질 수 있어요.
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-white p-4 text-xs leading-relaxed text-muted-foreground dark:bg-muted/70">
              <h3 className="text-sm font-semibold text-foreground">더 빠른 처리를 위한 TIP</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>가능하다면 재현 방법을 순서대로 적어 주세요.</li>
                <li>특정 브라우저/기기에서만 발생하면 그 정보를 함께 적어 주세요.</li>
                <li>스크린샷이 있다면, 답장 메일을 받으신 뒤 회신으로 첨부해 주세요.</li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-white p-4 text-xs text-muted-foreground dark:bg-card/90">
              <h3 className="text-sm font-semibold text-foreground">자주 묻는 질문</h3>
              <p className="mt-2">
                크레딧, 가격 정책, 결제 영수증 관련 안내는{" "}
                <Link
                  href="/pricing"
                  className="font-medium text-[color:var(--color-primary-600)] underline-offset-2 hover:underline"
                >
                  요금제 페이지
                </Link>
                에서 한 번 더 확인하실 수 있어요.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
