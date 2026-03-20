"use client";

import LanguageSelector from "@/components/LanguageSelector";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export default function SimpleHeader() {
  return (
    <header>
      <nav
        id="simpleNavbar"
        data-sticky="false"
        className="dark:bg-transparent bg-white border-gray-200 py-2.5 fixed w-full z-40 top-0 start-0 data-[sticky=true]:bg-white data-[sticky=true]:border-b dark:data-[sticky=true]:bg-gray-800 dark:data-[sticky=true]:border-gray-700"
      >
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-(--breakpoint-xl) px-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/newlogo.png"
              alt="Brify Logo"
              className="h-8 w-8"
              width={512}
              height={512}
            />
            <span className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Brify
            </span>
          </Link>
          <div className="flex items-center lg:order-2">
            <LanguageSelector />
          </div>
        </div>
      </nav>
    </header>
  );
}
