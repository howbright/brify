// app/support/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import type {
  SupportTicketCategory,
  SupportTicketCreateBody,
} from "@/app/types/support";

const categoryValues = ["bug", "idea", "billing", "other"] as const;

type SupportTicketFormValues = {
  category: SupportTicketCategory;
  title: string;
  message: string;
  email?: string | null;
  needs_reply?: boolean;
  meta?: Record<string, any> | null;
};

export default function SupportPage() {
  const t = useTranslations("Support");

  const [status, setStatus] = useState<"idle" | "success" | "warn" | "error">(
    "idle"
  );
  const [warnMessage, setWarnMessage] = useState<string | null>(null);

  // ✅ zod schema를 컴포넌트 내부에서 만들면 t()를 바로 쓸 수 있음
  const SupportTicketSchema = useMemo(
    () =>
      z.object({
        category: z.enum(categoryValues),
        title: z.string().trim().min(1, t("form.validation.titleRequired")),
        message: z.string().trim().min(1, t("form.validation.messageRequired")),
        email: z
          .union([
            z.string().trim().email(t("form.validation.emailInvalid")),
            z.literal(""),
            z.null(),
            z.undefined(),
          ])
          .optional(),
        needs_reply: z.boolean().optional(),
        meta: z.record(z.string(), z.any()).nullable().optional(),
      }),
    [t]
  );

  const categoryLabel: Record<SupportTicketCategory, string> = useMemo(
    () => ({
      bug: t("form.category.bug"),
      idea: t("form.category.idea"),
      billing: t("form.category.billing"),
      other: t("form.category.other"),
    }),
    [t]
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
    setWarnMessage(null);

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

      const data = await res.json().catch(() => null);

      const enqueue_ok = data?.enqueue_ok === true;
      const enqueue_error = (data?.enqueue_error as string | undefined) ?? undefined;

      if (!enqueue_ok) {
        setStatus("warn");
        setWarnMessage(
          enqueue_error
            ? t("form.status.warnWithError", { error: enqueue_error })
            : t("form.status.warnPrefix")
        );
      } else {
        setStatus("success");
        setWarnMessage(null);
      }

      reset(
        {
          category: values.category,
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
            {t("badge")}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
        </section>

        {/* 메인 2열 레이아웃 */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* 문의 폼 */}
          <div className="rounded-[var(--radius-lg)] border border-border bg-white p-5 shadow-sm dark:bg-card/95 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">
              {t("form.title")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {t("form.subtitle")}
            </p>

            <form
              className="mt-4 flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* 카테고리 선택 */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground/80">
                  {t("form.categoryLabel")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(categoryLabel) as SupportTicketCategory[]).map(
                    (key) => {
                      const isActive = category === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setValue("category", key, { shouldDirty: true })
                          }
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
                    }
                  )}
                </div>
              </div>

              {/* 제목 */}
              <div className="space-y-1.5">
                <label
                  htmlFor="title"
                  className="text-xs font-medium text-foreground/80"
                >
                  {t("form.field.titleLabel")}
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder={t("form.field.titlePlaceholder")}
                  className={[
                    "w-full rounded-[var(--radius-md)] border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground/70 dark:bg-card",
                    "focus:border-[color:var(--color-primary-500)] focus:ring-2 focus:ring-[rgba(37,99,235,0.12)]",
                    errors.title
                      ? "border-red-300 focus:border-red-500 focus:ring-[rgba(239,68,68,0.12)]"
                      : "border-border",
                  ].join(" ")}
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs font-medium text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* 내용 */}
              <div className="space-y-1.5">
                <label
                  htmlFor="message"
                  className="text-xs font-medium text-foreground/80"
                >
                  {t("form.field.messageLabel")}
                </label>
                <textarea
                  id="message"
                  placeholder={t("form.field.messagePlaceholder")}
                  rows={7}
                  className={[
                    "w-full rounded-[var(--radius-md)] border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground/70 dark:bg-card",
                    "focus:border-[color:var(--color-primary-500)] focus:ring-2 focus:ring-[rgba(37,99,235,0.12)]",
                    errors.message
                      ? "border-red-300 focus:border-red-500 focus:ring-[rgba(239,68,68,0.12)]"
                      : "border-border",
                  ].join(" ")}
                  {...register("message")}
                />
                {errors.message && (
                  <p className="text-xs font-medium text-red-600">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* 이메일 + 답장 필요 여부 */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-foreground/80"
                >
                  {t("form.field.emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t("form.field.emailPlaceholder")}
                  className={[
                    "w-full rounded-[var(--radius-md)] border bg-white px-3 py-2 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground/70 dark:bg-card",
                    "focus:border-[color:var(--color-primary-500)] focus:ring-2 focus:ring-[rgba(37,99,235,0.12)]",
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-[rgba(239,68,68,0.12)]"
                      : "border-border",
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
                  onClick={() =>
                    setValue("needs_reply", !(needsReply ?? true), {
                      shouldDirty: true,
                    })
                  }
                  className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <span
                    className={[
                      "flex h-4 w-4 items-center justify-center rounded border text-[10px] leading-none transition",
                      needsReply ?? true
                        ? "border-[color:var(--color-primary-500)] bg-[rgb(var(--primary-rgb)/0.08)] text-[color:var(--color-primary-600)]"
                        : "border-border bg-background text-transparent",
                    ].join(" ")}
                  >
                    ✓
                  </span>
                  <span>{t("form.field.needsReply")}</span>
                </button>
              </div>

              {/* 상태 메시지 */}
              {status === "success" && (
                <p className="text-xs font-medium text-emerald-600">
                  {t("form.status.success")}
                </p>
              )}
              {status === "warn" && (
                <p className="text-xs font-medium text-amber-600">
                  {warnMessage ?? t("form.status.warnFallback")}
                </p>
              )}
              {status === "error" && (
                <p className="text-xs font-medium text-red-600">
                  {t("form.status.error")}
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
                  {isSubmitting ? t("form.button.submitting") : t("form.button.submit")}
                </button>
              </div>
            </form>
          </div>

          {/* 우측 안내 패널 */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-[var(--radius-lg)] border border-border bg-white p-4 text-sm dark:bg-card/90">
              <h2 className="text-sm font-semibold text-foreground">
                {t("aside.speed.title")}
              </h2>
              <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {t("aside.speed.descBefore")}
                <span className="font-medium text-foreground">
                  {t("aside.speed.descStrong")}
                </span>
                {t("aside.speed.descAfter")}
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-white p-4 text-xs leading-relaxed text-muted-foreground dark:bg-muted/70">
              <h3 className="text-sm font-semibold text-foreground">
                {t("aside.tips.title")}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {(t.raw("aside.tips.items") as string[]).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-white p-4 text-xs text-muted-foreground dark:bg-card/90">
              <h3 className="text-sm font-semibold text-foreground">
                {t("aside.faq.title")}
              </h3>
              <p className="mt-2">
                {t("aside.faq.descBefore")}
                <Link
                  href="/pricing"
                  className="font-medium text-[color:var(--color-primary-600)] underline-offset-2 hover:underline"
                >
                  {t("aside.faq.linkText")}
                </Link>
                {t("aside.faq.descAfter")}
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
