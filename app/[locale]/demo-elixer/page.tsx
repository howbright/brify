"use client";

import dynamic from "next/dynamic";

const ClientMindElixir = dynamic(() => import("@/components/ClientMindElixir"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[1300px] animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
      <span className="text-slate-500 dark:text-slate-400">마인드맵 로딩 중…</span>
    </div>
  ),
});


// export const metadata = {
//   title: "Mind-Elixir Demo | demo-elixir",
// };

export default function Page() {
  return (
    <div className="p-6 space-y-4 h-[100vh]">
      <h1 className="text-2xl font-semibold">Mind-Elixir Demo (damo-elixir)</h1>
      <ClientMindElixir  mode="light" />
      {/* <p className="text-sm text-slate-600">
        - 더 필요하면 여기서 버튼/툴바/메뉴 플러그인 추가 가능. 노드
        더블클릭/F2로 인라인 편집, Enter/Shift+Enter/Tab로 형제/자식 추가 등
        기본 편집 동작 지원.
      </p>
      <ClientMindElixir key={"2"} mode="dark" zoomSensitivity={0.3} fitOnInit /> */}
    </div>
  );
}
