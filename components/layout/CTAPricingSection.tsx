"use client";

import { useRouter } from "next/navigation";
import GradientButton from "@/components/ui/GradientButton";
import { Icon } from "@iconify/react";

export default function CTAPricingSection() {
  const router = useRouter();

  return (
    <section className="bg-gradient-to-b from-[#e9f0ff] via-[#f1f5ff] to-[#ffffff] dark:from-[#1a1a2a] dark:via-[#151525] dark:to-[#111] py-24 px-4 border-t border-border shadow-inner">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-text dark:text-white mb-4 leading-snug tracking-tight">
          지금 <span className="text-primary">바로 시작</span>해보세요
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mb-12">
          Brify의 요약 기능을 무료로 체험하거나,<br className="hidden sm:inline" /> 더 강력한 기능이 필요한 경우 Pro 플랜을 선택해보세요.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <GradientButton
            label={
              <span className="inline-flex items-center gap-1">
                요금제 보기 <Icon icon="mdi:arrow-right" width={18} />
              </span>
            }
            onClick={() => router.push("/pricing")}
          />
          <button
            onClick={() => router.push("/summarize")}
            className="px-6 py-2 rounded-lg border border-primary text-primary font-medium hover:bg-primary/10 hover:shadow-md transition-all"
          >
            지금 무료로 시작하기
          </button>
        </div>
      </div>
    </section>
  );
}