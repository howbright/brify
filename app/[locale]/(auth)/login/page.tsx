"use client";

import LoginForm from "@/components/LoginForm";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export default function Login() {
  // const t = useTranslations('login');

  return (
    <div className="max-w-(--breakpoint-xl) px-4 py-8 mx-auto sm:py-16 lg:py-24 pt-20 sm:pt-24 lg:pt-32">
      <div className="lg:grid lg:gap-20 lg:items-center lg:grid-cols-12">
        <div className="hidden col-span-6 mr-auto lg:block">
          <Link
            href="/"
            className="inline-flex items-center mb-10 text-3xl font-black uppercase tracking-tight"
          >
            <Image
              src="/images/logo.png"
              className="mr-3 h-12"
              alt="Brify Logo"
              width={100}
              height={50}
            />
          </Link>

          <div className="space-y-8">
            {[
              {
                title: "복잡한 글을 한눈에",
                description:
                  "긴 문서나 유튜브 영상도 클릭 한 번으로 핵심 요약을 만들어보세요.",
              },
              {
                title: "생각을 시각화하세요",
                description:
                  "자동으로 생성된 다이어그램으로 내용을 더 쉽게 이해하고 정리할 수 있어요.",
              },
              {
                title: "가치를 모아 나만의 경쟁력으로",
                description:
                  "스크랩북에 요약을 저장하고, 유용한 정보를 쌓아가며 나만의 지식 자산을 만들어보세요.",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start">
                <div className="w-5 h-5 mr-3 mt-1 border border-primary rounded-full bg-primary" />
                <div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
