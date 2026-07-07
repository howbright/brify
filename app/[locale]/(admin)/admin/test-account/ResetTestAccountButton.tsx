"use client";

import { useState } from "react";

const TEST_ACCOUNT_EMAIL = "howbright22@gmail.com";

export default function ResetTestAccountButton() {
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (isResetting) return;
    const ok = window.confirm(
      `${TEST_ACCOUNT_EMAIL} 테스트 계정을 삭제합니다. 메일 회원가입 테스트를 다시 할 수 있게 auth user, profile, 구조맵, 알림, 크레딧 기록을 정리합니다. 계속할까요?`
    );
    if (!ok) return;

    setIsResetting(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/test-account/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.detail || json?.error || "reset_failed");
      }

      setResult(
        json.deletedCount > 0
          ? `초기화 완료: ${json.deletedCount}개 user id 삭제`
          : "초기화 완료: 삭제할 테스트 계정이 없었습니다."
      );
    } catch (resetError) {
      console.error("[ResetTestAccountButton] failed", resetError);
      setError("테스트 계정 초기화에 실패했습니다. 서버 로그를 확인해 주세요.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
      <div className="text-sm font-black text-rose-700">FIXED TEST ACCOUNT</div>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-rose-950">
        {TEST_ACCOUNT_EMAIL}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-900/75">
        메일 회원가입 테스트를 다시 하기 위해 이 테스트 계정의 auth user, profile,
        생성 데이터, 알림, 크레딧 기록을 삭제합니다. 버튼은 이 이메일에만 동작합니다.
      </p>

      <button
        type="button"
        onClick={() => void handleReset()}
        disabled={isResetting}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-rose-600 px-5 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isResetting ? "초기화 중..." : "테스트계정 초기화"}
      </button>

      {result ? <p className="mt-4 text-sm font-bold text-emerald-700">{result}</p> : null}
      {error ? <p className="mt-4 text-sm font-bold text-rose-700">{error}</p> : null}
    </div>
  );
}
