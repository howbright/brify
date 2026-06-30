import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [
          line.slice(0, index).trim(),
          line.slice(index + 1).trim().replace(/^['"]|['"]$/g, ""),
        ];
      })
  );
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const imageUrl =
  "https://ojtkmpiiquwgetwyoyqy.supabase.co/storage/v1/object/public/blog-images/en/1781139691915-2a845d34-3b57-448b-a7b8-6626b7c23d2b-4.001.jpeg";
const bodyImageUrl =
  "https://ojtkmpiiquwgetwyoyqy.supabase.co/storage/v1/object/public/blog-images/ko/1780975282822-6cc628f6-a35f-47be-b13e-9bdfa6de3045-2026-06-09-12.20.23.png";
const bodyImageMarkdown = `![blog image](${bodyImageUrl})`;

function insertDefaultBodyImage(markdown) {
  const cleanMarkdown = markdown.trim();
  if (cleanMarkdown.includes(bodyImageUrl)) return cleanMarkdown;
  const lines = cleanMarkdown.split(/\r?\n/);
  const headings = lines
    .map((line, index) => (/^##\s+/.test(line.trim()) ? index : -1))
    .filter((index) => index > 0);
  const midpoint = Math.floor(lines.length / 2);
  const insertIndex =
    headings.find((index) => index >= midpoint) ?? headings[Math.floor(headings.length / 2)] ?? lines.length;
  lines.splice(insertIndex, 0, "", bodyImageMarkdown, "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const commonKeywords = ["AI 마인드맵", "AI 구조맵", "텍스트 마인드맵", "문서 구조화", "AI 요약", "Brify"];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## 실제로 적용하는 순서",
    `${post.title}를 실제로 적용하려면 먼저 자료를 예쁜 그림으로 만들겠다는 생각보다, 무엇을 다시 찾아야 하는지 정하는 것이 중요합니다. 마인드맵은 중심 주제에서 가지를 뻗는 데 강하지만, 업무나 공부에서 필요한 것은 단순한 가지보다 주장, 근거, 예시, 조건의 관계일 때가 많습니다.`,
    "첫째, 자료가 답하려는 핵심 질문을 한 문장으로 적습니다. 둘째, 본문이나 자막, 문서, 메모에서 반복되는 주제와 중요한 결론을 찾습니다. 셋째, 결론을 뒷받침하는 근거와 예시를 따로 분리합니다. 넷째, 다시 확인해야 할 원문 위치나 불확실한 부분을 표시합니다.",
    "이 과정을 거치면 AI 마인드맵이 단순한 시각 자료가 아니라 다시 읽고, 검토하고, 발표하고, 복습할 수 있는 구조가 됩니다. 특히 긴 글, PDF, 유튜브 영상, 회의자료처럼 정보가 길게 흩어진 자료일수록 구조를 남기는 것이 중요합니다.",
    "## Brify에 넣을 때의 구조 예시",
    `Brify에서 ${post.seo_keywords[0]} 작업을 할 때는 큰 노드를 '핵심 질문', '주요 주제', '결론', '근거', '예시', '확인할 부분', '다음 행동'으로 나누어볼 수 있습니다.`,
    "이렇게 하면 마인드맵처럼 한눈에 보이면서도, 단순 아이디어 가지치기보다 더 실용적인 구조가 됩니다. 어떤 주장에 어떤 근거가 붙어 있는지, 어떤 예시가 중요한지, 무엇을 다시 확인해야 하는지 남길 수 있기 때문입니다.",
    "Brify가 AI 구조맵을 강조하는 이유도 여기에 있습니다. AI가 요약한 문장을 그대로 믿기보다, 요약이 어떤 구조로 만들어졌는지 확인하고 수정할 수 있어야 실제 공부와 업무에 쓸 수 있습니다.",
    "## 흔히 생기는 실수",
    "가장 흔한 실수는 AI 마인드맵을 예쁜 결과물로만 보는 것입니다. 색깔이나 배치가 보기 좋아도 핵심 질문, 근거, 조건이 빠져 있으면 나중에 다시 쓰기 어렵습니다.",
    "두 번째 실수는 요약과 구조화를 같은 일로 생각하는 것입니다. 요약은 내용을 줄이는 작업이고, 구조화는 줄인 내용을 다시 찾고 검토할 수 있게 배열하는 작업입니다.",
    "세 번째 실수는 AI가 만든 분류를 그대로 믿는 것입니다. AI는 빠르게 초안을 만들 수 있지만, 주제를 잘못 묶거나 중요한 근거를 생략하거나 결론을 과장할 수 있습니다. 원문과 함께 검토하는 과정이 필요합니다.",
    "## 오늘 바로 해볼 일",
    `오늘 ${post.seo_keywords[0]}를 시작한다면 긴 자료 하나를 고르고 먼저 세 가지만 적어보세요. 이 자료의 핵심 질문은 무엇인가, 가장 중요한 결론은 무엇인가, 그 결론을 뒷받침하는 근거는 어디에 있는가.`,
    "그 다음 Brify에서 핵심 질문을 중심에 두고 주제, 결론, 근거, 예시, 확인할 부분을 연결해보세요. 처음부터 완벽한 구조를 만들 필요는 없습니다. 중요한 것은 자료를 나중에 다시 이해할 수 있는 형태로 남기는 것입니다.",
    "작게 시작해도 충분합니다. 하나의 글, 하나의 PDF, 하나의 영상만 구조맵으로 바꿔도 단순 요약과 구조화의 차이를 바로 느낄 수 있습니다.",
    "## 마무리",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    slug: "what-is-ai-mindmap",
    title: "AI 마인드맵이란 무엇이고 어디에 쓸 수 있을까",
    excerpt: "AI 마인드맵이 무엇인지, 긴 글과 문서, 강의, 유튜브 영상, 논문 정리에 어떻게 활용할 수 있는지 설명합니다.",
    seo_keywords: ["AI 마인드맵", "AI 마인드맵 도구", "자동 마인드맵", "마인드맵 AI", ...commonKeywords],
    intro: "AI 마인드맵은 단순히 예쁜 가지 그림을 자동으로 그려주는 도구가 아닙니다. 긴 글, 문서, 강의, 영상처럼 복잡한 정보를 한눈에 이해할 수 있는 구조로 바꾸는 방법에 가깝습니다.",
    sections: [
      { heading: "AI 마인드맵이 필요한 이유", paragraphs: ["정보가 길어질수록 머릿속에서 흐름을 유지하기 어렵습니다.", "AI 마인드맵은 핵심 주제와 하위 내용을 빠르게 나누어 전체 구조를 보게 도와줍니다."] },
      { heading: "일반 마인드맵과 AI 마인드맵의 차이", paragraphs: ["일반 마인드맵은 사용자가 직접 가지를 만들고 정리해야 합니다.", "AI 마인드맵은 원문에서 반복되는 주제, 핵심 개념, 관계를 먼저 추출해 초안을 만들어줍니다."] },
      { heading: "어떤 자료를 마인드맵으로 바꿀 수 있을까", paragraphs: ["긴 글, PDF, 회의자료, 강의 노트, 유튜브 자막, 논문 요약 같은 자료를 구조화할 수 있습니다.", "중요한 것은 자료의 종류보다 그 안에 있는 주제와 관계를 분리하는 것입니다."] },
      { heading: "요약과 마인드맵의 차이", paragraphs: ["요약은 내용을 짧게 줄여줍니다.", "마인드맵은 내용이 어떤 관계로 연결되는지 보여주기 때문에 다시 찾고 설명하기가 쉽습니다."] },
      { heading: "Brify가 AI 구조맵을 강조하는 이유", paragraphs: ["Brify는 마인드맵의 시각성과 문서 구조화의 실용성을 함께 가져가려 합니다.", "그래서 단순 마인드맵보다 근거와 관계가 남는 AI 구조맵을 강조합니다."] },
    ],
    closing: "AI 마인드맵은 복잡한 정보를 이해 가능한 구조로 바꾸는 출발점입니다. Brify에서 긴 자료를 AI 구조맵으로 바꿔보세요.",
  },
  {
    slug: "ai-structure-map-vs-ai-mindmap",
    title: "AI 구조맵은 AI 마인드맵과 무엇이 다를까",
    excerpt: "AI 구조맵과 AI 마인드맵의 차이, 요약보다 구조가 중요한 이유, Brify가 구조맵을 사용하는 방식을 설명합니다.",
    seo_keywords: ["AI 구조맵", "구조맵", "AI 구조화", "마인드맵 구조화", ...commonKeywords],
    intro: "AI 마인드맵과 AI 구조맵은 비슷해 보이지만 목적이 조금 다릅니다. 마인드맵이 생각을 펼치는 데 강하다면, 구조맵은 자료의 논리와 근거를 다시 찾게 만드는 데 초점이 있습니다.",
    sections: [
      { heading: "마인드맵은 생각을 펼치는 도구다", paragraphs: ["마인드맵은 중심 주제에서 관련 아이디어를 확장하는 데 유용합니다.", "브레인스토밍이나 개념 탐색처럼 생각을 넓히는 작업에 잘 맞습니다."] },
      { heading: "구조맵은 자료의 관계를 남기는 도구다", paragraphs: ["구조맵은 이미 있는 자료를 이해 가능한 관계로 다시 배열합니다.", "주장, 근거, 예시, 조건이 어떻게 연결되는지 보여주는 것이 핵심입니다."] },
      { heading: "요약만으로 부족한 순간", paragraphs: ["요약은 빠르게 읽기 좋지만 근거의 위치나 논리 흐름이 흐려질 수 있습니다.", "보고서나 강의, 논문처럼 다시 확인할 일이 있는 자료는 구조가 필요합니다."] },
      { heading: "논리, 근거, 예시를 함께 남겨야 하는 이유", paragraphs: ["결론만 남기면 나중에 왜 그런 결론이 나왔는지 확인하기 어렵습니다.", "근거와 예시를 함께 남기면 자료를 더 안전하게 재사용할 수 있습니다."] },
      { heading: "Brify에서 AI 구조맵을 쓰는 방식", paragraphs: ["Brify는 긴 자료를 단순 요약으로 끝내지 않고 구조맵으로 보여줍니다.", "그래서 사용자는 내용을 빠르게 보면서도 필요한 근거를 다시 추적할 수 있습니다."] },
    ],
    closing: "AI 구조맵은 보기 좋은 마인드맵을 넘어 자료를 다시 쓸 수 있게 만드는 방식입니다. Brify에서 요약보다 깊은 구조화를 경험해보세요.",
  },
  {
    slug: "turn-text-into-mindmap",
    title: "텍스트를 마인드맵으로 바꾸는 방법",
    excerpt: "긴 텍스트를 마인드맵으로 바꿀 때 핵심 주제, 하위 개념, 근거, 예시, 행동 항목을 나누는 방법을 설명합니다.",
    seo_keywords: ["텍스트 마인드맵", "텍스트를 마인드맵으로", "글 마인드맵", "자동 마인드맵 생성", ...commonKeywords],
    intro: "이미 작성된 텍스트나 메모를 마인드맵으로 바꾸면 내용을 훨씬 빠르게 이해할 수 있습니다. 다만 핵심은 문장을 줄이는 것이 아니라 문장 속 관계를 드러내는 것입니다.",
    sections: [
      { heading: "텍스트를 마인드맵으로 바꾸고 싶은 이유", paragraphs: ["긴 텍스트는 처음부터 끝까지 읽어야 흐름이 보입니다.", "마인드맵으로 바꾸면 중심 주제와 하위 내용을 한눈에 볼 수 있습니다."] },
      { heading: "먼저 핵심 질문을 찾기", paragraphs: ["텍스트를 구조화하려면 먼저 이 글이 어떤 질문에 답하는지 찾아야 합니다.", "핵심 질문이 있어야 어떤 문단이 중요한지 판단할 수 있습니다."] },
      { heading: "문단을 주제별로 나누기", paragraphs: ["문단을 그대로 옮기면 마인드맵이 복잡해집니다.", "각 문단의 역할을 보고 주제, 근거, 예시, 결론으로 나누는 것이 좋습니다."] },
      { heading: "근거와 예시를 가지로 연결하기", paragraphs: ["좋은 구조는 중심 주장과 근거의 연결이 보입니다.", "예시는 별도 가지로 두되 어떤 주장을 설명하는지 연결해야 합니다."] },
      { heading: "Brify로 텍스트 구조맵 만들기", paragraphs: ["Brify에서는 텍스트를 넣고 핵심 주제와 관계를 구조맵으로 정리할 수 있습니다.", "복사해둔 메모를 다시 쓸 수 있는 자료로 바꾸는 데 유용합니다."] },
    ],
    closing: "텍스트 마인드맵은 긴 글을 다시 이해하기 위한 구조입니다. Brify로 텍스트 속 관계를 보이는 구조맵으로 바꿔보세요.",
  },
  {
    slug: "turn-writing-into-mindmap",
    title: "글을 마인드맵으로 바꾸면 무엇이 좋아질까",
    excerpt: "긴 글이나 초안을 마인드맵으로 바꾸면 주제 흐름, 논리 빈틈, 반복 문장, 보완할 근거를 확인하기 쉬운 이유를 설명합니다.",
    seo_keywords: ["글을 마인드맵으로", "글 구조화", "글 요약 마인드맵", "글 정리 도구", ...commonKeywords],
    intro: "글을 마인드맵으로 바꾸면 읽기 쉬워지는 것에서 끝나지 않습니다. 글의 흐름, 반복되는 부분, 빠진 근거, 논리의 빈틈까지 볼 수 있습니다.",
    sections: [
      { heading: "긴 글은 왜 한눈에 보기 어려운가", paragraphs: ["글은 줄 단위로 읽기 때문에 전체 구조를 한 번에 보기 어렵습니다.", "특히 초안은 문단이 길고 반복이 많아 핵심 흐름이 흐려질 수 있습니다."] },
      { heading: "글의 핵심 주장 찾기", paragraphs: ["마인드맵으로 바꾸기 전에 글이 말하려는 중심 주장을 찾아야 합니다.", "중심 주장이 모호하면 하위 문단도 정리하기 어렵습니다."] },
      { heading: "반복되는 문단과 빠진 근거 확인하기", paragraphs: ["구조로 펼쳐보면 같은 말을 반복하는 문단이 잘 보입니다.", "반대로 결론은 있는데 근거가 약한 부분도 드러납니다."] },
      { heading: "초안 수정 전에 구조를 보는 법", paragraphs: ["문장을 다듬기 전에 구조를 먼저 보면 수정 방향이 선명해집니다.", "어떤 문단을 합치고, 어떤 근거를 보강할지 판단하기 쉽습니다."] },
      { heading: "Brify로 글의 흐름 점검하기", paragraphs: ["Brify는 글을 중심 주장, 하위 주제, 근거, 예시로 나누어 볼 수 있게 합니다.", "초안 점검이나 발표 자료 준비 전에 유용합니다."] },
    ],
    closing: "글을 마인드맵으로 바꾸면 글의 약점이 보입니다. Brify에서 초안을 구조맵으로 펼쳐 흐름을 점검해보세요.",
  },
  {
    slug: "organize-documents-as-mindmap",
    title: "문서를 마인드맵으로 정리하는 가장 쉬운 방법",
    excerpt: "보고서, 기획서, 회의자료 같은 문서를 마인드맵으로 정리할 때 목적, 결론, 근거, 조건, 다음 행동을 나누는 방법을 소개합니다.",
    seo_keywords: ["문서 마인드맵", "문서 구조화", "문서 정리 마인드맵", "AI 문서 정리", ...commonKeywords],
    intro: "문서를 마인드맵으로 정리하면 긴 보고서나 기획서도 한눈에 보기 쉬워집니다. 하지만 문서 마인드맵은 결론만 남기는 것이 아니라 근거와 조건까지 함께 보여줘야 합니다.",
    sections: [
      { heading: "문서 요약과 문서 마인드맵의 차이", paragraphs: ["문서 요약은 내용을 짧게 보여줍니다.", "문서 마인드맵은 목적, 결론, 근거, 조건이 어떻게 연결되는지 보여줍니다."] },
      { heading: "문서 목적과 결론 먼저 잡기", paragraphs: ["문서를 구조화하려면 이 문서가 무엇을 결정하거나 설명하려는지 먼저 봐야 합니다.", "목적과 결론이 잡히면 나머지 정보의 우선순위가 보입니다."] },
      { heading: "근거, 조건, 예외를 분리하기", paragraphs: ["문서의 결론은 근거와 조건이 있어야 신뢰할 수 있습니다.", "예외나 제한 사항도 따로 표시해야 잘못 활용하는 일을 줄일 수 있습니다."] },
      { heading: "회의나 보고에 쓸 구조로 바꾸기", paragraphs: ["업무 문서는 보통 논의나 결정으로 이어집니다.", "마인드맵에 쟁점, 리스크, 다음 행동을 함께 남기면 회의 준비가 쉬워집니다."] },
      { heading: "Brify로 문서 구조맵 만들기", paragraphs: ["Brify에서는 문서를 한 문단 요약이 아니라 재사용 가능한 구조맵으로 정리할 수 있습니다.", "보고서, 기획서, 회의자료를 빠르게 이해하고 다시 활용하는 데 도움이 됩니다."] },
    ],
    closing: "문서 마인드맵은 결론과 근거를 함께 보여줘야 합니다. Brify로 문서를 다시 쓸 수 있는 구조맵으로 바꿔보세요.",
  },
  {
    slug: "turn-summary-into-mindmap",
    title: "요약 결과를 마인드맵으로 다시 정리해야 하는 이유",
    excerpt: "AI 요약 결과를 그대로 두지 않고 마인드맵으로 재구성하면 핵심 주장, 근거, 예시, 확인할 부분을 더 쉽게 볼 수 있는 이유를 설명합니다.",
    seo_keywords: ["요약 마인드맵", "요약 구조화", "요약 정리", "AI 요약 마인드맵", ...commonKeywords],
    intro: "AI 요약 결과가 있어도 나중에 다시 보기 어려울 때가 있습니다. 요약은 빠르게 읽기 좋지만, 주장과 근거의 관계가 보이지 않으면 활용하기 어렵습니다.",
    sections: [
      { heading: "요약 결과가 있어도 다시 보기 어려운 이유", paragraphs: ["요약문은 보통 문장 형태로 이어져 있습니다.", "짧기는 하지만 어떤 내용이 핵심이고 무엇을 확인해야 하는지 한눈에 보이지 않을 수 있습니다."] },
      { heading: "요약 속 주장과 근거 분리하기", paragraphs: ["요약 결과를 마인드맵으로 바꿀 때는 결론과 근거를 먼저 나누어야 합니다.", "이렇게 해야 요약이 맞는지 검토할 수 있습니다."] },
      { heading: "빠진 예시와 확인할 부분 표시하기", paragraphs: ["AI 요약은 예시나 조건을 생략할 수 있습니다.", "마인드맵에 확인할 부분을 따로 두면 원문 검토가 쉬워집니다."] },
      { heading: "요약을 발표나 보고 자료로 바꾸기", paragraphs: ["요약문을 그대로 발표하면 흐름이 밋밋할 수 있습니다.", "구조맵으로 바꾸면 결론, 근거, 예시, 다음 행동을 발표 흐름으로 재배치하기 쉽습니다."] },
      { heading: "Brify로 요약 구조맵 만들기", paragraphs: ["Brify는 AI 요약을 다시 구조화해 검토하고 재사용할 수 있게 합니다.", "요약을 최종 답이 아니라 구조화의 출발점으로 다루는 것이 좋습니다."] },
    ],
    closing: "요약은 시작점이고 마인드맵은 검토와 재사용을 위한 구조입니다. Brify로 AI 요약을 구조맵으로 바꿔보세요.",
  },
  {
    slug: "pdf-to-mindmap-checklist",
    title: "PDF를 마인드맵으로 만들 때 확인해야 할 것들",
    excerpt: "PDF를 마인드맵으로 만들 때 표, 그림, 각주, 부록, 조건을 놓치지 않기 위해 확인해야 할 기준을 설명합니다.",
    seo_keywords: ["PDF 마인드맵", "PDF 구조화", "PDF 요약 마인드맵", "PDF 정리 AI", ...commonKeywords],
    intro: "PDF를 마인드맵으로 만들면 긴 문서를 훨씬 쉽게 볼 수 있습니다. 하지만 PDF는 단순 텍스트가 아니기 때문에 표, 그림, 각주, 부록을 함께 확인해야 합니다.",
    sections: [
      { heading: "PDF는 단순 텍스트가 아니다", paragraphs: ["PDF에는 본문뿐 아니라 표, 그림, 박스, 각주, 부록이 함께 들어갑니다.", "이 요소들이 핵심 정보를 담고 있을 수 있습니다."] },
      { heading: "표와 그림을 구조에 반영하기", paragraphs: ["표와 그림은 결론의 근거가 되는 경우가 많습니다.", "마인드맵을 만들 때 이 정보를 본문과 분리해 표시하면 검토하기 쉽습니다."] },
      { heading: "각주와 부록의 조건 확인하기", paragraphs: ["각주와 부록은 사소해 보이지만 해석 조건을 담는 경우가 많습니다.", "조건을 놓치면 PDF의 결론을 잘못 사용할 수 있습니다."] },
      { heading: "PDF 요약을 마인드맵으로 검토하기", paragraphs: ["PDF 요약문만 보면 어떤 정보가 빠졌는지 알기 어렵습니다.", "마인드맵으로 바꾸면 본문, 표, 조건, 부록을 나누어 검토할 수 있습니다."] },
      { heading: "Brify로 PDF 구조맵 만들기", paragraphs: ["Brify는 PDF를 한 문단 요약으로 끝내지 않고 구조맵으로 정리하는 흐름에 맞습니다.", "긴 PDF를 다시 찾고 확인할 수 있는 형태로 남기는 데 유용합니다."] },
    ],
    closing: "PDF 마인드맵은 본문뿐 아니라 표와 조건까지 반영해야 합니다. Brify로 PDF를 검토 가능한 구조맵으로 정리해보세요.",
  },
  {
    slug: "youtube-video-to-mindmap",
    title: "유튜브 영상을 마인드맵으로 정리하는 방법",
    excerpt: "유튜브 영상을 마인드맵으로 정리할 때 핵심 질문, 구간, 주장, 예시, 다시 볼 부분을 어떻게 나누는지 설명합니다.",
    seo_keywords: ["유튜브 마인드맵", "영상 마인드맵", "유튜브 요약 마인드맵", "강의 영상 마인드맵", ...commonKeywords],
    intro: "유튜브 영상은 저장하기는 쉽지만 다시 찾기는 어렵습니다. 영상을 마인드맵으로 정리하면 핵심 질문, 중요한 구간, 예시, 다시 볼 부분을 함께 남길 수 있습니다.",
    sections: [
      { heading: "영상은 왜 구조화가 필요한가", paragraphs: ["영상은 시간 순서로 흘러가기 때문에 특정 내용을 다시 찾기 어렵습니다.", "구조화하면 주제별로 내용을 다시 볼 수 있습니다."] },
      { heading: "자막과 챕터에서 핵심 구간 찾기", paragraphs: ["유튜브 자막과 챕터는 구조화의 좋은 출발점입니다.", "반복되는 키워드와 전환 구간을 보면 핵심 구간을 찾기 쉽습니다."] },
      { heading: "주장, 예시, 다시 볼 부분 나누기", paragraphs: ["영상의 주장은 결론에 가깝고, 예시는 이해를 돕는 자료입니다.", "다시 볼 부분은 타임스탬프나 질문과 함께 남기는 것이 좋습니다."] },
      { heading: "강의 영상은 개념 중심으로 정리하기", paragraphs: ["강의 영상은 일반 영상보다 개념, 정의, 예시, 질문이 중요합니다.", "복습을 위해 개념과 예시를 연결해두어야 합니다."] },
      { heading: "Brify로 유튜브 구조맵 만들기", paragraphs: ["Brify에서는 유튜브 영상의 핵심 질문, 주장, 예시, 다시 볼 구간을 구조맵으로 남길 수 있습니다.", "나중에 복습하거나 자료로 활용하기 쉽습니다."] },
    ],
    closing: "유튜브 마인드맵은 영상을 다시 찾고 복습하기 위한 구조입니다. Brify로 영상을 지식맵처럼 남겨보세요.",
  },
  {
    slug: "ai-mindmap-tool-checklist",
    title: "AI 마인드맵 도구를 고를 때 봐야 할 기준",
    excerpt: "AI 마인드맵 도구를 선택할 때 입력 자료, 구조화 품질, 편집 가능성, 원문 확인, 공유 기능을 확인해야 하는 이유를 설명합니다.",
    seo_keywords: ["AI 마인드맵 도구", "마인드맵 생성 AI", "자동 마인드맵 도구", "구조화 도구", ...commonKeywords],
    intro: "AI 마인드맵 도구를 고를 때는 결과가 예쁜지만 보면 부족합니다. 실제로 중요한 것은 어떤 자료를 넣을 수 있는지, 구조가 맞는지, 나중에 수정하고 검토할 수 있는지입니다.",
    sections: [
      { heading: "예쁜 마인드맵만으로 부족한 이유", paragraphs: ["보기 좋은 마인드맵도 논리 구조가 틀리면 실용성이 낮습니다.", "학습이나 업무에 쓰려면 근거와 관계가 제대로 남아야 합니다."] },
      { heading: "어떤 입력 자료를 지원하는가", paragraphs: ["좋은 도구는 텍스트, 문서, PDF, 영상 요약 등 다양한 자료를 다룰 수 있어야 합니다.", "입력 자료가 제한되면 활용 범위도 좁아집니다."] },
      { heading: "구조가 논리적으로 맞는가", paragraphs: ["AI가 만든 가지가 주제별로 잘 묶였는지 확인해야 합니다.", "중요한 결론이 하위 예시처럼 들어가 있거나, 근거가 빠져 있으면 수정이 필요합니다."] },
      { heading: "편집과 원문 확인이 가능한가", paragraphs: ["AI 마인드맵은 초안에 가깝습니다.", "사용자가 직접 수정하고 원문 근거를 확인할 수 있어야 실제 자료로 쓸 수 있습니다."] },
      { heading: "Brify가 구조화 도구로 맞는 이유", paragraphs: ["Brify는 요약을 구조맵으로 바꾸고 검토하는 흐름에 초점을 둡니다.", "보기 좋은 결과보다 다시 사용할 수 있는 구조를 중요하게 봅니다."] },
    ],
    closing: "AI 마인드맵 도구는 예쁜 결과보다 검토 가능한 구조가 중요합니다. Brify에서 요약, 구조화, 재사용까지 이어지는 흐름을 확인해보세요.",
  },
  {
    slug: "check-ai-generated-mindmap",
    title: "AI가 만든 마인드맵을 그대로 믿으면 안 되는 이유",
    excerpt: "AI가 만든 마인드맵을 사용할 때 누락된 근거, 잘못 묶인 주제, 과장된 결론, 원문 확인 포인트를 검토하는 방법을 설명합니다.",
    seo_keywords: ["AI 마인드맵 검토", "AI 요약 검토", "마인드맵 오류", "AI 구조화 오류", ...commonKeywords],
    intro: "AI가 만든 마인드맵은 빠르고 편리하지만 최종 이해를 대신하지는 않습니다. 주제가 잘못 묶이거나 근거가 빠지거나 결론이 과장될 수 있기 때문입니다.",
    sections: [
      { heading: "AI 마인드맵은 초안이다", paragraphs: ["AI는 자료를 빠르게 분류하고 구조 초안을 만들 수 있습니다.", "하지만 초안은 반드시 사용자의 목적에 맞게 검토되어야 합니다."] },
      { heading: "잘못 묶인 주제를 확인하기", paragraphs: ["AI는 비슷한 단어가 나오는 내용을 같은 주제로 묶을 수 있습니다.", "하지만 실제 의미가 다르면 구조가 잘못될 수 있습니다."] },
      { heading: "빠진 근거와 예시 찾기", paragraphs: ["AI 구조화 결과에는 중요한 근거나 예시가 빠질 수 있습니다.", "결론만 남아 있다면 원문으로 돌아가 근거를 확인해야 합니다."] },
      { heading: "과장된 결론을 조심하기", paragraphs: ["AI는 조심스러운 표현을 더 단정적으로 만들 수 있습니다.", "특히 업무 보고나 공부 자료로 쓸 때는 결론의 강도를 확인해야 합니다."] },
      { heading: "Brify에서 AI 구조맵 검토하기", paragraphs: ["Brify에서는 AI가 만든 구조를 사용자가 다시 편집하고 검토할 수 있습니다.", "원문 근거와 확인할 부분을 함께 남기면 더 안전합니다."] },
    ],
    closing: "AI 마인드맵은 빠른 초안이지만 그대로 믿을 필요는 없습니다. Brify에서 구조를 검토하고 더 믿을 수 있는 자료로 다듬어보세요.",
  },
  {
    slug: "use-ai-mindmap-for-study",
    title: "공부할 때 AI 마인드맵을 활용하는 방법",
    excerpt: "공부할 때 AI 마인드맵을 활용해 개념, 정의, 예시, 질문, 복습 포인트를 구조화하는 방법을 설명합니다.",
    seo_keywords: ["공부 마인드맵 AI", "공부 마인드맵", "AI 공부 노트", "개념 정리 마인드맵", ...commonKeywords],
    intro: "공부할 때 AI 마인드맵을 쓰면 긴 강의 노트나 자료를 한눈에 보기 쉬워집니다. 다만 공부용 마인드맵은 예쁜 노트가 아니라 복습을 돕는 구조여야 합니다.",
    sections: [
      { heading: "공부용 마인드맵이 필요한 이유", paragraphs: ["공부 자료는 시간이 지나면 핵심 흐름이 흐려집니다.", "마인드맵은 개념과 관계를 다시 떠올리는 데 도움이 됩니다."] },
      { heading: "개념과 예시를 분리하기", paragraphs: ["개념과 예시를 섞어두면 복습할 때 무엇을 외워야 하는지 헷갈립니다.", "개념을 중심에 두고 예시를 연결하면 이해가 안정됩니다."] },
      { heading: "모르는 부분을 질문으로 남기기", paragraphs: ["공부에서는 이해한 내용보다 모르는 부분을 표시하는 것이 중요합니다.", "질문 노드를 남기면 다음 복습의 목표가 분명해집니다."] },
      { heading: "복습 순서를 구조로 만들기", paragraphs: ["마인드맵은 복습 순서를 만드는 데도 유용합니다.", "기초 개념에서 응용 예시로 이어지는 흐름을 만들 수 있습니다."] },
      { heading: "Brify로 공부 구조맵 만들기", paragraphs: ["Brify에서는 강의 노트, 문서, 요약을 개념 중심 구조맵으로 바꿀 수 있습니다.", "복습할 때 전체 자료를 다시 읽지 않아도 흐름을 회복할 수 있습니다."] },
    ],
    closing: "공부용 AI 마인드맵은 기억을 돕는 구조여야 합니다. Brify로 개념, 예시, 질문이 연결된 공부 구조맵을 만들어보세요.",
  },
  {
    slug: "use-ai-structure-map-for-work",
    title: "업무에서 AI 구조맵을 활용하는 방법",
    excerpt: "업무에서 AI 구조맵을 활용해 회의자료, 보고서, 기획서, 리서치 내용을 결론, 근거, 쟁점, 다음 행동으로 정리하는 방법을 소개합니다.",
    seo_keywords: ["업무 구조화 AI", "업무 마인드맵", "회의자료 구조화", "보고서 구조맵", ...commonKeywords],
    intro: "업무에서 정보 정리는 이해하는 것에서 끝나지 않습니다. 회의자료, 보고서, 기획서, 리서치 내용은 결국 결정과 다음 행동으로 이어져야 합니다.",
    sections: [
      { heading: "업무에서 구조화가 필요한 순간", paragraphs: ["회의 전에 자료가 길거나, 보고서의 결론과 근거가 흩어져 있을 때 구조화가 필요합니다.", "기획서나 리서치 자료도 핵심 쟁점이 보이지 않으면 실행으로 이어지기 어렵습니다."] },
      { heading: "결론과 근거를 분리하기", paragraphs: ["업무 자료에서는 결론과 근거를 분리해야 논의가 명확해집니다.", "결론만 있으면 설득력이 약하고, 근거만 있으면 방향이 흐려집니다."] },
      { heading: "쟁점과 리스크 표시하기", paragraphs: ["좋은 구조맵은 긍정적인 결론뿐 아니라 쟁점과 리스크도 보여줍니다.", "회의에서 논의해야 할 부분을 미리 표시할 수 있습니다."] },
      { heading: "다음 행동으로 연결하기", paragraphs: ["업무용 구조맵은 마지막에 다음 행동이 남아야 합니다.", "누가 무엇을 확인하고 결정해야 하는지 표시하면 실행 가능성이 높아집니다."] },
      { heading: "Brify로 업무 구조맵 만들기", paragraphs: ["Brify는 회의자료, 보고서, 기획서를 결론, 근거, 쟁점, 다음 행동으로 정리하는 데 맞습니다.", "정보를 보는 데서 끝나지 않고 결정으로 이어지는 구조를 만들 수 있습니다."] },
    ],
    closing: "업무용 AI 구조맵은 결론과 다음 행동을 선명하게 만들어야 합니다. Brify로 복잡한 업무 자료를 실행 가능한 구조로 바꿔보세요.",
  },
];

async function getExistingPost(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "ko")
    .eq("slug", post.slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const results = [];

for (const post of posts) {
  const existing = await getExistingPost(post);
  const markdown = insertDefaultBodyImage(buildMarkdown(post));
  const payload = {
    locale: "ko",
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    seo_keywords: Array.from(new Set(post.seo_keywords)),
    image_url: imageUrl,
    markdown,
    status: "draft",
    published_at: null,
    translation_group_id: existing?.translation_group_id ?? randomUUID(),
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("blog_posts")
      .update(payload)
      .eq("id", existing.id)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "updated", ...data });
  } else {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert(payload)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "created", ...data });
  }
}

console.log(JSON.stringify({ count: results.length, results }, null, 2));
