"use client";

import LanguageSelector from "@/components/LanguageSelector";
import { useSession } from "@/components/SessionProvider";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger
} from "@/components/ui/menubar";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import "flowbite";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();
  const { session, isLoading } = useSession();
  return (
    <header>
      <nav
        id="mainNavbar"
        data-sticky="false"
        className="bg-white dark:bg-transparent bg-whit py-2.5 fixed w-full z-40 top-0 start-0 data-[sticky=true]:bg-white data-[sticky=true]:border-b dark:data-[sticky=true]:bg-gray-800 dark:data-[sticky=true]:border-gray-700 border-b border-gray-300"
      >
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Brify Logo"
              className="h-8"
              width={100}
              height={100}
            />
          </Link>
          <div className="flex items-center lg:order-2">
            <LanguageSelector />
           
            {!session && (
              <>
                {/* 로그인 버튼 */}
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-white hover:text-primary border border-gray-300 dark:border-gray-600 hover:border-primary font-medium rounded-lg text-sm px-4 py-2 mr-2"
                >
                  로그인
                </Link>

                {/* 회원가입 버튼 */}
                <Link
                  href="/signup"
                  className="text-white bg-primary hover:bg-primary-dark focus:ring-primary font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary dark:hover:bg-primary-dark focus:outline-none dark:focus:ring-primary"
                >
                  회원가입
                </Link>
              </>
            )}

            {session && (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh(); // 페이지 리렌더
                }}
                className="text-gray-700 dark:text-white hover:text-red-500 border border-gray-300 dark:border-gray-600 hover:border-red-500 font-medium rounded-lg text-sm px-4 py-2 mr-2"
              >
                로그아웃
              </button>
            )}
            <Menubar className="lg:hidden ml-2">
              <MenubarMenu>
                <MenubarTrigger className="p-0">
                  <Icon icon="ic:baseline-menu" width={32} height={32} />
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem  onClick={() => router.push('/')}>홈</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={() => router.push('/summarize')}>핵심정리하기</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={() => router.push('/')}>나의 핵심정리</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={() => router.push('/')}>태그</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
          <div className="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1 bg-white dark:bg-gray-800 lg:bg-transparent lg:dark:bg-transparent mt-2 lg:mt-0">
            <ul className="flex flex-col rounded-lg font-medium lg:flex-row lg:space-x-8">
              <li>
                <Link
                  href="/"
                  className="block py-2 pr-4 pl-3 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                  aria-current="page"
                >
                  홈
                </Link>
              </li>
              <li>
                <Link
                  href="/summarize"
                  className="block py-2 pr-4 pl-3 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  핵심정리하기
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="block py-2 pr-4 pl-3 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  나의핵심정리
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="block py-2 pr-4 pl-3 text-gray-900 border-b border-gray-100 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary lg:p-0 dark:text-white lg:dark:hover:text-primary dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  태그
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
