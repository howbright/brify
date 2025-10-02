import ClientMindElixir from "./ClientMindElixir";

export const metadata = {
  title: "Mind-Elixir Demo | demo-elixir",
};

export default function Page() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Mind-Elixir Demo (damo-elixir)</h1>
      <ClientMindElixir key={"1"} mode="light" />
      <p className="text-sm text-slate-600">
        - 더 필요하면 여기서 버튼/툴바/메뉴 플러그인 추가 가능. 노드
        더블클릭/F2로 인라인 편집, Enter/Shift+Enter/Tab로 형제/자식 추가 등
        기본 편집 동작 지원.
      </p>
      <ClientMindElixir key={"2"} mode="dark" zoomSensitivity={0.3} dragButton={2}  fitOnInit />
    </div>
  );
}
