"use client";

import { useRouter } from "next/navigation";
import GradientButton from "@/components/ui/GradientButton";
import { Icon } from "@iconify/react";

export default function CTAPricingSection() {
  const router = useRouter();

  return (
    <section className="relative z-10 bg-[#21293b] text-white py-28 px-4 overflow-hidden">
      {/* 배경 패턴 또는 강조 요소 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#4e77ff]/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#3b5bdb]/20 rounded-full blur-2xl animate-pulse-slow delay-500" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight text-white">
          지금 <span className="text-primary-200">바로 시작</span>해보세요
        </h2>
        <p className="text-lg md:text-xl text-white/80 mb-12">
          Brify의 요약 기능을 무료로 체험하거나,
          <br className="hidden sm:inline" />더 강력한 기능이 필요하다면 Pro
          플랜을 선택해보세요.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => router.push("/pricing")}
            className="px-6 py-2 rounded-lg bg-white text-[#21293b] font-semibold hover:bg-white/90 transition-all shadow-md"
          >
            <span className="inline-flex items-center gap-1">
              요금제 보기 <Icon icon="mdi:arrow-right" width={18} />
            </span>
          </button>
          <button
            onClick={() => router.push("/summarize")}
            className="px-6 py-2 rounded-lg border border-white/30 text-white font-medium hover:bg-white/10 hover:shadow-md transition-all"
          >
            지금 무료로 시작하기
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.45;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 12s ease-in-out infinite;
        }
        .delay-500 {
          animation-delay: 5s;
        }
      `}</style>
    </section>
  );
}
