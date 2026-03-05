"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import {
  DEFAULT_THEME_NAME,
  MIND_THEME_PRESETS,
} from "@/components/maps/themes";

type Props = {
  open: boolean;
  themeName: string;
  onClose: () => void;
  onSelectTheme: (name: string) => void;
};

export default function MindThemePreferenceModal({
  open,
  themeName,
  onClose,
  onSelectTheme,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [defaultTheme, setDefaultTheme] = useState<any | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("mind-elixir");
        const MindElixir = mod.default;
        if (!cancelled) {
          setDefaultTheme(MindElixir?.THEME ?? null);
        }
      } catch {
        if (!cancelled) setDefaultTheme(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-[92vw] max-w-[760px] rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0b1220] max-h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white/90">
                기본 맵 테마
              </h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-white/60">
                모든 맵에 기본으로 적용되는 테마를 선택하세요.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85 dark:hover:bg-white/10"
            >
              <Icon icon="mdi:close" className="h-4 w-4" />
              닫기
            </button>
          </div>

          <div className="mt-4 min-h-0 flex-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 overflow-y-auto px-2 py-2">
            {MIND_THEME_PRESETS.map((preset) => {
              const theme =
                preset.name === DEFAULT_THEME_NAME
                  ? defaultTheme ?? preset.theme
                  : preset.theme;
              const css = theme?.cssVar;
              const bg = css?.["--bgcolor"] ?? "#ffffff";
              const nodeBg = css?.["--main-bgcolor"] ?? "#f8fafc";
              const nodeBorder =
                theme?.palette?.[0] ?? css?.["--main-color"] ?? "#111827";
              const text = css?.["--color"] ?? "#111827";
              const rootBg = css?.["--root-bgcolor"] ?? "#111827";
              const rootColor = css?.["--root-color"] ?? "#ffffff";

              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onSelectTheme(preset.name)}
                  className={`
                    rounded-2xl border p-3 text-left transition-all outline-offset-1
                    ${
                      preset.name === themeName
                        ? "border-blue-400 outline outline-2 outline-blue-300/70 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.6)]"
                        : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
                    }
                    dark:border-white/10
                  `}
                >
                  <div
                    className="h-20 rounded-xl border border-neutral-200/60 p-2"
                    style={{ backgroundColor: bg }}
                  >
                    <div
                      className="h-5 w-20 rounded-md text-[10px] font-semibold flex items-center justify-center"
                      style={{
                        backgroundColor: rootBg,
                        color: rootColor,
                      }}
                    >
                      Root
                    </div>
                    <div className="mt-2 flex gap-2">
                      <div
                        className="h-4 w-14 rounded-md border text-[9px] flex items-center justify-center"
                        style={{
                          backgroundColor: nodeBg,
                          borderColor: nodeBorder,
                          color: text,
                        }}
                      >
                        Node
                      </div>
                      <div
                        className="h-4 w-10 rounded-md border text-[9px] flex items-center justify-center"
                        style={{
                          backgroundColor: nodeBg,
                          borderColor: nodeBorder,
                          color: text,
                        }}
                      >
                        Node
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white/90">
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-white/60">
                        {preset.description}
                      </div>
                    </div>
                    {preset.name === themeName && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                        <Icon
                          icon="mdi:check-circle"
                          className="h-3.5 w-3.5"
                        />
                        선택됨
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
