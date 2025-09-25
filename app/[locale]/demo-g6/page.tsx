// app/(demo)/g6-gallery/page.tsx
import type { OriginalDiagramNode } from "@/app/types/diagram";
import DiagramViewG6 from "@/components/diagram/DiagramViewG6";

const nodes2: OriginalDiagramNode[] = [
  {
    id: "root",
    title: "프로젝트!",
    description: "",
    nodeType: "title",
    children: ["a", "b", "c"],
  },
  {
    id: "a",
    title: "1. 역사",
    description: "",
    nodeType: "title",
    children: [],
  },
  {
    id: "b",
    title: "2. 멤버",
    description: "",
    nodeType: "title",
    children: [],
  },
  {
    id: "c",
    title: "3. 원리",
    description: "",
    nodeType: "title",
    children: [],
  },
];
const nodes: OriginalDiagramNode[] = [
  {
    id: "1",
    title: "올리브 오일의 건강 효능과 활용법",
    children: ["1-1", "2", "3"],
    nodeType: "title",
    description: "",
  },
  {
    id: "1-1",
    title: "서론: 최근의 요리 프로그램 변화",
    children: ["1-1-1"],
    nodeType: "title",
    description: "",
  },
  {
    id: "1-1-1",
    title: "",
    children: [],
    nodeType: "description",
    description:
      "넷플릭스의 흑백 요리사가 인기를 끌면서 다양한 셰프들의 요리 프로그램이 주목받고 있으며, 배우 하주원의 동안 비결 중 하나가 올리브 오일을 즐겨 먹는 것임이 알려졌습니다.",
  },
  {
    id: "2",
    title: "올리브 오일의 효능",
    children: ["2-1", "2-2", "2-3", "2-4"],
    nodeType: "title",
    description: "",
  },
  {
    id: "2-1",
    title: "심혈관 건강",
    children: ["2-1-1"],
    nodeType: "title",
    description: "",
  },
  {
    id: "2-1-1",
    title: "",
    children: [],
    nodeType: "description",
    description:
      "올리브유 하루 1.5스푼이 심혈관 질환 위험을 줄이는 데 도움을 줄 수 있으며, 이는 오메가 9 지방산과 폴리페놀 덕분입니다.",
  },
  {
    id: "2-2",
    title: "체중과 체지방 감량",
    children: ["2-2-1"],
    nodeType: "title",
    description: "",
  },
  {
    id: "2-2-1",
    title: "",
    children: [],
    nodeType: "description",
    description:
      "올리브 오일 반 숟가락을 섭취하면 체중과 체지방 감량에 도움이 되며, 포만감을 높여 식욕을 억제하는 효과도 있습니다.",
  },
  {
    id: "2-3",
    title: "혈당 조절",
    children: ["2-3-1"],
    nodeType: "title",
    description: "",
  },
  {
    id: "2-3-1",
    title: "",
    children: [],
    nodeType: "description",
    description:
      "올리브 오일을 섭취한 그룹은 식후 혈당이 낮아지는 결과를 보였으며, 이는 인슐린 분비가 원활하게 이루어져 혈당 조절에 기여합니다.",
  },
  {
    id: "2-4",
    title: "인지 건강과 치매 예방",
    children: ["2-4-1"],
    nodeType: "title",
    description: "",
  },
  {
    id: "2-4-1",
    title: "",
    children: [],
    nodeType: "description",
    description:
      "올리브 오일의 오메가 9는 신경 퇴행성 질환 진행을 완화하고, 치매로 인한 사망 위험을 28% 감소시킵니다.",
  },
  {
    id: "3",
    title: "올리브 오일의 섭취 방법",
    children: ["3-1"],
    nodeType: "title",
    description: "",
  },
  {
    id: "3-1",
    title: "",
    children: [],
    nodeType: "description",
    description:
      "엑스트라 버진 올리브 오일을 샐러드나 밥에 뿌려 먹거나 요리에 활용할 수 있으며, 포화지방 대신 꾸준히 섭취하는 것을 추천합니다.",
  },
];

// ============================================
// app/(demo)/g6-gallery/page.tsx
// 페이지: 실데이터(nodes)를 그대로 넘겨도 내부에서 트리로 변환되어 렌더됩니다.
// ============================================

