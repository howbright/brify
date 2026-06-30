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

const commonKeywords = ["유튜브 요약", "강의 영상 정리", "유튜브 영상 요약", "AI 영상 요약", "AI 구조맵", "Brify"];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## 실제로 적용하는 순서",
    `${post.title}를 실제로 하려면 먼저 영상을 처음부터 끝까지 다 보겠다는 생각을 내려놓는 것이 좋습니다. 영상은 시간 순서로 흘러가지만, 우리가 나중에 다시 쓰는 정보는 주제, 질문, 개념, 예시, 결론 단위로 남아야 합니다.`,
    "첫째, 이 영상을 왜 정리하려는지 정합니다. 공부인지, 업무 참고인지, 발표 준비인지, 단순한 빠른 이해인지에 따라 남겨야 할 정보가 달라집니다. 둘째, 제목과 설명, 챕터, 자막을 훑어 영상이 답하려는 질문을 찾습니다. 셋째, 핵심 주장이나 개념, 근거, 예시, 다시 볼 구간을 분리합니다.",
    "넷째, 영상에서 나온 말을 그대로 길게 옮기기보다 나중에 찾을 수 있는 구조로 바꿉니다. 특히 긴 영상이나 강의 영상은 핵심 개념, 예시, 질문, 체크리스트를 나누어야 복습이나 재사용이 쉬워집니다.",
    "## Brify에 넣을 때의 구조 예시",
    `Brify에서 ${post.seo_keywords[0]} 작업을 할 때는 큰 노드를 '영상 목적', '핵심 질문', '주요 개념', '중요 예시', '다시 볼 구간', '확인할 내용', '다음 행동'으로 나누어볼 수 있습니다.`,
    "이렇게 정리하면 영상이 단순히 짧은 요약문으로 사라지지 않습니다. 어떤 내용이 핵심이고, 어떤 예시가 그 핵심을 설명하며, 어떤 부분을 다시 봐야 하는지 구조로 남습니다. 유튜브 영상이나 강의 영상은 나중에 다시 찾기 어려운 경우가 많기 때문에 이 구조가 특히 중요합니다.",
    "AI 요약을 사용할 때도 구조맵은 필요합니다. AI가 만든 문장이 자연스러워도 자막 오류, 맥락 누락, 과장된 결론, 빠진 예시가 있을 수 있습니다. Brify에서는 요약 결과와 확인해야 할 부분을 분리해둘 수 있습니다.",
    "## 흔히 생기는 실수",
    "가장 흔한 실수는 영상 내용을 한 문단으로만 줄이는 것입니다. 빠르게 훑어보기에는 좋지만, 나중에 다시 공부하거나 보고 자료로 쓰려면 구체적인 근거와 구간을 다시 찾아야 합니다.",
    "두 번째 실수는 자막을 그대로 믿는 것입니다. 자동 자막은 말의 흐름을 텍스트로 바꾸는 데 도움이 되지만, 고유명사, 전문 용어, 화자 전환, 문맥을 틀릴 수 있습니다. 자막 요약은 반드시 핵심 구간과 함께 검토해야 합니다.",
    "세 번째 실수는 강의 영상과 일반 영상을 같은 방식으로 정리하는 것입니다. 강의 영상은 개념, 정의, 예시, 문제 풀이, 복습 질문이 중요하고, 일반 유튜브 영상은 주장, 사례, 결론, 참고할 구간이 더 중요할 수 있습니다.",
    "## 오늘 바로 해볼 일",
    `오늘 ${post.seo_keywords[0]}를 시작한다면 영상 하나를 고르고 먼저 세 가지만 적어보세요. 이 영상은 어떤 질문에 답하는가, 나중에 다시 봐야 할 구간은 어디인가, 내 작업이나 공부에 실제로 쓸 내용은 무엇인가.`,
    "그다음 Brify에 핵심 질문을 중심 노드로 두고 개념, 예시, 근거, 다시 볼 구간을 연결해보세요. 전체 영상을 완벽하게 정리하지 않아도 됩니다. 중요한 것은 다음에 다시 열었을 때 바로 맥락을 회복할 수 있는 구조를 남기는 것입니다.",
    "영상 정리는 많이 저장하는 일이 아니라 다시 찾을 수 있게 만드는 일입니다. 작은 구조맵 하나가 긴 영상 하나를 훨씬 오래 쓸 수 있는 자료로 바꿉니다.",
    "## 마무리",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    slug: "how-to-summarize-youtube-videos",
    title: "유튜브 영상을 빠르게 요약하는 방법",
    excerpt: "유튜브 영상을 빠르게 요약할 때 제목, 자막, 핵심 주장, 예시, 결론을 어떤 순서로 정리해야 하는지 설명합니다.",
    seo_keywords: ["유튜브 요약", "유튜브 영상 요약", "유튜브 내용 정리", "유튜브 요약 AI", ...commonKeywords],
    intro: "유튜브 영상을 볼 시간은 부족한데 내용은 알고 싶을 때가 많습니다. 이때 필요한 것은 무작정 짧은 요약이 아니라, 영상이 말하려는 핵심 주장과 근거를 빠르게 잡는 정리 방식입니다.",
    sections: [
      { heading: "유튜브 요약이 필요한 순간", paragraphs: ["저장해둔 영상은 많은데 실제로 끝까지 보는 영상은 많지 않습니다.", "업무 참고, 공부, 아이디어 탐색, 제품 비교처럼 목적이 있을 때는 전체 시청보다 핵심 파악이 먼저 필요합니다."] },
      { heading: "제목과 설명만으로 부족한 이유", paragraphs: ["제목과 썸네일은 관심을 끌기 위한 표현일 때가 많습니다.", "영상의 실제 결론이나 근거는 중간 설명, 예시, 마지막 정리 부분에 흩어져 있을 수 있습니다."] },
      { heading: "자막에서 핵심 흐름 찾기", paragraphs: ["자막은 유튜브 요약의 좋은 출발점입니다.", "다만 모든 문장을 같은 무게로 보면 안 되고, 반복되는 키워드와 전환 표현을 중심으로 흐름을 잡아야 합니다."] },
      { heading: "주장, 근거, 예시를 분리하기", paragraphs: ["영상 요약에서 가장 중요한 것은 말한 내용을 모두 적는 것이 아니라 주장과 근거를 분리하는 것입니다.", "예시는 이해를 돕지만 결론 자체는 아니므로 따로 표시해야 나중에 활용하기 쉽습니다."] },
      { heading: "Brify로 영상 요약 구조맵 만들기", paragraphs: ["Brify에서는 영상의 핵심 질문, 주장, 근거, 예시, 다시 볼 구간을 구조맵으로 나눌 수 있습니다.", "짧은 요약문보다 구조맵이 나중에 다시 찾고 설명하기 쉽습니다."] },
    ],
    closing: "유튜브 요약은 시간을 줄이는 일이지만, 핵심 구조를 잃으면 의미가 약해집니다. Brify로 영상의 주장과 근거를 함께 남겨보세요.",
  },
  {
    slug: "summarize-long-youtube-videos",
    title: "긴 유튜브 영상을 핵심만 정리하는 법",
    excerpt: "긴 유튜브 영상을 요약할 때 전체 흐름, 챕터, 반복되는 주장, 중요한 예시, 결론을 구분하는 방법을 소개합니다.",
    seo_keywords: ["유튜브 영상 요약", "긴 유튜브 요약", "긴 영상 요약", "유튜브 핵심 정리", ...commonKeywords],
    intro: "30분, 1시간, 2시간짜리 유튜브 영상은 처음부터 끝까지 보기 어렵습니다. 긴 영상은 바로 요약하기보다 먼저 구간을 나누고, 필요한 정보와 반복되는 설명을 구분해야 합니다.",
    sections: [
      { heading: "긴 영상이 요약하기 어려운 이유", paragraphs: ["긴 영상은 정보가 많아서가 아니라 핵심과 배경이 섞여 있어서 어렵습니다.", "잡담, 사례, 반복 설명, 핵심 결론이 같은 흐름 안에 들어가면 무엇을 남겨야 할지 흐려집니다."] },
      { heading: "먼저 구간을 나누어야 하는 이유", paragraphs: ["긴 영상은 전체를 하나로 요약하면 중요한 차이가 사라집니다.", "도입, 문제 제기, 설명, 예시, 결론처럼 구간을 나누면 핵심이 훨씬 잘 보입니다."] },
      { heading: "반복되는 주장과 새 정보를 구분하기", paragraphs: ["긴 영상에서는 같은 주장이 여러 표현으로 반복될 수 있습니다.", "반복은 핵심 신호일 수 있지만, 새 정보와 구분하지 않으면 요약이 불필요하게 길어집니다."] },
      { heading: "중요한 예시와 배경 이야기 분리하기", paragraphs: ["예시는 이해를 돕지만 모든 예시가 같은 중요도를 갖지는 않습니다.", "핵심 개념을 설명하는 예시와 분위기 전환용 이야기를 나누어야 합니다."] },
      { heading: "Brify로 긴 영상의 흐름 정리하기", paragraphs: ["Brify 구조맵에 영상 구간을 나누어두면 다시 볼 부분과 건너뛸 부분이 선명해집니다.", "긴 영상일수록 한 문단 요약보다 구간별 구조가 더 유용합니다."] },
    ],
    closing: "긴 유튜브 영상은 짧게 줄이기 전에 나누어야 합니다. Brify에서 핵심 구간과 다시 볼 구간을 구조로 남겨보세요.",
  },
  {
    slug: "organize-lecture-videos-into-notes",
    title: "강의 영상을 공부 노트로 정리하는 방법",
    excerpt: "강의 영상을 공부 노트로 정리할 때 핵심 개념, 정의, 예시, 공식, 질문, 복습 포인트를 나누는 방법을 설명합니다.",
    seo_keywords: ["강의 영상 정리", "강의 노트 정리", "온라인 강의 정리", "강의 영상 요약", ...commonKeywords],
    intro: "강의 영상은 일반 유튜브 영상과 다르게 복습과 이해가 목적입니다. 그래서 내용을 짧게 줄이는 것보다 핵심 개념, 예시, 질문을 나누어 공부 노트로 만드는 것이 중요합니다.",
    sections: [
      { heading: "강의 영상과 일반 유튜브 영상의 차이", paragraphs: ["일반 영상은 핵심 주장과 결론만 알아도 충분할 때가 많습니다.", "하지만 강의 영상은 개념의 순서, 정의, 예시, 적용 방법까지 남겨야 나중에 복습할 수 있습니다."] },
      { heading: "핵심 개념과 예시를 분리하기", paragraphs: ["강의에서는 개념 설명과 예시가 섞여 나옵니다.", "노트에는 개념을 먼저 적고, 그 개념을 설명하는 예시를 아래에 연결하는 방식이 좋습니다."] },
      { heading: "정의, 공식, 절차를 따로 표시하기", paragraphs: ["정의나 공식, 절차는 나중에 바로 찾아야 하는 정보입니다.", "본문 설명 속에 묻히지 않게 별도 노드나 체크 항목으로 남기는 것이 좋습니다."] },
      { heading: "이해 안 된 부분을 질문으로 남기기", paragraphs: ["강의 노트는 이해한 내용만 적는 곳이 아닙니다.", "모호한 부분을 질문으로 남기면 다음 복습이나 질문 준비가 훨씬 쉬워집니다."] },
      { heading: "Brify로 강의 노트 구조 만들기", paragraphs: ["Brify에서는 강의 목표, 핵심 개념, 예시, 질문, 복습 포인트를 구조맵으로 연결할 수 있습니다.", "영상 전체를 다시 보지 않아도 학습 흐름을 회복할 수 있습니다."] },
    ],
    closing: "강의 영상 정리는 복습 가능한 구조를 만드는 일입니다. Brify로 개념과 예시, 질문을 연결해 공부 노트로 바꿔보세요.",
  },
  {
    slug: "summarize-youtube-lectures-for-review",
    title: "유튜브 강의를 복습하기 쉽게 요약하는 법",
    excerpt: "유튜브 강의를 복습하기 위해 강의 목표, 개념 흐름, 예시, 연습 문제, 헷갈리는 부분을 구조화하는 방법을 소개합니다.",
    seo_keywords: ["유튜브 강의 요약", "강의 영상 복습", "유튜브 강의 정리", "강의 요약 노트", ...commonKeywords],
    intro: "유튜브 강의는 무료로 좋은 자료가 많지만, 저장만 해두면 복습 자료가 되지 않습니다. 복습하기 좋은 요약은 강의의 순서와 개념 관계를 함께 남겨야 합니다.",
    sections: [
      { heading: "복습용 요약은 무엇이 달라야 할까", paragraphs: ["빠른 이해용 요약은 결론만 알아도 됩니다.", "복습용 요약은 다음에 다시 봤을 때 개념을 떠올리고 문제에 적용할 수 있어야 합니다."] },
      { heading: "강의 목표와 핵심 개념 찾기", paragraphs: ["먼저 강의가 끝났을 때 무엇을 이해해야 하는지 적어야 합니다.", "그 다음 목표를 이루는 데 필요한 핵심 개념을 순서대로 배치합니다."] },
      { heading: "예시와 설명을 연결하기", paragraphs: ["좋은 강의는 예시를 통해 개념을 이해시키지만, 예시만 남기면 원리가 흐려집니다.", "예시는 반드시 어떤 개념을 설명하는지 연결해두어야 합니다."] },
      { heading: "헷갈리는 부분을 표시하는 법", paragraphs: ["복습할 때 가장 중요한 부분은 이미 아는 내용이 아니라 헷갈리는 내용입니다.", "이해가 부족한 구간, 다시 볼 타임스탬프, 질문을 따로 남겨두세요."] },
      { heading: "Brify로 복습 가능한 강의 맵 만들기", paragraphs: ["Brify 구조맵은 강의 목표, 개념 흐름, 예시, 질문을 한눈에 연결합니다.", "복습할 때 전체 영상을 다시 보지 않고도 약한 부분부터 확인할 수 있습니다."] },
    ],
    closing: "유튜브 강의 요약은 복습할 때 다시 살아나야 합니다. Brify로 강의를 이해 가능한 구조로 남겨보세요.",
  },
  {
    slug: "why-structure-video-content",
    title: "영상 내용을 문서처럼 구조화해야 하는 이유",
    excerpt: "영상 내용을 단순 요약하지 않고 구조화해야 나중에 검색, 복습, 공유, 보고에 더 유리한 이유를 설명합니다.",
    seo_keywords: ["영상 내용 정리", "영상 구조화", "유튜브 내용 정리", "영상 요약 방법", ...commonKeywords],
    intro: "영상은 시간 순서로 흘러가지만, 우리가 나중에 활용하는 방식은 시간 순서가 아닙니다. 필요한 것은 몇 분 몇 초에 있었던 말보다, 어떤 주제와 어떤 근거가 연결되는지입니다.",
    sections: [
      { heading: "영상은 왜 다시 찾기 어려운가", paragraphs: ["문서는 검색과 훑어보기가 쉽지만 영상은 특정 내용을 다시 찾기 어렵습니다.", "기억나는 표현이 정확하지 않으면 원하는 구간을 찾는 데 시간이 오래 걸립니다."] },
      { heading: "시간 순서 요약의 한계", paragraphs: ["시간 순서로만 정리하면 영상의 흐름은 보이지만 주제 간 관계가 약합니다.", "나중에 활용할 때는 주제, 주장, 예시, 결론 중심으로 재배치해야 합니다."] },
      { heading: "주제, 주장, 예시로 다시 배치하기", paragraphs: ["영상 속 발언을 주제별로 묶으면 정보가 문서처럼 다루어집니다.", "같은 주장을 설명하는 예시와 반론을 가까이 두면 이해가 훨씬 쉬워집니다."] },
      { heading: "문서처럼 검색 가능한 구조 만들기", paragraphs: ["영상 내용을 키워드, 질문, 구간, 활용 목적과 함께 남기면 나중에 검색하기 좋습니다.", "단순 저장 목록보다 구조화된 노트가 더 오래 쓰입니다."] },
      { heading: "Brify로 영상 내용을 구조화하기", paragraphs: ["Brify는 영상 내용을 한 줄 요약이 아니라 구조맵으로 남기기에 적합합니다.", "주제와 관계가 보이면 공유, 복습, 보고 자료로 바꾸기 쉬워집니다."] },
    ],
    closing: "영상은 흘러가지만 지식은 구조로 남아야 합니다. Brify에서 영상 내용을 다시 찾을 수 있는 구조로 바꿔보세요.",
  },
  {
    slug: "check-ai-youtube-summaries",
    title: "AI로 유튜브 요약할 때 확인해야 할 것들",
    excerpt: "AI 유튜브 요약 결과를 사용할 때 자막 오류, 빠진 맥락, 과장된 결론, 예시 누락을 어떻게 검토해야 하는지 설명합니다.",
    seo_keywords: ["유튜브 요약 AI", "AI 유튜브 요약", "유튜브 요약 도구", "영상 요약 AI", ...commonKeywords],
    intro: "AI 유튜브 요약은 빠릅니다. 하지만 빠르다는 이유만으로 그대로 믿으면 자막 오류, 맥락 누락, 예시 생략, 과장된 결론을 놓칠 수 있습니다.",
    sections: [
      { heading: "AI 유튜브 요약이 잘하는 일", paragraphs: ["AI는 긴 자막에서 반복되는 주제와 핵심 흐름을 빠르게 잡는 데 도움이 됩니다.", "전체 영상을 보기 전에 대략적인 방향을 파악하는 용도로는 매우 유용합니다."] },
      { heading: "자막 오류가 요약에 미치는 영향", paragraphs: ["AI 요약은 자막을 재료로 삼는 경우가 많습니다.", "자동 자막이 전문 용어, 이름, 숫자를 잘못 인식하면 요약도 그 오류를 따라갈 수 있습니다."] },
      { heading: "맥락과 농담, 예시가 빠지는 문제", paragraphs: ["영상에서는 말투, 맥락, 농담, 화면 자료가 의미를 보충합니다.", "텍스트 요약만 보면 중요한 분위기나 예시가 빠질 수 있습니다."] },
      { heading: "결론이 과장됐는지 확인하기", paragraphs: ["AI는 조심스러운 표현을 더 단정적으로 바꿀 수 있습니다.", "영상 속 발언이 실제로 그렇게 강한 주장인지 확인해야 합니다."] },
      { heading: "Brify로 AI 요약 검토하기", paragraphs: ["Brify에서는 AI 요약, 확인할 자막 구간, 중요한 예시를 나누어 정리할 수 있습니다.", "요약을 바로 믿기보다 구조적으로 검토하는 흐름이 안전합니다."] },
    ],
    closing: "AI 유튜브 요약은 좋은 출발점이지만 최종 정리는 아닙니다. Brify에서 요약과 확인할 구간을 함께 남겨보세요.",
  },
  {
    slug: "extract-key-concepts-from-lecture-videos",
    title: "강의 영상에서 핵심 개념과 예시를 분리하는 법",
    excerpt: "강의 영상에서 핵심 개념, 정의, 예시, 반례, 적용 방법을 분리해 공부 노트로 정리하는 방법을 소개합니다.",
    seo_keywords: ["강의 노트 정리", "강의 영상 핵심 정리", "개념 정리", "공부 노트 만들기", ...commonKeywords],
    intro: "강의 영상을 보고 나면 많이 들은 것 같은데 정작 설명하려 하면 막힐 때가 있습니다. 대개 개념, 예시, 반례, 적용 방법이 한 덩어리로 섞여 있기 때문입니다.",
    sections: [
      { heading: "강의 노트가 길어지기만 하는 이유", paragraphs: ["들은 말을 거의 그대로 적으면 노트는 길어지지만 이해는 깊어지지 않습니다.", "핵심 개념과 보조 설명을 구분하지 않으면 나중에 무엇을 외우고 이해해야 하는지 흐려집니다."] },
      { heading: "핵심 개념과 보조 설명 구분하기", paragraphs: ["핵심 개념은 다른 내용을 이해하는 기준이 되는 말입니다.", "보조 설명은 그 개념을 쉽게 이해하도록 돕는 배경이나 표현입니다."] },
      { heading: "예시와 반례를 개념에 연결하기", paragraphs: ["예시만 따로 적으면 시험이나 과제에서 적용하기 어렵습니다.", "예시가 어떤 개념을 보여주는지, 반례가 어떤 조건을 드러내는지 연결해야 합니다."] },
      { heading: "시험이나 과제에 쓸 포인트 표시하기", paragraphs: ["강의 영상 정리는 나중에 사용할 목적을 염두에 두어야 합니다.", "출제 가능 개념, 과제에 쓸 사례, 다시 설명해야 할 부분을 따로 표시하세요."] },
      { heading: "Brify로 개념 중심 노트 만들기", paragraphs: ["Brify에서는 핵심 개념을 중심에 두고 예시, 반례, 질문을 가지처럼 연결할 수 있습니다.", "이 구조는 단순 필기보다 복습과 설명에 훨씬 유리합니다."] },
    ],
    closing: "강의 노트는 많이 적는 것이 아니라 관계를 남기는 것입니다. Brify로 개념과 예시를 연결해 이해 가능한 노트를 만들어보세요.",
  },
  {
    slug: "youtube-transcript-summary-mistakes",
    title: "유튜브 자막을 요약할 때 생기는 흔한 문제",
    excerpt: "유튜브 자막 요약에서 자동 자막 오류, 화자 구분, 반복 표현, 문맥 누락이 왜 문제가 되는지 설명합니다.",
    seo_keywords: ["유튜브 자막 요약", "유튜브 스크립트 요약", "자막 요약 오류", "영상 자막 정리", ...commonKeywords],
    intro: "유튜브 자막은 영상 요약을 빠르게 시작하게 해주지만, 자막만으로 영상을 정확히 이해하기는 어렵습니다. 자동 자막과 말의 흐름에는 요약을 흔드는 요소가 많습니다.",
    sections: [
      { heading: "자막 요약이 편하지만 위험한 이유", paragraphs: ["자막은 영상 내용을 텍스트로 바꿔주기 때문에 요약하기 편합니다.", "하지만 영상의 표정, 화면 자료, 강조, 맥락은 자막에 충분히 담기지 않을 수 있습니다."] },
      { heading: "자동 자막 오류 확인하기", paragraphs: ["자동 자막은 고유명사, 외래어, 숫자, 전문 용어를 틀릴 수 있습니다.", "이런 오류가 핵심 키워드에 생기면 요약 전체의 의미가 달라질 수 있습니다."] },
      { heading: "반복 표현과 말버릇 제거하기", paragraphs: ["영상 자막에는 말버릇, 중복, 머뭇거림이 많이 들어갑니다.", "요약할 때는 반복 표현을 줄이고 실제 의미가 있는 문장만 남겨야 합니다."] },
      { heading: "화자와 맥락이 사라지는 문제", paragraphs: ["인터뷰나 토론 영상에서는 누가 말했는지가 중요합니다.", "화자 구분이 사라지면 의견과 반론이 뒤섞일 수 있습니다."] },
      { heading: "Brify로 자막 요약을 다시 구조화하기", paragraphs: ["Brify에서는 자막에서 뽑은 핵심 내용을 주장, 근거, 예시, 확인할 구간으로 나눌 수 있습니다.", "자막을 그대로 믿기보다 구조화해 검토하는 편이 안전합니다."] },
    ],
    closing: "유튜브 자막은 요약의 좋은 재료지만 완성본은 아닙니다. Brify에서 자막 요약을 다시 구조화해 정확도를 높여보세요.",
  },
  {
    slug: "find-important-parts-in-long-videos",
    title: "긴 영상에서 필요한 부분만 찾는 방법",
    excerpt: "긴 영상에서 필요한 부분만 찾기 위해 제목, 챕터, 자막, 반복 키워드, 질문 단서를 활용하는 방법을 설명합니다.",
    seo_keywords: ["긴 영상 요약", "유튜브 필요한 부분 찾기", "영상 핵심 구간", "긴 강의 요약", ...commonKeywords],
    intro: "긴 영상 전체를 다 볼 필요가 없는 경우도 많습니다. 중요한 것은 영상을 건너뛰는 것이 아니라, 내가 찾는 질문에 답하는 구간을 정확히 찾는 것입니다.",
    sections: [
      { heading: "전체를 다 보지 않아도 되는 경우", paragraphs: ["제품 리뷰, 강의, 인터뷰, 세미나 영상은 필요한 정보가 특정 구간에 몰려 있을 수 있습니다.", "목적이 분명하다면 전체 시청보다 필요한 구간 탐색이 더 효율적입니다."] },
      { heading: "먼저 찾을 질문을 정하기", paragraphs: ["긴 영상에서 가장 먼저 할 일은 검색할 질문을 정하는 것입니다.", "질문이 없으면 모든 내용이 중요해 보이고, 결국 시간을 많이 쓰게 됩니다."] },
      { heading: "챕터와 자막에서 단서 찾기", paragraphs: ["챕터, 설명란, 자막의 반복 키워드는 핵심 구간을 찾는 단서입니다.", "특정 단어가 반복되는 위치를 보면 관련 설명이 모여 있는 구간을 찾기 쉽습니다."] },
      { heading: "반복 키워드로 핵심 구간 표시하기", paragraphs: ["반복 키워드는 영상의 중심 주제를 보여줍니다.", "다만 반복된다고 모두 중요한 것은 아니므로 결론이나 예시와 연결되는지 확인해야 합니다."] },
      { heading: "Brify로 다시 볼 구간 남기기", paragraphs: ["Brify에 필요한 구간과 그 이유를 남겨두면 나중에 영상을 다시 찾기 쉽습니다.", "타임스탬프와 핵심 질문을 함께 기록하면 재시청 시간이 줄어듭니다."] },
    ],
    closing: "긴 영상에서 필요한 부분을 찾으려면 먼저 질문을 정해야 합니다. Brify로 핵심 구간과 이유를 함께 남겨보세요.",
  },
  {
    slug: "youtube-summary-tool-checklist",
    title: "유튜브 요약 도구를 고를 때 봐야 할 기준",
    excerpt: "유튜브 요약 도구를 고를 때 자막 처리, 긴 영상 지원, 원문 확인, 구조화, 편집, 공유 기능을 확인해야 하는 이유를 설명합니다.",
    seo_keywords: ["영상 요약 도구", "유튜브 요약 도구", "AI 영상 요약 도구", "강의 요약 도구", ...commonKeywords],
    intro: "유튜브 요약 도구는 많지만 좋은 도구의 기준은 단순히 요약문이 짧고 자연스러운지가 아닙니다. 실제로 다시 확인하고 수정하고 활용할 수 있어야 합니다.",
    sections: [
      { heading: "요약 문장만 보고 고르면 안 되는 이유", paragraphs: ["요약 문장이 자연스러워도 원래 영상의 핵심을 제대로 반영했는지는 별개의 문제입니다.", "도구를 고를 때는 결과의 문장보다 검토 가능한 구조를 봐야 합니다."] },
      { heading: "자막과 긴 영상 처리 확인하기", paragraphs: ["유튜브 요약 도구는 자막 품질에 크게 영향을 받습니다.", "긴 영상의 경우 구간 분리와 반복 정보 처리도 중요한 기준입니다."] },
      { heading: "원래 영상 흐름으로 돌아갈 수 있는가", paragraphs: ["요약 결과만 남으면 중요한 부분을 확인하기 어렵습니다.", "가능하면 원래 구간, 챕터, 자막으로 돌아갈 수 있는 흐름이 필요합니다."] },
      { heading: "편집과 공유가 가능한가", paragraphs: ["요약은 보통 초안입니다.", "공부 노트, 업무 참고, 회의 자료로 쓰려면 편집하고 공유할 수 있어야 합니다."] },
      { heading: "Brify가 영상 요약에 맞는 이유", paragraphs: ["Brify는 영상 내용을 한 문단으로 끝내기보다 구조맵으로 정리하는 흐름에 맞습니다.", "요약, 확인할 구간, 핵심 질문을 함께 남기기 좋습니다."] },
    ],
    closing: "유튜브 요약 도구는 짧은 결과보다 재사용 가능한 구조가 중요합니다. Brify로 영상 요약을 검토하고 활용 가능한 형태로 남겨보세요.",
  },
  {
    slug: "turn-lecture-videos-into-review-materials",
    title: "강의 영상을 복습 자료로 바꾸는 방법",
    excerpt: "강의 영상을 복습 자료로 바꾸기 위해 핵심 개념, 출제 가능 포인트, 질문, 예시, 체크리스트를 정리하는 방법을 설명합니다.",
    seo_keywords: ["강의 영상 복습", "강의 복습 자료", "온라인 강의 복습", "시험 공부 강의 정리", ...commonKeywords],
    intro: "강의 영상을 한 번 보는 것과 복습 자료로 만드는 것은 다릅니다. 복습 자료는 나중에 다시 봤을 때 스스로 설명하고 적용할 수 있게 도와야 합니다.",
    sections: [
      { heading: "복습 자료와 일반 요약의 차이", paragraphs: ["일반 요약은 내용을 빠르게 파악하는 데 목적이 있습니다.", "복습 자료는 기억을 되살리고 문제를 풀거나 설명할 수 있게 만드는 데 목적이 있습니다."] },
      { heading: "출제 가능 개념 표시하기", paragraphs: ["강의에서 반복되거나 강조되는 개념은 시험이나 과제에 연결될 가능성이 높습니다.", "정의, 비교, 절차, 조건을 따로 표시하면 복습 효율이 높아집니다."] },
      { heading: "설명할 수 없는 부분을 질문으로 남기기", paragraphs: ["복습에서 중요한 것은 모르는 부분을 숨기지 않는 것입니다.", "스스로 설명하기 어려운 개념은 질문으로 남겨 다음 학습의 출발점으로 삼아야 합니다."] },
      { heading: "예시를 체크리스트로 바꾸기", paragraphs: ["강의 속 예시는 문제 해결 절차로 바꿀 수 있습니다.", "예시를 단계별 체크리스트로 바꾸면 실제 적용 연습에 도움이 됩니다."] },
      { heading: "Brify로 복습 루틴 만들기", paragraphs: ["Brify에서는 개념, 질문, 예시, 체크리스트를 하나의 복습 맵으로 만들 수 있습니다.", "다음 복습 때는 맵을 보며 약한 부분부터 다시 확인하면 됩니다."] },
    ],
    closing: "강의 영상은 복습 구조로 바꿔야 오래 남습니다. Brify로 개념, 질문, 체크리스트를 연결해 반복 가능한 복습 자료를 만들어보세요.",
  },
  {
    slug: "make-youtube-videos-searchable",
    title: "유튜브 영상을 나중에 다시 찾기 쉽게 정리하는 법",
    excerpt: "유튜브 영상을 나중에 다시 찾기 쉽게 만들기 위해 핵심 질문, 키워드, 구간, 요약, 태그, 활용 목적을 정리하는 방법을 설명합니다.",
    seo_keywords: ["유튜브 내용 정리", "유튜브 저장 정리", "영상 지식관리", "유튜브 다시 찾기", ...commonKeywords],
    intro: "좋은 유튜브 영상을 저장해도 나중에 다시 찾지 못하면 지식으로 쌓이지 않습니다. 저장 목록이 길어질수록 필요한 내용을 찾기 쉬운 구조가 더 중요해집니다.",
    sections: [
      { heading: "저장한 유튜브 영상을 다시 못 찾는 이유", paragraphs: ["유튜브 저장 목록은 영상 제목과 썸네일 중심입니다.", "내가 왜 저장했는지, 어떤 내용이 중요했는지, 어느 구간을 다시 봐야 하는지는 잘 남지 않습니다."] },
      { heading: "영상별 핵심 질문 남기기", paragraphs: ["영상을 저장할 때 핵심 질문을 하나 남기면 나중에 찾기 쉬워집니다.", "예를 들어 '이 영상은 어떤 문제를 해결해주는가'를 적어두는 방식입니다."] },
      { heading: "키워드와 구간 정보를 함께 기록하기", paragraphs: ["키워드만 남기면 맥락이 부족하고, 구간만 남기면 검색이 어렵습니다.", "키워드, 타임스탬프, 짧은 설명을 함께 남기는 것이 좋습니다."] },
      { heading: "활용 목적별로 영상 정리하기", paragraphs: ["공부용, 업무 참고용, 아이디어용, 나중에 볼 자료를 구분하면 저장 목록이 덜 복잡해집니다.", "목적이 다르면 필요한 정리 방식도 달라집니다."] },
      { heading: "Brify로 검색 가능한 영상 지식맵 만들기", paragraphs: ["Brify에서는 영상들을 키워드, 질문, 활용 목적별로 구조화할 수 있습니다.", "여러 영상을 하나의 지식맵으로 연결하면 다시 찾고 비교하기 쉬워집니다."] },
    ],
    closing: "유튜브 영상은 많이 저장하는 것보다 다시 찾을 수 있게 남기는 것이 중요합니다. Brify로 영상 지식맵을 만들어보세요.",
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
