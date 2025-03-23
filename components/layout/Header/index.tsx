import { Link } from "@/i18n/navigation";

export default function Header() {
  return (
    <header className="bg-[#fefefe] text-[#1f1f1f] dark:bg-[#111827] dark:text-white shadow-sm">
      <nav className="max-w-screen-xl mx-auto px-4 lg:px-6 py-4 flex justify-between items-center">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.svg" className="h-8" alt="Brify Logo" />
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden lg:flex items-center space-x-8 font-medium text-sm">
          <Link href="/" className="hover:text-[#3b82f6] transition">
            홈
          </Link>
          <Link href="/summarize" className="hover:text-[#3b82f6] transition">
            요약하기
          </Link>
          <Link href="#" className="hover:text-[#3b82f6] transition">
            모아보기
          </Link>
          <Link href="#" className="hover:text-[#3b82f6] transition">
            태그
          </Link>
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="text-[#1f1f1f] dark:text-white border border-[#1f1f1f] dark:border-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-semibold rounded-md text-primary bg-white
             border border-primary transition-all duration-300
             hover:border-transparent hover:[border-width:1px]
             hover:[border-image:linear-gradient(to_right,_#3b82f6,_#6366f1,_#0ea5e9)_1]"
          >
            회원가입
          </Link>
        </div>

        {/* 모바일 메뉴 토글 (선택적으로 구현 가능) */}
      </nav>
    </header>
  );
}