// // 실데이터 (DB에서 가져오는 형식과 동일)
// const nodes: OriginalDiagramNode[] = [
//   { id: "1", title: "올리브 오일의 건강 효능과 활용법", children: ["1-1", "2", "3"], nodeType: "title", description: "" },
//   { id: "1-1", title: "서론: 최근의 요리 프로그램 변화", children: ["1-1-1"], nodeType: "title", description: "" },
//   { id: "1-1-1", title: "", children: [], nodeType: "description", description: "넷플릭스의 흑백 요리사가 인기를 끌면서 다양한 셰프들의 요리 프로그램이 주목받고 있으며, 배우 하주원의 동안 비결 중 하나가 올리브 오일을 즐겨 먹는 것임이 알려졌습니다." },
//   { id: "2", title: "올리브 오일의 효능", children: ["2-1", "2-2", "2-3", "2-4"], nodeType: "title", description: "" },
//   { id: "2-1", title: "심혈관 건강", children: ["2-1-1"], nodeType: "title", description: "" },
//   { id: "2-1-1", title: "", children: [], nodeType: "description", description: "올리브유 하루 1.5스푼이 심혈관 질환 위험을 줄이는 데 도움을 줄 수 있으며, 이는 오메가 9 지방산과 폴리페놀 덕분입니다." },
//   { id: "2-2", title: "체중과 체지방 감량", children: ["2-2-1"], nodeType: "title", description: "" },
//   { id: "2-2-1", title: "", children: [], nodeType: "description", description: "올리브 오일 반 숟가락을 섭취하면 체중과 체지방 감량에 도움이 되며, 포만감을 높여 식욕을 억제하는 효과도 있습니다." },
//   { id: "2-3", title: "혈당 조절", children: ["2-3-1"], nodeType: "title", description: "" },
//   { id: "2-3-1", title: "", children: [], nodeType: "description", description: "올리브 오일을 섭취한 그룹은 식후 혈당이 낮아지는 결과를 보였으며, 이는 인슐린 분비가 원활하게 이루어져 혈당 조절에 기여합니다." },
//   { id: "2-4", title: "인지 건강과 치매 예방", children: ["2-4-1"], nodeType: "title", description: "" },
//   { id: "2-4-1", title: "", children: [], nodeType: "description", description: "올리브 오일의 오메가 9는 신경 퇴행성 질환 진행을 완화하고, 치매로 인한 사망 위험을 28% 감소시킵니다." },
//   { id: "3", title: "올리브 오일의 섭취 방법", children: ["3-1"], nodeType: "title", description: "" },
//   { id: "3-1", title: "", children: [], nodeType: "description", description: "엑스트라 버진 올리브 오일을 샐러드나 밥에 뿌려 먹거나 요리에 활용할 수 있으며, 포화지방 대신 꾸준히 섭취하는 것을 추천합니다." },
// ];

const data = { nodes };

export default function Page() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        G6 Layout Gallery
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card key="1" title="Mindmap — H (좌우)">
          <DiagramViewG6
            data={data}
            layoutType="mindmap"
            direction="H"
            height={360}
          />
        </Card>
        <Card key="2" title="Mindmap — V (상하)">
          <DiagramViewG6 data={data} layoutType="mindmap" height={360} />
        </Card>
        <Card key="3" title="Tree — LR (좌→우)">
          <DiagramViewG6
            data={data}
            layoutType="tree"
            direction="LR"
            height={360}
          />
        </Card>
        <Card key="4" title="Tree — TB (위→아래)">
          <DiagramViewG6
            data={data}
            layoutType="tree"
            direction="TB"
            height={360}
          />
        </Card>
        <Card key="5" title="Tree — RL (우→좌)">
          <DiagramViewG6
            data={data}
            layoutType="tree"
            direction="RL"
            height={360}
          />
        </Card>
        <Card key="6" title="Radial (라디얼)">
          <DiagramViewG6 data={data} layoutType="radial" height={360} />
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-2 border-b bg-slate-50 text-sm font-medium text-slate-700">
        {title}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}
