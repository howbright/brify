"use client";

import SignupForm from "@/components/SignupForm";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export default function Signup() {
  return (
    <section className="relative pt-2 bg-[#f4f7f8] text-[#1f1f1f] dark:bg-[#111827] dark:text-white py-28 px-4 overflow-visible">
      {/* 🎨 배경 SVGs */}
      <Image
        src="/images/hero1.svg"
        alt=""
        className="absolute top-[30px] left-[-20px] w-28 md:w-36 opacity-40 animate-floating pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero2.svg"
        alt=""
        className="absolute bottom-[30px] right-[-20px] w-32 md:w-40 opacity-40 animate-floating-reverse pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero3.svg"
        alt=""
        className="absolute top-[50px] right-8 w-24 md:w-32 opacity-30 rotate-12 pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <Image
        src="/images/hero5.svg"
        alt=""
        className="absolute bottom-[20px] left-6 w-20 md:w-28 opacity-30 pointer-events-none"
        aria-hidden="true"
        width={100}
        height={100}
      />
      <div className="max-w-screen-xl px-4 py-8 mx-auto sm:py-16 lg:py-24 pt-20 sm:pt-24 lg:pt-32">
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
                width={300}
                height={300}
              />
            </Link>

            <div className="space-y-8">
              {[
                {
                  title: "Get started quickly",
                  description:
                    "Integrate with developer-friendly APIs or choose pre-built solutions.",
                },
                {
                  title: "Support any business model",
                  description:
                    "Host code that you don’t want to share with the world in private.",
                },
                {
                  title: "Join millions of businesses",
                  description:
                    "Flowbite is trusted by ambitious startups and enterprises of every size.",
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
          <SignupForm />
        </div>
      </div>
    </section>
  );
}
