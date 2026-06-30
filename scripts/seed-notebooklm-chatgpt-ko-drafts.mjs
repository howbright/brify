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

const commonKeywords = [
  "NotebookLM 대안",
  "ChatGPT 논문 요약 한계",
  "AI 논문 요약 도구",
  "논문 구조화",
  "AI 구조맵",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Brify에서 구조맵으로 바꾸는 방법",
    `${post.title}를 실제로 적용하려면 먼저 AI가 만든 답변이나 요약문을 최종 결과로 보지 않는 것이 중요합니다. NotebookLM이나 ChatGPT가 빠르게 이해를 도와줄 수는 있지만, 논문과 연구 자료는 나중에 다시 확인하고 비교하고 글쓰기나 발표에 써야 하는 경우가 많습니다.`,
    "Brify에서는 자료를 '연구 질문', '핵심 주장', '방법론', '결과', '근거', '한계', '내가 확인할 부분', '내 작업에 쓸 부분'으로 나누어 구조맵으로 정리할 수 있습니다. 이렇게 해두면 요약 문장만 남기는 것보다 원문으로 돌아가기도 쉽고, 여러 자료를 같은 기준으로 비교하기도 쉽습니다.",
    "특히 논문 요약에서는 자연스러운 문장보다 검토 가능한 구조가 더 중요합니다. 어떤 문장이 원문의 어느 부분에서 나온 것인지, 어떤 조건에서만 맞는 결론인지, 내 과제나 연구 질문과 실제로 연결되는지 확인할 수 있어야 합니다.",
    "## 이런 경우에는 구조맵이 더 필요합니다",
    "첫째, AI 요약은 받았지만 나중에 다시 보니 어떤 근거에서 나온 말인지 기억나지 않을 때입니다. 둘째, 논문 여러 편을 읽었는데 각 논문의 차이점과 공통점이 섞여버릴 때입니다. 셋째, 발표나 보고서에 쓰려고 보니 요약문은 있는데 내가 설명할 수 있는 구조가 없을 때입니다.",
    "넷째, NotebookLM이나 ChatGPT에서 나온 답변을 여러 번 복사해두었지만 한 곳에서 누적 관리되지 않을 때입니다. 도구를 많이 쓰는 것보다 중요한 것은 결과를 한 흐름으로 정리하는 방식입니다.",
    "## 검토 체크리스트",
    `오늘 ${post.seo_keywords[0]}를 검토한다면 다음 네 가지를 확인해보세요. 이 자료의 핵심 질문은 무엇인가, AI가 만든 결론은 원문 근거와 연결되어 있는가, 방법론과 한계가 빠지지 않았는가, 내 글쓰기나 발표에 실제로 쓸 수 있는 구조로 남아 있는가.`,
    "이 네 가지가 보이지 않으면 요약은 있어도 정리는 아직 끝난 것이 아닙니다. Brify에서 구조맵으로 바꾸면 빠른 이해 이후의 검토, 비교, 재사용 단계까지 이어갈 수 있습니다.",
    "## 마무리",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    slug: "notebooklm-alternative-checklist",
    title: "NotebookLM 대안을 찾는다면 무엇을 먼저 봐야 할까",
    excerpt:
      "NotebookLM 대안을 찾을 때 요약 품질뿐 아니라 구조 편집, 원문 근거 확인, 여러 자료 관리, 재사용 흐름을 확인해야 합니다.",
    seo_keywords: ["NotebookLM 대안", "NotebookLM alternative", "NotebookLM 비슷한 서비스", "AI 논문 정리 도구", ...commonKeywords],
    intro:
      "NotebookLM 대안을 찾는다는 것은 단순히 비슷한 기능을 가진 서비스를 찾는 일이 아닙니다. 이미 NotebookLM을 써봤거나 들어본 사용자는 보통 더 빠른 요약보다, 내가 가진 자료를 어떤 방식으로 정리하고 다시 쓸 수 있는지를 궁금해합니다.",
    sections: [
      { heading: "NotebookLM 대안을 찾는 이유", paragraphs: ["NotebookLM은 자료를 넣고 질문하며 빠르게 이해하는 데 유용합니다.", "하지만 사용자가 직접 구조를 손보고, 여러 자료를 같은 기준으로 비교하고, 나중에 다시 활용해야 한다면 다른 방식의 도구가 필요할 수 있습니다."] },
      { heading: "빠른 이해와 구조 관리의 차이", paragraphs: ["빠른 이해는 지금 당장 내용을 파악하는 데 초점이 있습니다.", "구조 관리는 그 내용을 나중에 보고서, 발표, 문헌리뷰, 과제, 연구 노트로 다시 쓰는 데 초점이 있습니다."] },
      { heading: "원문 근거를 다시 확인할 수 있는가", paragraphs: ["논문이나 전문 문서는 요약문만으로 충분하지 않습니다.", "어떤 주장에 어떤 근거가 붙어 있는지, 원문에서 다시 확인할 수 있는 흐름이 있어야 안전하게 사용할 수 있습니다."] },
      { heading: "여러 자료를 비교하고 재사용할 수 있는가", paragraphs: ["한 문서를 이해하는 것과 여러 문서를 같은 기준으로 비교하는 것은 다른 문제입니다.", "대안 도구를 볼 때는 요약 품질뿐 아니라 자료를 누적하고 비교하는 구조도 봐야 합니다."] },
      { heading: "Brify가 맞는 경우와 맞지 않는 경우", paragraphs: ["빠르게 질문하고 답을 얻는 것이 목적이라면 NotebookLM이 충분할 수 있습니다.", "하지만 사용자가 구조를 직접 편집하고, 근거와 한계를 남기고, 나중에 다시 쓰고 싶다면 Brify 같은 구조맵 방식이 더 잘 맞습니다."] },
    ],
    closing:
      "NotebookLM 대안은 더 많은 기능보다 나에게 맞는 정리 방식을 찾는 문제입니다. Brify에서 요약 이후의 구조화와 재사용 흐름을 확인해보세요.",
  },
  {
    slug: "notebooklm-vs-brify",
    title: "NotebookLM과 Brify는 무엇이 다를까",
    excerpt:
      "NotebookLM과 Brify의 차이를 빠른 이해, 구조 편집, 원문 확인, 논문 정리, 문서 재사용 관점에서 비교합니다.",
    seo_keywords: ["NotebookLM Brify 비교", "NotebookLM 대안", "NotebookLM 비교", "AI 노트 도구 비교", ...commonKeywords],
    intro:
      "NotebookLM과 Brify는 모두 긴 자료를 다룰 때 도움이 될 수 있지만, 중심 목적은 다릅니다. NotebookLM이 자료를 빠르게 이해하고 질문하는 흐름에 강하다면, Brify는 사용자가 자료의 구조를 직접 관리하고 다시 쓰는 흐름에 초점을 둡니다.",
    sections: [
      { heading: "NotebookLM이 잘하는 일", paragraphs: ["NotebookLM은 업로드한 자료를 기반으로 질문하고 답을 얻는 데 유용합니다.", "낯선 문서나 논문의 큰 흐름을 빠르게 파악하고 싶을 때 도움이 됩니다."] },
      { heading: "Brify가 집중하는 일", paragraphs: ["Brify는 답변을 받는 것보다 자료를 구조맵으로 남기는 일에 집중합니다.", "핵심 질문, 주장, 근거, 예시, 한계, 다음 행동을 사용자가 볼 수 있는 구조로 정리합니다."] },
      { heading: "요약과 질의응답만으로 부족한 순간", paragraphs: ["요약과 질의응답은 빠르지만, 나중에 다시 보려면 정보가 흩어질 수 있습니다.", "특히 여러 논문이나 긴 보고서를 다룰 때는 답변보다 구조가 더 오래 남아야 합니다."] },
      { heading: "구조맵이 필요한 연구와 업무 상황", paragraphs: ["문헌리뷰, 논문 비교, 보고서 작성, 발표 준비처럼 자료를 재사용해야 하는 일에는 구조맵이 유리합니다.", "단순히 이해하는 것에서 끝나지 않고, 근거를 추적하고 내 작업에 연결해야 하기 때문입니다."] },
      { heading: "두 도구를 함께 쓰는 방법", paragraphs: ["NotebookLM으로 자료의 큰 흐름을 먼저 파악하고, Brify에서 그 내용을 구조맵으로 다시 정리할 수 있습니다.", "이렇게 하면 빠른 이해와 장기적인 자료 관리 흐름을 함께 가져갈 수 있습니다."] },
    ],
    closing:
      "NotebookLM과 Brify는 경쟁만 하는 도구가 아니라 서로 다른 단계에 맞는 도구입니다. Brify는 이해한 내용을 오래 관리할 수 있는 구조로 바꾸는 데 강합니다.",
  },
  {
    slug: "chatgpt-paper-summary-limitations",
    title: "ChatGPT 논문 요약의 한계는 어디에서 생길까",
    excerpt:
      "ChatGPT 논문 요약의 한계는 원문 근거 누락, 방법론 축약, 조건 생략, 결론 과장에서 생깁니다. 검토 기준을 설명합니다.",
    seo_keywords: ["ChatGPT 논문 요약 한계", "ChatGPT 논문 요약 오류", "AI 논문 요약 한계", "논문 요약 검토", ...commonKeywords],
    intro:
      "ChatGPT로 논문을 요약하면 빠르게 전체 흐름을 볼 수 있습니다. 하지만 논문 요약에서 중요한 것은 문장이 자연스러운지가 아니라, 연구 질문과 방법론, 결과, 한계가 정확하게 남아 있는지입니다.",
    sections: [
      { heading: "ChatGPT 논문 요약이 편리한 이유", paragraphs: ["긴 논문을 짧게 읽을 수 있고, 낯선 분야의 큰 흐름을 빨리 파악할 수 있습니다.", "처음 읽기 전 방향을 잡는 용도로는 분명히 도움이 됩니다."] },
      { heading: "원문 근거가 사라지는 문제", paragraphs: ["요약문만 보면 어떤 문장이 원문의 어느 부분에서 나온 것인지 알기 어렵습니다.", "논문을 인용하거나 보고서에 쓰려면 원문 근거를 다시 확인할 수 있어야 합니다."] },
      { heading: "방법론과 실험 조건이 축약되는 문제", paragraphs: ["ChatGPT는 방법론의 세부 조건을 짧게 줄이면서 중요한 제한을 생략할 수 있습니다.", "하지만 논문에서는 어떤 데이터와 조건에서 결과가 나왔는지가 결론만큼 중요합니다."] },
      { heading: "결론이 더 강하게 보이는 문제", paragraphs: ["AI 요약은 조심스러운 표현을 더 단정적으로 바꿀 수 있습니다.", "가능성, 경향, 제한된 결과가 확정적인 결론처럼 보이면 위험합니다."] },
      { heading: "Brify로 요약을 구조맵으로 검토하기", paragraphs: ["Brify에서는 ChatGPT 요약을 연구 질문, 근거, 방법론, 결과, 한계로 다시 나눌 수 있습니다.", "요약을 읽기 좋은 문장으로 끝내지 않고 검토 가능한 구조로 바꾸는 것이 핵심입니다."] },
    ],
    closing:
      "ChatGPT 논문 요약의 한계는 요약이 짧다는 데 있지 않습니다. 구조와 근거가 사라질 수 있다는 점이 핵심입니다.",
  },
  {
    slug: "check-chatgpt-paper-summary",
    title: "ChatGPT로 논문을 요약한 뒤 반드시 해야 할 검토",
    excerpt:
      "ChatGPT로 논문을 요약한 뒤 연구 질문, 방법론, 결과, 한계, 원문 근거를 어떤 순서로 검토해야 하는지 정리합니다.",
    seo_keywords: ["ChatGPT 논문 요약 검토", "ChatGPT 논문 요약 확인", "AI 논문 요약 검증", "논문 요약 체크리스트", ...commonKeywords],
    intro:
      "ChatGPT로 논문 요약을 받은 뒤 바로 저장하거나 제출 자료에 넣으면 위험할 수 있습니다. 요약은 초안이고, 논문은 검토가 필요한 자료입니다. 최소한 연구 질문, 방법론, 결과, 한계, 원문 근거는 따로 확인해야 합니다.",
    sections: [
      { heading: "먼저 연구 질문이 맞는지 확인하기", paragraphs: ["논문 요약에서 가장 먼저 볼 것은 이 논문이 무엇을 묻고 있는지입니다.", "연구 질문이 틀리게 잡히면 이후의 방법론과 결과 해석도 흔들립니다."] },
      { heading: "방법론과 데이터 조건 확인하기", paragraphs: ["데이터 규모, 대상, 실험 조건, 분석 방법은 논문의 결론을 제한합니다.", "요약문이 이 부분을 너무 짧게 처리했다면 원문으로 돌아가 확인해야 합니다."] },
      { heading: "결과와 해석을 분리하기", paragraphs: ["논문의 결과와 저자의 해석은 구분해야 합니다.", "AI 요약은 이 둘을 하나의 결론처럼 합쳐버릴 수 있으므로, 실제 수치와 해석 문장을 따로 봐야 합니다."] },
      { heading: "한계와 후속 연구가 빠지지 않았는지 보기", paragraphs: ["좋은 논문 요약은 장점뿐 아니라 한계도 남깁니다.", "한계가 빠진 요약은 실제보다 강한 주장처럼 보일 수 있습니다."] },
      { heading: "Brify에서 검토 항목을 구조맵으로 남기기", paragraphs: ["Brify에 검토 항목을 노드로 남기면 논문마다 같은 기준으로 확인할 수 있습니다.", "이 방식은 논문을 여러 편 읽을수록 더 유용합니다."] },
    ],
    closing:
      "ChatGPT 요약은 빠른 시작점입니다. 하지만 논문을 제대로 쓰려면 Brify에서 검토 가능한 구조로 다시 정리하는 과정이 필요합니다.",
  },
  {
    slug: "using-chatgpt-paper-summary-for-reports",
    title: "ChatGPT 논문 요약을 그대로 과제나 보고서에 쓰면 위험한 이유",
    excerpt:
      "ChatGPT 논문 요약을 과제나 보고서에 사용할 때는 출처, 근거, 해석, 인용 가능성을 반드시 따로 확인해야 합니다.",
    seo_keywords: ["ChatGPT 논문 요약 과제", "AI 논문 요약 과제", "논문 요약 보고서", "ChatGPT 리포트 한계", ...commonKeywords],
    intro:
      "ChatGPT가 만든 논문 요약은 매끄럽게 보일 수 있습니다. 하지만 과제, 보고서, 발표 자료에 그대로 쓰기에는 위험합니다. 평가받는 것은 AI가 만든 문장이 아니라, 내가 논문을 이해하고 근거를 확인했는지이기 때문입니다.",
    sections: [
      { heading: "과제에서 AI 요약이 문제가 되는 지점", paragraphs: ["요약문이 자연스럽더라도 출처와 근거가 분명하지 않으면 과제 자료로 쓰기 어렵습니다.", "특히 논문 과제에서는 어떤 주장에 어떤 인용이 붙는지가 중요합니다."] },
      { heading: "출처와 인용 가능성 확인하기", paragraphs: ["AI가 만든 문장을 그대로 인용할 수는 없습니다.", "논문 원문에서 실제로 해당 내용이 어디에 있는지 확인하고, 필요한 경우 직접 인용이나 재서술을 해야 합니다."] },
      { heading: "내 해석과 AI 문장을 분리하기", paragraphs: ["보고서에는 논문 내용뿐 아니라 내 해석이 들어갑니다.", "AI 요약과 내 판단을 구분하지 않으면 글이 얕아지고, 질문을 받았을 때 설명하기 어려워집니다."] },
      { heading: "발표나 리포트용 구조로 다시 만들기", paragraphs: ["발표 자료는 논문 순서를 그대로 따라갈 필요가 없습니다.", "문제, 방법, 결과, 의미, 한계, 내 의견으로 다시 구성해야 듣는 사람이 이해하기 쉽습니다."] },
      { heading: "Brify로 제출 전 논문 구조 확인하기", paragraphs: ["Brify에서 논문 구조맵을 만들면 제출 전 핵심 주장과 근거, 인용 포인트를 한눈에 점검할 수 있습니다.", "요약문을 그대로 쓰는 대신 내가 설명할 수 있는 구조로 바꾸는 것이 중요합니다."] },
    ],
    closing:
      "ChatGPT 논문 요약은 과제의 재료가 될 수는 있지만, 과제 자체가 되어서는 안 됩니다. Brify로 이해와 근거를 먼저 구조화해보세요.",
  },
  {
    slug: "notebooklm-for-graduate-students-limitations",
    title: "대학원생에게 NotebookLM만으로 부족할 수 있는 순간",
    excerpt:
      "대학원생이 NotebookLM을 사용할 때 빠른 이해에는 도움이 되지만, 논문 비교, 근거 추적, 연구 공백 정리에는 추가 구조화가 필요할 수 있습니다.",
    seo_keywords: ["대학원생 NotebookLM", "대학원생 논문 정리 도구", "NotebookLM 논문 정리", "연구 노트 AI", ...commonKeywords],
    intro:
      "대학원생에게 논문 읽기는 단순한 이해가 아닙니다. 읽은 논문을 지도교수 미팅, 문헌리뷰, 연구계획서, 논문 작성에 다시 써야 합니다. 그래서 빠른 질의응답만으로는 부족한 순간이 생깁니다.",
    sections: [
      { heading: "대학원생이 NotebookLM을 찾는 이유", paragraphs: ["읽어야 할 논문이 많고 시간이 부족하기 때문입니다.", "처음 보는 논문의 핵심을 빠르게 파악하고 질문할 수 있다는 점은 분명 매력적입니다."] },
      { heading: "빠른 질의응답과 연구 노트의 차이", paragraphs: ["질의응답은 지금 궁금한 점을 해결합니다.", "연구 노트는 시간이 지나도 논문의 위치, 근거, 한계, 내 연구와의 연결을 남겨야 합니다."] },
      { heading: "여러 논문을 같은 기준으로 비교해야 하는 문제", paragraphs: ["대학원생은 한 편의 논문보다 여러 논문의 차이를 봐야 합니다.", "연구 질문, 방법론, 데이터, 결과, 한계를 같은 기준으로 정리하지 않으면 비교가 어려워집니다."] },
      { heading: "연구 공백과 내 연구 연결을 남기는 법", paragraphs: ["문헌리뷰에서 중요한 것은 논문 내용을 아는 것뿐 아니라 아직 풀리지 않은 질문을 찾는 것입니다.", "각 논문이 내 연구와 어떻게 연결되는지 구조로 남겨야 합니다."] },
      { heading: "Brify로 논문 비교 구조 만들기", paragraphs: ["Brify는 논문을 같은 틀로 정리하고 비교하는 구조맵을 만들기에 적합합니다.", "NotebookLM으로 빠르게 이해한 내용을 Brify에서 장기 연구 노트로 바꿀 수 있습니다."] },
    ],
    closing:
      "대학원생에게 필요한 것은 빠른 답변만이 아니라 누적되는 연구 구조입니다. Brify로 논문 비교와 연구 공백을 함께 남겨보세요.",
  },
  {
    slug: "structure-map-for-multiple-papers",
    title: "논문 여러 편을 읽을 때 ChatGPT보다 구조맵이 필요한 이유",
    excerpt:
      "논문 여러 편을 읽을 때는 개별 요약보다 연구 질문, 방법론, 결과, 한계, 차이를 같은 기준으로 구조화해야 합니다.",
    seo_keywords: ["ChatGPT 논문 여러 편 요약", "여러 논문 요약", "논문 비교 AI", "문헌리뷰 AI 도구", ...commonKeywords],
    intro:
      "논문 한 편을 요약하는 것과 논문 여러 편을 비교하는 것은 완전히 다른 일입니다. ChatGPT가 각 논문을 잘 요약해도, 여러 요약이 같은 기준으로 정리되지 않으면 문헌리뷰나 연구계획서에 쓰기 어렵습니다.",
    sections: [
      { heading: "여러 논문 요약이 금방 헷갈리는 이유", paragraphs: ["논문마다 용어, 연구 질문, 방법론, 결과 표현이 다릅니다.", "각 요약을 따로 저장하면 나중에 어떤 논문이 무엇을 말했는지 다시 비교해야 합니다."] },
      { heading: "논문마다 다른 기준으로 요약하면 생기는 문제", paragraphs: ["어떤 요약은 방법론이 자세하고, 어떤 요약은 결과 중심이면 비교가 어렵습니다.", "문헌리뷰에는 모든 논문을 같은 기준으로 보는 틀이 필요합니다."] },
      { heading: "연구 질문, 방법론, 결과를 같은 틀에 넣기", paragraphs: ["여러 논문을 읽을 때는 연구 질문, 대상, 방법, 결과, 한계를 동일한 노드로 나누는 것이 좋습니다.", "그래야 공통점과 차이점이 자연스럽게 보입니다."] },
      { heading: "차이점과 연구 공백을 따로 표시하기", paragraphs: ["논문 비교의 목적은 많이 읽었다는 증거가 아니라 다음 질문을 찾는 것입니다.", "차이점과 공백을 따로 표시해야 내 연구 주제로 이어질 수 있습니다."] },
      { heading: "Brify로 여러 논문 구조맵 만들기", paragraphs: ["Brify에서는 여러 논문을 같은 기준의 구조맵으로 정리할 수 있습니다.", "개별 요약 목록보다 비교와 재사용에 강한 형태로 남길 수 있습니다."] },
    ],
    closing:
      "논문 여러 편은 많이 요약하는 것보다 비교 가능한 구조로 남기는 것이 중요합니다. Brify에서 여러 논문을 한 흐름으로 정리해보세요.",
  },
  {
    slug: "ai-paper-summary-tool-for-notebooklm-alternative",
    title: "AI 논문 요약 도구를 고를 때 봐야 할 기준",
    excerpt:
      "AI 논문 요약 도구를 선택할 때 요약 품질, 원문 근거, 구조 편집, 여러 논문 비교, 내보내기 기능을 확인해야 합니다.",
    seo_keywords: ["AI 논문 요약 도구", "논문 요약 툴", "paper summarizer", "NotebookLM 대안", ...commonKeywords],
    intro:
      "AI 논문 요약 도구를 고를 때 많은 사람이 요약이 얼마나 짧고 자연스러운지만 봅니다. 하지만 논문은 정확성과 재사용성이 중요한 자료입니다. 좋은 도구는 요약뿐 아니라 검토와 구조화를 도와야 합니다.",
    sections: [
      { heading: "요약 품질만 보고 고르면 안 되는 이유", paragraphs: ["요약이 자연스럽다고 해서 논문을 정확히 이해한 것은 아닙니다.", "방법론, 한계, 근거가 빠졌다면 보기 좋은 요약도 실제로 쓰기 어렵습니다."] },
      { heading: "원문 근거와 섹션 추적이 가능한가", paragraphs: ["논문 요약에서는 원문으로 돌아갈 수 있는 흐름이 중요합니다.", "결론, 실험 조건, 한계가 어느 섹션에서 나왔는지 확인할 수 있어야 합니다."] },
      { heading: "사용자가 구조를 수정할 수 있는가", paragraphs: ["AI가 만든 요약이나 분류는 초안입니다.", "사용자가 연구 목적에 맞게 구조를 바꾸고 보완할 수 있어야 합니다."] },
      { heading: "여러 논문을 비교할 수 있는가", paragraphs: ["논문을 한 편만 읽는 경우보다 여러 편을 비교하는 경우가 많습니다.", "도구가 여러 논문을 같은 기준으로 정리할 수 있는지도 확인해야 합니다."] },
      { heading: "Brify가 논문 구조화에 맞는 이유", paragraphs: ["Brify는 요약문보다 구조맵을 중심에 둡니다.", "연구 질문, 방법론, 결과, 한계, 내 활용 목적을 한눈에 볼 수 있게 정리하는 데 맞습니다."] },
    ],
    closing:
      "AI 논문 요약 도구는 빠른 요약보다 검토 가능한 구조를 남겨야 합니다. Brify에서 요약 이후의 연구 흐름까지 정리해보세요.",
  },
  {
    slug: "notebooklm-chatgpt-paper-workflow",
    title: "NotebookLM과 ChatGPT를 함께 써도 정리가 안 되는 이유",
    excerpt:
      "NotebookLM과 ChatGPT를 함께 써도 논문 정리가 어려운 이유는 요약과 답변이 흩어지고, 구조가 누적되지 않기 때문입니다.",
    seo_keywords: ["NotebookLM ChatGPT 논문 정리", "NotebookLM ChatGPT 비교", "AI 논문 정리 워크플로우", "연구 자료 정리", ...commonKeywords],
    intro:
      "NotebookLM과 ChatGPT를 함께 쓰면 더 강력할 것 같지만, 실제로는 자료가 더 흩어질 수도 있습니다. 한쪽에서는 질문 답변을 받고, 다른 쪽에서는 요약을 만들고, 결과를 따로 저장하면 연구 구조가 누적되지 않습니다.",
    sections: [
      { heading: "NotebookLM과 ChatGPT를 함께 쓰는 이유", paragraphs: ["NotebookLM은 업로드한 자료 기반 질문에 유용하고, ChatGPT는 글쓰기와 재구성에 유용합니다.", "그래서 많은 사용자가 두 도구를 함께 쓰며 논문을 이해하려고 합니다."] },
      { heading: "요약과 답변이 흩어지는 문제", paragraphs: ["도구마다 생성한 답변을 복사해두면 나중에 어디에서 나온 내용인지 추적하기 어렵습니다.", "질문과 답변은 많아지지만 전체 구조는 오히려 흐려질 수 있습니다."] },
      { heading: "질문은 남지만 구조가 남지 않는 문제", paragraphs: ["AI에게 무엇을 물었는지는 남아도 논문 자체의 연구 질문, 방법론, 결과, 한계가 같은 틀로 남지 않을 수 있습니다.", "정리의 중심이 도구 대화가 아니라 자료 구조가 되어야 합니다."] },
      { heading: "AI 결과를 하나의 연구 구조로 합치기", paragraphs: ["NotebookLM 답변과 ChatGPT 요약을 모두 하나의 구조맵으로 옮기면 중복과 빠진 부분이 보입니다.", "이 과정에서 어떤 내용이 원문 근거가 있는지, 어떤 부분을 더 확인해야 하는지도 정리됩니다."] },
      { heading: "Brify를 구조화 허브로 쓰는 방법", paragraphs: ["Brify는 여러 AI 도구에서 나온 결과를 연구 질문, 근거, 한계, 내 활용 목적 중심으로 다시 정리하는 허브가 될 수 있습니다.", "도구별 답변을 쌓는 대신 하나의 구조로 모으는 것이 핵심입니다."] },
    ],
    closing:
      "AI 도구를 많이 쓰는 것보다 중요한 것은 결과를 한 구조로 관리하는 일입니다. Brify를 연구 자료 정리의 중심에 두어보세요.",
  },
  {
    slug: "organize-ai-paper-summaries",
    title: "AI가 논문을 요약해도 정리가 안 되는 사람을 위한 방법",
    excerpt:
      "AI가 논문을 요약해도 정리가 안 된다면 요약문을 연구 질문, 방법론, 결과, 근거, 한계, 내 활용 목적에 맞게 다시 구조화해야 합니다.",
    seo_keywords: ["AI 논문 요약 정리", "논문 요약 후 정리", "AI 요약 정리법", "논문 구조화 도구", ...commonKeywords],
    intro:
      "AI가 논문을 요약해줬는데도 머릿속에 정리가 되지 않는다면 이상한 일이 아닙니다. 요약은 정보를 줄여주지만, 내가 그 정보를 어디에 쓰고 어떻게 비교할지까지 자동으로 해결해주지는 않습니다.",
    sections: [
      { heading: "AI 요약이 있는데도 정리가 안 되는 이유", paragraphs: ["요약문은 보통 읽기 좋게 이어진 문장입니다.", "하지만 연구 질문, 근거, 방법론, 결과, 한계가 한눈에 나뉘어 보이지 않으면 실제 작업에 쓰기 어렵습니다."] },
      { heading: "요약문을 연구 질문 중심으로 다시 나누기", paragraphs: ["먼저 논문이 답하려는 질문을 중심에 둡니다.", "그다음 요약문 속 내용을 질문, 방법, 결과, 한계로 다시 분해해야 합니다."] },
      { heading: "방법론, 결과, 한계를 따로 배치하기", paragraphs: ["방법론은 결과가 어떤 조건에서 나온 것인지 알려줍니다.", "한계는 결과를 어디까지 믿고 사용할 수 있는지 알려줍니다. 이 둘이 빠지면 요약은 너무 낙관적으로 보일 수 있습니다."] },
      { heading: "내 글쓰기나 발표 목적과 연결하기", paragraphs: ["논문 요약은 결국 내 작업에 쓰기 위해 남기는 것입니다.", "발표에 쓸 내용, 보고서에 인용할 근거, 더 확인할 질문을 따로 표시해야 합니다."] },
      { heading: "Brify로 AI 요약을 연구 구조맵으로 바꾸기", paragraphs: ["Brify에서는 AI 요약을 연구 질문, 근거, 한계, 활용 목적 중심으로 다시 정리할 수 있습니다.", "요약문을 쌓아두는 대신 실제로 사용할 수 있는 구조로 바꿔보세요."] },
    ],
    closing:
      "AI 요약 이후에 필요한 일은 더 많은 요약이 아니라 더 좋은 구조입니다. Brify에서 논문 요약을 연구 구조맵으로 바꿔보세요.",
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
