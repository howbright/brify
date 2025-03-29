"use client";

// app/page.tsx


import dynamic from "next/dynamic";

const DiagramEditor = dynamic(() => import("../../../components/DiagramEditor"), {
  ssr: false, // React Flow는 브라우저 전용이라 SSR 비활성화 필요
});

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#fdfaf6]">
      <h1 className="text-2xl font-bold mb-6">🧠 다이어그램 에디터</h1>
      <DiagramEditor />
    </main>
  );
}
