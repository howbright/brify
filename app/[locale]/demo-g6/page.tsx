"use client";

// app/(demo)/g6-gallery/page.tsx
import type { OriginalDiagramNode } from "@/app/types/diagram";
import { Graph } from "@/components/diagram/G6";
import { calcWrapped } from "@/utils/g6/calcuator";
import type { GraphOptions } from "@antv/g6"; // ✅ 타입 전용
import { useMemo } from "react";

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
  const data = {
    nodes: Array.from({ length: 10 }).map((_, i) => ({
      id: `node-${i}`,
      data: { category: i === 0 ? "central" : "around" },
    })),
    edges: Array.from({ length: 9 }).map((_, i) => ({
      source: `node-0`,
      target: `node-${i + 1}`,
    })),
  };
  const LINE_HEIGHT = 16;
  // 공통 베이스 옵션 (여기서 바꾸면 모든 프리셋에 반영)
  const baseOptions = useMemo<GraphOptions>(
    () => ({
      // width: 1200,
      // height: 700,
      data,
      behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
      // 캔버스 배경을 직접 어둡게 (다크 테마 체감 확실)
      background: "#141414",
      // node: {
      //   // 팔레트는 라이트/다크 상관없이 적용되니, 다크 확인용이면 잠깐 빼도 됨
      //   palette: {
      //     field: "category",
      //     color: "tableau",
      //   },
      //   // 다크 톤에서 잘 보이도록 기본 스타일도 추가 가능
      //   style: {
      //     stroke: "#888",
      //     lineWidth: 1,
      //   },
      // },
      node: {
        type: "rect",
        style: {
          // ✅ v5 안정: size로 지정
          size: (d: any) => {
            const { width, height } = calcWrapped(d);
            // 혹시 계산값이 0/NaN 나오면 기본값으로 안전장치
            const w = Number.isFinite(width) && width > 0 ? width : 160;
            const h2 = Number.isFinite(height) && height > 0 ? height : 48;
            return [w, h2];
          },

          radius: 8,
          stroke: "#CBD5E1",
          lineWidth: 1,
          // fill: (d: any) =>
          //   d?.data?.nodeType === "description" ? "#ffffff" : "#F8FAFC",

          clipContent: true,

          // ✅ 라벨: 우리가 \n으로 줄바꿈, wordWrap/ellipsis 끔
          labelText: (d: any) => {
            const { label } = calcWrapped(d);
            return label;
          },
          labelPlacement: "center",
          labelFontSize: 12,
          labelFill: "#0F172A",
          labelLineHeight: LINE_HEIGHT,
          labelWordWrap: false, // 자동 줄바꿈 OFF
          labelMaxWidth: undefined, // ellipsis 유발 방지
          labelTextAlign: "center",
          labelTextBaseline: "middle",
          palette: {
            field: "category",
            color: "tableau",
          },
          // 다크 톤에서 잘 보이도록 기본 스타일도 추가 가능
          style: {
            stroke: "#888",
            lineWidth: 1,
          },
        },
      },
      edge: {
        style: {
          stroke: "lightgreen",
          lineWidth: 1,
          opacity: 0.9,
        },
      },
    }),
    [data]
  );

  // 프리셋 목록: 레이아웃/옵션만 변경해 다양한 테스트
  const optionPresets = useMemo(
    (): { title: string; options: GraphOptions, theme: "dark" | "light" }[] => [
      {
        theme: "light",
        title: "Force (d3-force)",
        options: {
          ...baseOptions,
          layout: {
            type: "d3-force",
            preventOverlap: true,
            linkDistance: 80,
            nodeStrength: 10,
            collideStrength: 0.8,
          },
        },
      },
      {
        theme: "dark",
        title: "Radial",
        options: {
          ...baseOptions,
          layout: {
            type: "radial",
            unitRadius: 80,
            preventOverlap: true,
            strictRadial: false,
            // 중심 노드 지정 (category=central을 중심으로)
            // data에 따라 자동 중심 감지 안되면 아래처럼 지정 가능
            // focusNode: "node-0",
          },
        },
      },
      {
        theme: "dark",
        title: "Grid",
        options: {
          ...baseOptions,
          layout: {
            type: "grid",
            rows: 3,
            cols: 4,
            preventOverlap: true,
          },
        },
      },
      {
        theme: "light",
        title: "Circular",
        options: {
          ...baseOptions,
          layout: {
            type: "circular",
            radius: 120,
            divisions: 1,
            ordering: "degree", // degree | topology 등
          },
        },
      },
      {
        theme: "dark",
        title: "Concentric",
        options: {
          ...baseOptions,
          layout: {
            type: "concentric",
            maxLevelDiff: 2,
            sortBy: "degree",
            preventOverlap: true,
          },
        },
      },
      {
        theme: "light",
        title: "No Layout (static)",
        options: {
          ...baseOptions,
          // 레이아웃을 주지 않으면 좌표가 유지됨.
          // 여기서는 예시로 일부 노드에 좌표를 직접 지정해봄.
          data: {
            nodes: baseOptions.data!.nodes!.map((n, i) =>
              i === 0
                ? { ...n, x: 320, y: 180 }
                : {
                    ...n,
                    x: 320 + 120 * Math.cos((i / 9) * Math.PI * 2),
                    y: 180 + 120 * Math.sin((i / 9) * Math.PI * 2),
                  }
            ),
            edges: baseOptions.data!.edges!,
          },
        },
      },
    ],
    [baseOptions]
  );

  // 2) onRender / onDestroy(선택)
  const handleRender = (g: any) => {
    g.fitCenter?.();
    console.log("theme tokens:", g.getTheme()); // 다크 토큰이면 적용됨
    // 필요시 이벤트 바인딩 등
    // g.on('node:click', () => { ... });
  };

  const handleDestroy = () => {
    // 언마운트 시 정리해야 할 것들 여기서
    // 예: 이벤트 해제, 타이머 클리어, 외부 상태 리셋 등
    console.log("[G6] graph destroyed");
  };
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        G6 Layout Gallery
      </h1>

      <div className="w-full flex flex-col gap-6">
          {optionPresets.map(({ title, options, theme}, idx) => (
            <Card key={idx} title={title}>
              {/* Graph 컴포넌트가 theme prop을 받는 버전이라면 아래처럼 넘겨줘 */}
              <Graph
                options={options}
                theme={theme}
                onRender={handleRender}
                onDestroy={handleDestroy}
              />
            </Card>
          ))}
        {/* <Card key="1" title="Mindmap — H (좌우)">
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
        </Card> */}
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
