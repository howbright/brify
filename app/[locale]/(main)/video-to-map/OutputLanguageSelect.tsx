"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

export type LangOption = {
  code: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  quickOptions?: LangOption[];
  allOptions?: LangOption[];
};

const DEFAULT_QUICK: LangOption[] = [
  { code: "auto", label: "자동(입력 언어)" },
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-Hans", label: "简体中文" },
  { code: "zh-Hant", label: "繁體中文" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
];

const DEFAULT_ALL: LangOption[] = [
  { code: "auto", label: "자동(입력 언어)" },

  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-Hans", label: "简体中文" },
  { code: "zh-Hant", label: "繁體中文" },

  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "pl", label: "Polski" },
  { code: "cs", label: "Čeština" },
  { code: "hu", label: "Magyar" },
  { code: "ro", label: "Română" },
  { code: "el", label: "Ελληνικά" },
  { code: "uk", label: "Українська" },
  { code: "ru", label: "Русский" },

  { code: "ar", label: "العربية" },
  { code: "he", label: "עברית" },
  { code: "fa", label: "فارسی" },
  { code: "sw", label: "Kiswahili" },

  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ur", label: "اردو" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },

  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "fil", label: "Filipino" },

  { code: "tr", label: "Türkçe" },
  { code: "sr", label: "Српски" },
  { code: "bg", label: "Български" },
];

function uniqByCode(list: LangOption[]) {
  const map = new Map<string, LangOption>();
  for (const item of list) map.set(item.code, item);
  return Array.from(map.values());
}

export default function OutputLanguageSelect({
  value,
  onChange,
  disabled,
  quickOptions,
  allOptions,
}: Props) {
  const quick = useMemo(() => uniqByCode(quickOptions ?? DEFAULT_QUICK), [quickOptions]);
  const all = useMemo(() => uniqByCode(allOptions ?? DEFAULT_ALL), [allOptions]);

  const [isOpen, setIsOpen] = useState(false);
  const [q, setQ] = useState("");

  const current =
    all.find((o) => o.code === value) ?? quick.find((o) => o.code === value) ?? null;

  const currentLabel = current?.label ?? value;

  const selectOptions = useMemo(() => {
    const inQuick = quick.some((o) => o.code === value);
    if (inQuick) return quick;

    const injected: LangOption = {
      code: value,
      label: `현재 선택: ${currentLabel} (${value})`,
    };

    return [injected, ...quick];
  }, [quick, value, currentLabel]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return all;
    return all.filter((o) => {
      const label = o.label.toLowerCase();
      const code = o.code.toLowerCase();
      return label.includes(keyword) || code.includes(keyword);
    });
  }, [q, all]);

  const handlePick = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setQ("");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-600 dark:text-neutral-300">출력 언어</span>

        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="
              appearance-none
              rounded-2xl border border-neutral-200 bg-white
              pl-3 pr-8 py-1.5 text-xs md:text-sm text-neutral-900
              hover:bg-neutral-50
              focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60
              dark:border-white/12 dark:bg-black/35 dark:text-neutral-50 dark:hover:bg-black/45
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {selectOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>

          <Icon
            icon="mdi:chevron-down"
            className="
              pointer-events-none absolute right-2 top-1/2 -translate-y-1/2
              h-4 w-4 text-neutral-500 dark:text-neutral-400
            "
          />
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="
            rounded-2xl border border-neutral-200 bg-neutral-50
            px-2.5 py-1.5 text-xs font-semibold text-neutral-700
            hover:bg-neutral-100
            dark:border-white/12 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          더보기…
        </button>

        <span className="hidden md:inline text-[11px] text-neutral-500 dark:text-neutral-400">
          구조맵에 표시될 언어를 선택해 주세요.
        </span>
      </div>

      {isOpen && (
        <div
          className="
            fixed inset-0 z-50 flex items-center justify-center px-4
            bg-black/55 backdrop-blur-sm
            dark:bg-black/65
          "
          role="dialog"
          aria-modal="true"
          aria-label="출력 언어 선택"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="
              relative w-full max-w-xl rounded-3xl
              bg-white/98 border border-neutral-200
              shadow-[0_24px_70px_-30px_rgba(15,23,42,0.85)]
              p-5 md:p-6

              /* ✅ dark: 페이지보다 밝은 surface + 링 + 강한 그림자 */
              dark:bg-[#0b1220]
              dark:border-white/12
              dark:ring-1 dark:ring-white/12
              dark:shadow-[0_40px_140px_-80px_rgba(0,0,0,0.95)]
            "
          >
            {/* ✅ subtle highlight: 다크에서 “카드 표면” 느낌 */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl dark:bg-white/[0.03]" />
            <div
              className="
                pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl
                bg-blue-500/0
                dark:bg-[rgb(var(--hero-b))]/18
              "
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white">
                    출력 언어를 선택해 주세요
                  </h3>
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-white/70">
                    선택하신 언어로 구조맵을 생성해 드립니다.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="
                    rounded-2xl px-2.5 py-1.5 text-xs md:text-sm
                    border border-neutral-200 bg-white hover:bg-neutral-50
                    dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10
                  "
                >
                  닫기
                </button>
              </div>

              <div className="mt-4">
                <div className="relative">
                  <Icon
                    icon="mdi:magnify"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-white/40"
                  />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="언어를 검색해 주세요 (예: English, 한국어, ja, zh...)"
                    className="
                      w-full rounded-2xl border border-neutral-200 bg-white
                      pl-9 pr-3 py-2 text-sm text-neutral-900
                      placeholder:text-neutral-400
                      focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300/60

                      /* ✅ dark: 입력도 표면이 살짝 밝게 */
                      dark:border-white/12
                      dark:bg-white/[0.06]
                      dark:text-white
                      dark:placeholder:text-white/40
                      dark:focus:ring-[rgb(var(--hero-b))]/30
                    "
                    autoFocus
                  />
                </div>

                <div
                  className="
                    mt-3 max-h-[360px] overflow-auto rounded-2xl border border-neutral-200
                    bg-neutral-50 p-2
                    dark:border-white/12
                    dark:bg-white/[0.04]
                    dark:ring-1 dark:ring-white/10
                  "
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filtered.map((opt) => {
                      const active = opt.code === value;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => handlePick(opt.code)}
                          className={`
                            flex items-center justify-between gap-2
                            rounded-2xl px-3 py-2 text-sm
                            border transition
                            ${
                              active
                                ? "border-blue-300 bg-white shadow-sm dark:border-[rgb(var(--hero-b))]/60 dark:bg-white/[0.08] dark:shadow-[0_14px_50px_-30px_rgba(0,0,0,0.9)]"
                                : "border-neutral-200 bg-white hover:bg-neutral-100 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                            }
                          `}
                        >
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {opt.label}
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-white/55">
                            {opt.code}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {filtered.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-neutral-600 dark:text-white/70">
                      검색 결과가 없습니다. 다른 키워드로 시도해 주세요.
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-neutral-500 dark:text-white/60">
                  현재 선택:{" "}
                  <b className="text-neutral-900 dark:text-white">{currentLabel}</b>{" "}
                  <span className="mx-1 text-neutral-300 dark:text-white/20">·</span>
                  코드: <b className="text-neutral-900 dark:text-white">{value}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
