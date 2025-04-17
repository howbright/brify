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
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Brify Logo"
              className="h-8"
              width={100}
              height={100}
            />
          </Link>
          <div className="flex items-center lg:order-2">
            <LanguageSelector />
          </div>
        </div>
      </nav>
    </header>
  );
}
