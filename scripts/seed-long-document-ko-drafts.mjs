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

const commonKeywords = ["긴 문서 요약", "PDF 요약", "문서 구조화", "AI 문서 요약", "AI 구조맵", "Brify"];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## 실제로 적용하는 순서",
    `${post.title}를 실제 작업에 적용하려면 먼저 문서를 처음부터 끝까지 읽으려고 하지 말고, 문서의 목적과 사용 장면을 정해야 합니다. 긴 문서는 모든 문장이 같은 무게를 갖지 않습니다. 의사결정에 필요한 부분, 나중에 다시 찾아야 할 부분, 배경으로만 필요한 부분을 나눠야 합니다.`,
    "첫째, 문서가 답하려는 질문을 한 문장으로 적습니다. 둘째, 목차나 소제목을 훑어 큰 덩어리를 나눕니다. 셋째, 각 섹션에서 핵심 주장, 근거, 숫자, 조건, 예외를 분리합니다. 넷째, 표와 그림, 체크리스트, 부록처럼 요약에서 빠지기 쉬운 요소를 따로 확인합니다. 다섯째, 마지막에 이 문서를 다시 열어야 하는 상황을 기준으로 구조를 정리합니다.",
    "이 과정을 거치면 긴 문서가 단순히 짧아지는 것이 아니라 다시 사용할 수 있는 자료가 됩니다. 보고서, PDF, 매뉴얼, 회의자료는 한 번 읽고 끝나는 자료가 아니라 나중에 찾고 비교하고 설명해야 하는 자료이기 때문입니다.",
    "## Brify에 넣을 때의 구조 예시",
    `Brify에서 ${post.seo_keywords[0]} 작업을 할 때는 큰 노드를 '문서 목적', '핵심 결론', '중요 근거', '표와 수치', '주의할 조건', '다음 행동'으로 나누어볼 수 있습니다. 이렇게 하면 요약문 하나만 남기는 것보다 문서를 다시 활용하기가 훨씬 쉬워집니다.`,
    "문서가 길수록 핵심 문장만 모으는 방식은 위험합니다. 핵심 문장이 어떤 섹션에서 나왔는지, 어떤 조건이 붙어 있는지, 어떤 근거와 연결되는지를 함께 남겨야 합니다. 구조맵은 이런 관계를 한눈에 보이게 만듭니다.",
    "또한 Brify 구조맵 안에는 확실히 이해한 내용과 아직 확인해야 할 내용을 나누어두는 것이 좋습니다. AI 요약이나 자동 정리는 빠르지만, 긴 문서의 표, 예외 조항, 전제 조건을 모두 완벽하게 보장하지는 않습니다.",
    "## 흔히 생기는 실수",
    "가장 흔한 실수는 긴 문서를 한 문단 요약으로만 줄이는 것입니다. 짧은 요약은 빠르게 읽기에는 좋지만, 나중에 구체적인 근거를 확인해야 할 때 다시 원문을 뒤져야 합니다.",
    "두 번째 실수는 제목과 결론만 보고 전체 내용을 이해했다고 판단하는 것입니다. 긴 문서에서는 결론보다 조건과 예외가 더 중요할 때가 많습니다. 특히 보고서나 매뉴얼은 본문 중간의 기준, 범위, 제한 사항을 놓치면 잘못 활용될 수 있습니다.",
    "세 번째 실수는 PDF의 레이아웃을 무시하는 것입니다. 표, 그림, 각주, 박스 텍스트, 부록은 핵심 정보를 담고 있을 수 있습니다. 문서 구조화에서는 텍스트뿐 아니라 정보가 배치된 방식도 함께 봐야 합니다.",
    "## 오늘 바로 해볼 일",
    `오늘 ${post.seo_keywords[0]}를 시작한다면 긴 문서 하나를 골라 제목, 목차, 결론, 표, 주의 조건만 먼저 표시해보세요. 전체를 완벽하게 읽기보다 문서의 지도를 먼저 만드는 것이 중요합니다.`,
    "그다음 각 섹션에 대해 '이 부분은 나중에 왜 다시 필요할까'를 한 문장으로 적어보세요. 이 질문에 답이 나오는 섹션은 구조맵에 남길 가치가 있습니다. 답이 나오지 않는 섹션은 배경 정보로 낮은 우선순위를 줄 수 있습니다.",
    "작게 시작해도 괜찮습니다. 중요한 것은 긴 문서를 읽을 때마다 다시 찾을 수 있는 구조를 남기는 것입니다. 그래야 요약이 일회용 메모가 아니라 실제 업무와 학습에 쓰이는 자료가 됩니다.",
    "이렇게 정리한 구조는 나중에 같은 유형의 문서를 다시 읽을 때 기준표처럼 사용할 수 있습니다.",
    "## 마무리",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    slug: "how-to-summarize-long-documents",
    title: "긴 문서 요약, 어디서부터 해야 할까",
    excerpt: "긴 문서를 요약할 때 목적, 목차, 핵심 주장, 근거, 조건을 어떤 순서로 봐야 하는지 설명합니다.",
    seo_keywords: ["긴 문서 요약", "긴 문서 정리", "문서 요약 방법", ...commonKeywords],
    intro: "긴 문서를 처음부터 끝까지 읽으려 하면 금방 지칩니다. 중요한 것은 문장을 모두 줄이는 것이 아니라, 문서가 어떤 목적을 가지고 어떤 근거로 결론에 도달하는지 구조를 잡는 일입니다.",
    sections: [
      { heading: "긴 문서 요약이 어려운 이유", paragraphs: ["긴 문서는 정보가 많아서 어려운 것이 아니라 정보의 우선순위가 보이지 않아서 어렵습니다.", "배경, 근거, 예외, 결론이 섞여 있으면 요약을 해도 나중에 다시 활용하기 어렵습니다."] },
      { heading: "목적을 먼저 정해야 하는 이유", paragraphs: ["같은 문서라도 시험 공부, 회의 준비, 보고서 작성, 의사결정에 따라 필요한 요약이 달라집니다.", "요약의 목적이 정해져야 무엇을 남기고 무엇을 줄일지 판단할 수 있습니다."] },
      { heading: "목차와 소제목으로 구조 보기", paragraphs: ["긴 문서는 목차와 소제목이 지도 역할을 합니다. 먼저 큰 덩어리를 나누면 본문을 읽을 때 길을 잃지 않습니다.", "섹션별 역할을 표시해두면 핵심 문장만 뽑는 것보다 훨씬 안정적인 요약이 됩니다."] },
      { heading: "핵심 주장과 근거를 분리하기", paragraphs: ["요약할 때 결론만 남기면 위험합니다. 결론을 뒷받침하는 근거와 조건도 함께 남겨야 합니다.", "특히 숫자, 비교 기준, 예외 조건은 나중에 다시 확인해야 할 가능성이 높습니다."] },
      { heading: "Brify로 긴 문서 구조화하기", paragraphs: ["Brify는 긴 문서를 한 문단으로 줄이기보다 구조맵으로 정리하는 데 적합합니다.", "문서의 목적, 핵심 결론, 근거, 조건을 나누어두면 나중에 다시 열어보기 쉽습니다."] },
    ],
    closing: "긴 문서 요약은 짧게 만드는 일이 아니라 다시 쓸 수 있게 만드는 일입니다. Brify 구조맵으로 문서의 흐름을 먼저 잡아보세요.",
  },
  {
    slug: "common-pdf-summary-mistakes",
    title: "PDF 요약을 할 때 자주 놓치는 것들",
    excerpt: "PDF 요약에서 표, 그림, 각주, 부록, 레이아웃 정보가 왜 빠지기 쉬운지와 확인 방법을 설명합니다.",
    seo_keywords: ["PDF 요약", "PDF 요약 오류", "AI PDF 요약", ...commonKeywords],
    intro: "PDF는 단순한 텍스트 파일이 아닙니다. 표, 그림, 각주, 박스, 부록, 페이지 배치가 함께 의미를 만듭니다. 그래서 PDF 요약은 일반 텍스트 요약보다 더 조심해야 합니다.",
    sections: [
      { heading: "PDF는 텍스트만으로 이루어지지 않는다", paragraphs: ["PDF 문서의 중요한 정보는 본문 밖에 있을 수 있습니다.", "표나 그림이 결과를 담고, 각주가 조건을 설명하고, 부록이 세부 기준을 보여주는 경우가 많습니다."] },
      { heading: "표와 그림이 빠지는 문제", paragraphs: ["AI 요약은 본문 문장 중심으로 작동할 때 표와 그림의 의미를 약하게 반영할 수 있습니다.", "PDF 요약 후에는 중요한 표와 그림이 요약에 반영됐는지 따로 확인해야 합니다."] },
      { heading: "각주와 부록의 조건 확인하기", paragraphs: ["각주와 부록은 사소해 보이지만 해석의 조건을 담는 경우가 많습니다.", "계약서식, 정책 문서, 기술 문서에서는 부록을 놓치면 핵심 조건을 잘못 이해할 수 있습니다."] },
      { heading: "페이지 순서와 문서 구조 보기", paragraphs: ["PDF는 시각적 배치가 의미를 만듭니다. 페이지 순서, 박스 텍스트, 강조 영역을 함께 봐야 합니다.", "단순 추출 텍스트만 보면 정보의 계층이 무너질 수 있습니다."] },
      { heading: "Brify로 PDF 요약을 검토하는 법", paragraphs: ["Brify 구조맵에 본문, 표, 그림, 주의 조건을 나누어 넣으면 PDF 요약을 검토하기 쉽습니다.", "요약 결과가 원문 구조를 따라가는지 확인하는 데 도움이 됩니다."] },
    ],
    closing: "PDF 요약은 빠르지만 표와 조건을 놓치면 위험합니다. Brify로 PDF의 구조를 함께 확인해보세요.",
  },
  {
    slug: "why-document-structuring-matters",
    title: "문서 구조화가 단순 요약보다 중요한 이유",
    excerpt: "문서 구조화가 단순 요약보다 재사용, 검색, 비교, 검토에 더 유리한 이유를 설명합니다.",
    seo_keywords: ["문서 구조화", "문서 정리 방법", "문서 요약", ...commonKeywords],
    intro: "문서 요약은 빠르게 내용을 파악하게 해줍니다. 하지만 실제로 문서를 다시 사용해야 할 때는 단순 요약보다 구조화가 더 중요합니다.",
    sections: [
      { heading: "요약과 구조화의 차이", paragraphs: ["요약은 내용을 줄이는 일이고, 구조화는 내용을 다시 찾고 사용할 수 있게 배치하는 일입니다.", "긴 문서에서는 두 작업이 같지 않습니다."] },
      { heading: "짧은 요약이 부족한 순간", paragraphs: ["회의나 보고서에서 근거를 다시 확인해야 할 때 한 문단 요약만으로는 부족합니다.", "어떤 주장에 어떤 근거가 붙어 있었는지 보이지 않기 때문입니다."] },
      { heading: "구조화는 검색 가능성을 높인다", paragraphs: ["문서를 목적, 근거, 조건, 다음 행동으로 나누면 나중에 필요한 부분을 빠르게 찾을 수 있습니다.", "이는 공부뿐 아니라 업무 문서에서도 큰 차이를 만듭니다."] },
      { heading: "여러 문서를 비교할 수 있다", paragraphs: ["문서를 같은 구조로 정리하면 여러 PDF나 보고서를 비교하기 쉬워집니다.", "각 문서의 결론, 근거, 조건을 같은 위치에서 볼 수 있기 때문입니다."] },
      { heading: "Brify가 구조화에 맞는 이유", paragraphs: ["Brify는 문서를 단순 텍스트 요약으로 끝내지 않고 구조맵으로 볼 수 있게 합니다.", "문서가 길수록 이런 구조가 나중의 시간을 아껴줍니다."] },
    ],
    closing: "문서 구조화는 요약 이후의 재사용을 위한 작업입니다. Brify로 긴 문서를 다시 찾을 수 있는 구조로 바꿔보세요.",
  },
  {
    slug: "how-to-read-long-reports-faster",
    title: "긴 보고서를 빠르게 읽는 방법",
    excerpt: "긴 보고서를 빠르게 읽기 위해 결론, 핵심 지표, 근거, 리스크, 다음 행동을 분리하는 방법을 소개합니다.",
    seo_keywords: ["보고서 요약", "긴 보고서 읽는 법", "보고서 정리", ...commonKeywords],
    intro: "긴 보고서는 처음부터 끝까지 읽기 전에 무엇을 결정하기 위한 문서인지 파악해야 합니다. 보고서 읽기의 핵심은 속도가 아니라 판단에 필요한 정보를 빠르게 찾는 것입니다.",
    sections: [
      { heading: "보고서는 의사결정 문서다", paragraphs: ["많은 보고서는 정보를 전달하기보다 의사결정을 돕기 위해 작성됩니다.", "그래서 결론, 근거, 리스크, 권고안을 분리해서 봐야 합니다."] },
      { heading: "요약문과 결론 먼저 보기", paragraphs: ["먼저 요약문과 결론을 읽어 보고서의 방향을 잡습니다.", "다만 결론만 믿지 말고 어떤 데이터와 조건에서 나온 결론인지 확인해야 합니다."] },
      { heading: "핵심 지표와 숫자 표시하기", paragraphs: ["보고서에서 숫자는 결론의 무게를 결정합니다.", "비율, 기간, 표본, 비교 기준을 함께 남겨야 나중에 잘못 인용하지 않습니다."] },
      { heading: "리스크와 예외 조건 찾기", paragraphs: ["좋은 보고서에는 한계와 리스크가 들어 있습니다.", "이 부분을 놓치면 보고서의 결론을 과장해서 이해할 수 있습니다."] },
      { heading: "Brify로 보고서 흐름 정리하기", paragraphs: ["Brify에 결론, 지표, 근거, 리스크, 다음 행동을 나누면 보고서를 빠르게 재검토할 수 있습니다.", "회의 전에 보고서를 구조맵으로 바꾸면 논의할 지점도 선명해집니다."] },
    ],
    closing: "긴 보고서는 빨리 읽는 것보다 필요한 판단을 빠르게 찾는 것이 중요합니다. Brify로 보고서의 결론과 근거를 구조화해보세요.",
  },
  {
    slug: "pdf-summary-tool-checklist",
    title: "PDF 요약 도구를 고를 때 봐야 할 기준",
    excerpt: "PDF 요약 도구를 선택할 때 표 처리, 원문 확인, 구조화, 편집 가능성, 공유 기능을 확인해야 하는 이유를 설명합니다.",
    seo_keywords: ["PDF 요약 도구", "PDF 요약 AI", "AI PDF 요약 도구", ...commonKeywords],
    intro: "PDF 요약 도구는 많지만 모두 같은 방식으로 작동하지 않습니다. 좋은 도구는 단순히 짧은 요약을 주는 것이 아니라, 사용자가 원문을 검토하고 다시 활용할 수 있게 도와야 합니다.",
    sections: [
      { heading: "요약 품질만 보면 부족하다", paragraphs: ["자연스러운 문장으로 요약한다고 해서 좋은 도구는 아닙니다.", "PDF의 구조와 핵심 근거가 제대로 남아 있는지 확인해야 합니다."] },
      { heading: "표와 그림 처리 확인하기", paragraphs: ["PDF에는 표와 그림이 핵심 정보를 담는 경우가 많습니다.", "도구가 이런 요소를 어떻게 반영하는지 확인해야 합니다."] },
      { heading: "원문으로 돌아갈 수 있어야 한다", paragraphs: ["요약 결과가 그럴듯해도 원문 근거를 확인할 수 없다면 위험합니다.", "페이지나 섹션 단위로 다시 확인할 수 있는 흐름이 좋습니다."] },
      { heading: "편집과 재사용이 가능한가", paragraphs: ["요약은 초안입니다. 실제 작업에서는 수정하고 재배치해야 합니다.", "구조화와 편집 기능은 PDF 요약 도구의 중요한 기준입니다."] },
      { heading: "Brify가 보는 기준", paragraphs: ["Brify는 PDF를 단순히 줄이는 것보다 구조맵으로 다시 활용하는 흐름에 맞춰져 있습니다.", "요약 후 검토와 공유가 필요한 사용자에게 특히 유용합니다."] },
    ],
    closing: "PDF 요약 도구를 고를 때는 짧은 결과보다 검토 가능한 구조를 봐야 합니다. Brify에서 PDF 요약을 구조맵으로 확인해보세요.",
  },
  {
    slug: "organize-meeting-documents",
    title: "회의자료와 기획서를 구조화하는 법",
    excerpt: "회의자료와 기획서를 목적, 안건, 근거, 쟁점, 결정 사항으로 구조화하는 방법을 소개합니다.",
    seo_keywords: ["회의자료 정리", "기획서 정리", "회의 문서 요약", ...commonKeywords],
    intro: "회의자료와 기획서는 읽기 위한 문서이면서 동시에 결정을 위한 문서입니다. 그래서 단순 요약보다 안건, 근거, 쟁점, 결정 사항을 분리하는 구조화가 중요합니다.",
    sections: [
      { heading: "회의자료는 결정과 연결된다", paragraphs: ["회의자료를 읽을 때는 어떤 결정을 해야 하는지 먼저 봐야 합니다.", "목적이 보이지 않으면 핵심 정보와 배경 정보가 섞입니다."] },
      { heading: "안건과 배경을 분리하기", paragraphs: ["안건은 회의에서 논의할 문제이고, 배경은 그 문제를 이해하기 위한 정보입니다.", "두 가지를 분리하면 회의 중 논의가 덜 흐트러집니다."] },
      { heading: "근거와 쟁점 표시하기", paragraphs: ["기획서에는 주장과 근거가 함께 들어 있습니다.", "어떤 근거가 어떤 주장과 연결되는지 표시해야 반박이나 질문에 대응하기 쉽습니다."] },
      { heading: "결정 사항과 다음 행동 남기기", paragraphs: ["회의 후에는 무엇이 결정됐고 누가 무엇을 해야 하는지가 남아야 합니다.", "요약보다 다음 행동이 중요할 때가 많습니다."] },
      { heading: "Brify로 회의 전 구조 만들기", paragraphs: ["Brify 구조맵에 안건, 근거, 쟁점, 결정 후보를 넣으면 회의 준비가 쉬워집니다.", "긴 기획서도 한눈에 논의 흐름을 볼 수 있습니다."] },
    ],
    closing: "회의자료와 기획서는 결정으로 이어져야 합니다. Brify로 문서를 안건과 근거 중심으로 구조화해보세요.",
  },
  {
    slug: "summarize-manuals-and-guides",
    title: "매뉴얼이나 가이드 문서를 이해하기 쉽게 정리하는 법",
    excerpt: "매뉴얼과 가이드 문서를 절차, 조건, 예외, 체크리스트, 문제 해결 기준으로 정리하는 방법을 설명합니다.",
    seo_keywords: ["매뉴얼 요약", "가이드 문서 정리", "업무 매뉴얼 정리", ...commonKeywords],
    intro: "매뉴얼과 가이드 문서는 처음부터 끝까지 읽는 문서라기보다 필요할 때 정확한 절차를 찾는 문서입니다. 그래서 핵심은 짧은 요약이 아니라 절차와 조건을 찾기 쉽게 정리하는 것입니다.",
    sections: [
      { heading: "매뉴얼은 절차 중심 문서다", paragraphs: ["매뉴얼에서는 무엇을 해야 하는지보다 어떤 순서로 해야 하는지가 중요합니다.", "절차가 흐트러지면 실제 적용에서 실수가 생깁니다."] },
      { heading: "조건과 예외를 따로 표시하기", paragraphs: ["가이드 문서에는 일반 규칙과 예외가 함께 들어 있습니다.", "예외 조건을 놓치면 잘못된 방식으로 매뉴얼을 적용할 수 있습니다."] },
      { heading: "체크리스트로 바꾸기", paragraphs: ["매뉴얼을 체크리스트로 바꾸면 실제 실행이 쉬워집니다.", "각 단계의 완료 기준을 함께 적어두면 더 좋습니다."] },
      { heading: "문제 해결 섹션 분리하기", paragraphs: ["매뉴얼의 문제 해결 부분은 나중에 가장 자주 찾게 됩니다.", "오류 상황, 원인, 해결 행동을 따로 구조화하세요."] },
      { heading: "Brify로 매뉴얼을 재사용하기", paragraphs: ["Brify에서는 절차, 조건, 예외, 체크리스트를 구조맵으로 만들 수 있습니다.", "매뉴얼을 한 번 정리해두면 교육이나 업무 인수인계에도 활용하기 좋습니다."] },
    ],
    closing: "매뉴얼 요약은 짧게 줄이는 것보다 정확하게 실행할 수 있게 만드는 일입니다. Brify로 절차와 예외를 구조화해보세요.",
  },
  {
    slug: "compare-multiple-pdfs",
    title: "여러 PDF를 한 번에 비교 정리하는 방법",
    excerpt: "여러 PDF를 비교할 때 목적, 결론, 기준, 수치, 차이점, 공통점을 같은 구조로 정리하는 방법을 소개합니다.",
    seo_keywords: ["여러 PDF 요약", "PDF 비교 정리", "여러 문서 요약", ...commonKeywords],
    intro: "여러 PDF를 각각 요약해두면 처음에는 편하지만, 나중에는 어떤 문서가 어떤 차이를 보였는지 헷갈립니다. 비교가 필요한 경우에는 처음부터 같은 기준으로 정리해야 합니다.",
    sections: [
      { heading: "여러 PDF 요약이 헷갈리는 이유", paragraphs: ["문서마다 형식과 용어가 다르면 개별 요약만으로 비교하기 어렵습니다.", "각 PDF의 목적, 결론, 근거가 같은 위치에 있어야 차이가 보입니다."] },
      { heading: "공통 비교 기준 만들기", paragraphs: ["먼저 모든 PDF에 적용할 기준을 정하세요.", "목적, 대상, 핵심 결론, 수치, 조건, 한계 같은 기준을 반복해서 쓰면 비교가 쉬워집니다."] },
      { heading: "공통점과 차이점 분리하기", paragraphs: ["여러 문서의 공통점은 큰 흐름을 보여주고, 차이점은 의사결정에 필요한 단서를 줍니다.", "둘을 따로 정리해야 문서 비교가 선명해집니다."] },
      { heading: "숫자와 조건 검토하기", paragraphs: ["PDF 간 차이는 숫자와 조건에서 나오는 경우가 많습니다.", "기간, 표본, 단위, 기준이 같은지 확인해야 합니다."] },
      { heading: "Brify로 여러 PDF 연결하기", paragraphs: ["Brify 구조맵에 각 PDF를 같은 기준으로 배치하면 비교가 쉬워집니다.", "여러 문서를 하나의 구조 안에서 볼 수 있어 보고서나 회의 준비에도 유용합니다."] },
    ],
    closing: "여러 PDF는 각각 요약하기보다 같은 기준으로 비교해야 합니다. Brify에서 공통점과 차이점을 구조맵으로 연결해보세요.",
  },
  {
    slug: "extract-key-questions-from-documents",
    title: "긴 문서에서 핵심 질문을 뽑아내는 법",
    excerpt: "긴 문서에서 핵심 질문과 쟁점을 찾아 문서의 목적, 결론, 근거를 더 빠르게 이해하는 방법을 설명합니다.",
    seo_keywords: ["문서 핵심 정리", "핵심 질문 추출", "문서 쟁점 정리", ...commonKeywords],
    intro: "긴 문서를 잘 이해하려면 핵심 문장보다 핵심 질문을 먼저 찾아야 합니다. 문서가 어떤 질문에 답하려는지 알면 세부 내용의 우선순위가 보입니다.",
    sections: [
      { heading: "핵심 질문이 중요한 이유", paragraphs: ["문서는 보통 어떤 문제를 해결하기 위해 작성됩니다.", "그 질문을 모르면 결론과 근거가 왜 중요한지 판단하기 어렵습니다."] },
      { heading: "제목과 목차에서 질문 찾기", paragraphs: ["제목, 소제목, 목차는 문서의 질문을 암시합니다.", "각 섹션 제목을 질문 형태로 바꿔보면 문서 구조가 더 잘 보입니다."] },
      { heading: "반복되는 표현 표시하기", paragraphs: ["긴 문서에서 반복되는 단어와 표현은 핵심 쟁점을 드러냅니다.", "반복되는 개념을 묶으면 문서가 집중하는 문제가 보입니다."] },
      { heading: "결론을 질문으로 되돌리기", paragraphs: ["결론을 읽은 뒤 '이 결론은 어떤 질문에 대한 답인가'를 물어보세요.", "이 방식은 문서의 논리 흐름을 빠르게 파악하게 해줍니다."] },
      { heading: "Brify로 질문 중심 구조 만들기", paragraphs: ["Brify에서 핵심 질문을 중심 노드로 두고 근거와 결론을 연결하면 문서 이해가 빨라집니다.", "질문 중심 구조는 나중에 발표나 보고에도 활용하기 좋습니다."] },
    ],
    closing: "긴 문서의 핵심은 문장이 아니라 질문입니다. Brify로 질문, 근거, 결론을 연결해보세요.",
  },
  {
    slug: "check-ai-document-summary",
    title: "AI 문서 요약 결과를 그대로 믿으면 안 되는 이유",
    excerpt: "AI 문서 요약 결과를 검토할 때 누락, 과장, 조건 생략, 표 해석 오류를 확인해야 하는 이유를 설명합니다.",
    seo_keywords: ["AI 문서 요약", "AI 요약 검토", "문서 요약 오류", ...commonKeywords],
    intro: "AI 문서 요약은 빠르고 편리합니다. 하지만 긴 문서의 조건, 예외, 표, 맥락을 모두 완벽하게 반영한다고 가정하면 위험합니다.",
    sections: [
      { heading: "AI 요약은 출발점이다", paragraphs: ["AI 요약은 문서를 빠르게 훑는 데 도움을 줍니다.", "하지만 최종 판단이나 보고에 쓰려면 반드시 검토가 필요합니다."] },
      { heading: "누락된 섹션 확인하기", paragraphs: ["긴 문서에서는 특정 섹션이 요약에서 약하게 반영될 수 있습니다.", "특히 제한 사항, 부록, 조건, 예외를 확인해야 합니다."] },
      { heading: "과장된 결론 조심하기", paragraphs: ["AI는 조심스러운 표현을 더 단정적으로 바꿀 수 있습니다.", "원문이 어떤 조건에서 결론을 말했는지 확인해야 합니다."] },
      { heading: "표와 숫자 검토하기", paragraphs: ["표와 숫자는 잘못 해석되면 큰 오류로 이어질 수 있습니다.", "단위, 기간, 기준, 비교 대상을 따로 확인하세요."] },
      { heading: "Brify로 AI 요약 검토하기", paragraphs: ["Brify 구조맵에 AI 요약과 원문 근거를 나누어 넣으면 검토가 쉬워집니다.", "요약을 믿기 전에 구조적으로 확인하는 습관이 중요합니다."] },
    ],
    closing: "AI 문서 요약은 빠른 출발점이지만 최종 답은 아닙니다. Brify에서 요약과 원문 근거를 함께 검토해보세요.",
  },
  {
    slug: "use-document-summary-for-reporting",
    title: "문서 요약을 업무 보고나 발표에 활용하는 법",
    excerpt: "문서 요약을 업무 보고나 발표로 바꿀 때 청중, 결론, 근거, 시각 자료, 다음 행동을 구조화하는 방법을 소개합니다.",
    seo_keywords: ["문서 요약 활용", "업무 보고 자료 정리", "발표 자료 요약", ...commonKeywords],
    intro: "문서 요약을 그대로 보고나 발표에 붙여 넣으면 흐름이 어색해질 수 있습니다. 보고와 발표에는 청중이 따라갈 수 있는 순서가 필요합니다.",
    sections: [
      { heading: "요약과 보고는 다르다", paragraphs: ["요약은 나를 위한 이해이고, 보고는 다른 사람에게 판단을 돕는 전달입니다.", "따라서 문서 요약을 그대로 읽어주는 방식은 효과가 약합니다."] },
      { heading: "청중이 필요한 결론부터 정하기", paragraphs: ["보고나 발표에서는 청중이 무엇을 결정해야 하는지 먼저 생각해야 합니다.", "결론과 근거의 순서를 청중 기준으로 재배치하세요."] },
      { heading: "근거를 너무 많이 넣지 않기", paragraphs: ["모든 근거를 발표에 넣으면 핵심이 흐려집니다.", "가장 중요한 수치, 사례, 조건만 남기고 나머지는 보조 자료로 두는 편이 좋습니다."] },
      { heading: "다음 행동을 분명히 하기", paragraphs: ["업무 보고는 보통 다음 행동으로 이어져야 합니다.", "결정할 것, 확인할 것, 맡을 사람을 분리해두세요."] },
      { heading: "Brify로 발표 흐름 만들기", paragraphs: ["Brify 구조맵을 사용하면 문서 요약을 발표 흐름으로 재배치하기 쉽습니다.", "결론, 근거, 리스크, 다음 행동을 한눈에 볼 수 있습니다."] },
    ],
    closing: "문서 요약은 보고와 발표의 재료입니다. Brify로 청중이 따라갈 수 있는 구조로 다시 배열해보세요.",
  },
  {
    slug: "make-long-documents-searchable",
    title: "긴 문서를 나중에 다시 찾기 쉽게 정리하는 법",
    excerpt: "긴 문서를 나중에 다시 찾기 쉽게 핵심 질문, 키워드, 섹션, 근거, 태그 중심으로 정리하는 방법을 설명합니다.",
    seo_keywords: ["문서 정리 방법", "긴 문서 정리", "문서 검색 가능하게 정리", ...commonKeywords],
    intro: "긴 문서는 읽는 순간보다 나중에 다시 찾을 때 더 큰 문제가 됩니다. 어디에 어떤 내용이 있었는지 기억나지 않으면 요약을 해도 다시 원문을 뒤지게 됩니다.",
    sections: [
      { heading: "다시 찾을 수 있어야 좋은 정리다", paragraphs: ["문서 정리의 목표는 읽은 흔적을 남기는 것이 아닙니다.", "필요한 순간에 핵심 근거와 조건을 빠르게 찾을 수 있어야 합니다."] },
      { heading: "키워드와 질문을 함께 남기기", paragraphs: ["키워드만 남기면 맥락이 부족하고, 질문만 남기면 검색성이 약할 수 있습니다.", "둘을 함께 남기면 나중에 찾기 쉬워집니다."] },
      { heading: "섹션 위치 기록하기", paragraphs: ["중요한 내용이 어느 섹션에 있었는지 남겨두면 원문 확인이 빨라집니다.", "페이지나 제목 정보를 함께 기록하는 것도 좋습니다."] },
      { heading: "근거와 결론을 연결하기", paragraphs: ["결론만 남기면 나중에 신뢰하기 어렵습니다.", "근거, 숫자, 조건을 함께 연결해야 재사용할 수 있습니다."] },
      { heading: "Brify로 검색 가능한 구조 만들기", paragraphs: ["Brify 구조맵은 긴 문서를 키워드와 관계 중심으로 정리하는 데 유용합니다.", "문서가 많아질수록 이런 구조가 지식 저장소처럼 작동합니다."] },
    ],
    closing: "긴 문서 정리는 나중에 다시 찾기 위한 작업입니다. Brify로 핵심 질문, 근거, 조건을 검색 가능한 구조로 남겨보세요.",
  },
];

const results = [];

for (const post of posts) {
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
  };

  const existing = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "ko")
    .eq("slug", post.slug)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        ...payload,
        translation_group_id: existing.data.translation_group_id ?? randomUUID(),
      })
      .eq("id", existing.data.id)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "updated", ...data });
  } else {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        ...payload,
        translation_group_id: randomUUID(),
      })
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "created", ...data });
  }
}

console.log(JSON.stringify({ count: results.length, results }, null, 2));
