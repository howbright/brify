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
  "Brify 사용법",
  "구조맵 만드는 법",
  "Brify 튜토리얼",
  "자료 구조맵 만들기",
  "AI 구조맵 활용법",
  "자료 구조화",
  "AI 구조맵",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Brify에서 구조맵을 만들 때 기억할 점",
    `${post.title}에서 가장 중요한 것은 AI가 만든 결과를 최종 답으로 받는 것이 아닙니다. Brify는 긴 자료를 빠르게 구조화하는 출발점을 만들어주지만, 사용자는 그 구조가 내 목적에 맞는지 직접 확인해야 합니다.`,
    "자료를 넣은 뒤에는 큰 제목, 하위 노드, 근거, 예시, 확인할 부분을 차례로 보세요. 제목이 너무 넓으면 좁히고, 같은 의미의 노드는 합치고, 근거가 약한 결론은 표시해두는 것이 좋습니다.",
    "이 과정을 거치면 구조맵은 단순 요약 결과가 아니라 다시 읽고, 설명하고, 보고서나 회의에 옮길 수 있는 작업 자료가 됩니다.",
    "## 처음 쓰는 사람을 위한 체크리스트",
    `오늘 ${post.seo_keywords[0]}를 시작한다면 네 가지를 먼저 확인해보세요. 이 자료를 왜 정리하는가, 가장 중요한 질문은 무엇인가, AI 초안에서 근거와 결론이 분리되어 있는가, 나중에 어디에 다시 쓸 것인가.`,
    "이 네 가지가 정리되면 구조맵의 품질이 훨씬 안정됩니다. 완벽한 첫 결과보다 중요한 것은 내가 다시 검토할 수 있는 구조를 남기는 것입니다.",
    "## 자주 생기는 실수",
    "첫 번째 실수는 자료를 넣자마자 결과를 그대로 믿는 것입니다. AI는 빠르게 초안을 만들 수 있지만, 중요한 문맥을 놓치거나 자료의 한계를 충분히 표시하지 못할 수 있습니다.",
    "두 번째 실수는 노드를 많이 만드는 것을 좋은 구조라고 생각하는 것입니다. 좋은 구조맵은 노드 수가 많은 것이 아니라, 다시 봤을 때 질문과 근거와 다음 행동이 분명한 구조입니다.",
    "세 번째 실수는 만든 구조맵을 저장만 하고 끝내는 것입니다. 구조맵은 복습 질문, 보고서 목차, 회의 안건, 발표 흐름으로 다시 바꿀 때 가치가 커집니다.",
    "## 마무리",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    slug: "how-to-use-brify",
    title: "Brify 사용법: 처음 시작하는 사람을 위한 빠른 안내",
    excerpt:
      "Brify를 처음 사용할 때 자료를 넣고, AI 요약을 확인하고, 구조맵을 수정하고, 공부·보고서·회의에 재사용하는 기본 흐름을 설명합니다.",
    seo_keywords: ["Brify 사용법", "Brify 튜토리얼", "Brify 구조맵", "Brify 사용 방법", ...commonKeywords],
    intro:
      "Brify를 처음 열면 무엇을 먼저 넣어야 할지 막막할 수 있습니다. 논문, PDF, 유튜브 자막, 회의자료, 리포트처럼 정리할 수 있는 자료는 많지만, 처음부터 모든 기능을 다 쓰려고 하면 오히려 흐름이 복잡해집니다. Brify 사용법의 핵심은 긴 자료를 짧게 줄이는 것이 아니라, 다시 볼 수 있는 구조맵으로 바꾸는 것입니다.",
    sections: [
      {
        heading: "Brify는 어떤 상황에 쓰는 도구인가",
        paragraphs: [
          "Brify는 긴 자료를 읽고 핵심 흐름을 다시 잡아야 할 때 유용합니다. 논문을 읽고 문헌리뷰에 써야 하거나, PDF 보고서에서 핵심 근거를 뽑아야 하거나, 강의 영상 내용을 복습해야 하는 상황에 잘 맞습니다.",
          "단순히 한 문단 요약만 필요한 경우라면 일반 요약 도구로도 충분할 수 있습니다. 하지만 나중에 근거를 다시 확인하고, 목차나 발표 흐름으로 바꾸고, 다른 자료와 비교하려면 구조맵이 더 도움이 됩니다.",
        ],
      },
      {
        heading: "처음에는 어떤 자료를 넣으면 좋을까",
        paragraphs: [
          "처음에는 너무 큰 자료보다 지금 당장 읽어야 하는 자료 하나를 고르는 것이 좋습니다. 논문 한 편, PDF 한 개, 회의자료 한 묶음, 유튜브 강의 하나처럼 범위를 작게 잡아야 결과를 검토하기 쉽습니다.",
          "자료를 넣기 전에는 목적을 한 문장으로 적어보세요. 예를 들어 '이 논문을 문헌리뷰에 쓸 수 있는지 확인한다' 또는 '이 회의자료에서 결정할 안건을 찾는다'처럼 목적이 있으면 구조맵을 볼 기준이 생깁니다.",
        ],
      },
      {
        heading: "AI가 만든 초안을 그대로 믿지 않는 법",
        paragraphs: [
          "Brify의 AI 초안은 시작점입니다. 큰 주제와 하위 내용을 빠르게 보여주지만, 모든 결론이 완벽하게 검증된 것은 아닙니다.",
          "초안을 볼 때는 결론만 보지 말고 근거가 함께 보이는지 확인해야 합니다. 중요한 주장인데 근거가 약하거나, 원문에서 다시 확인해야 할 부분이 있다면 표시해두는 것이 좋습니다.",
        ],
      },
      {
        heading: "구조맵에서 꼭 확인해야 할 것",
        paragraphs: [
          "좋은 구조맵은 핵심 질문, 큰 주제, 하위 근거, 예시, 한계가 구분되어 있습니다. 모든 내용이 같은 깊이에 놓여 있으면 다시 읽을 때 오히려 헷갈릴 수 있습니다.",
          "노드 이름도 중요합니다. AI가 만든 긴 문장을 그대로 두기보다 '핵심 주장', '근거 데이터', '반론', '추가 확인'처럼 역할이 보이는 이름으로 바꾸면 나중에 다시 쓰기 쉽습니다.",
        ],
      },
      {
        heading: "Brify 결과를 공부, 보고서, 회의에 다시 쓰기",
        paragraphs: [
          "Brify에서 만든 구조맵은 저장해두는 데서 끝나지 않습니다. 공부할 때는 복습 질문으로, 보고서를 쓸 때는 목차와 근거 목록으로, 회의를 준비할 때는 안건과 쟁점으로 바꿀 수 있습니다.",
          "처음에는 완벽한 구조를 만들려고 하기보다 하나의 자료를 구조맵으로 바꾸고, 그 구조를 다음 작업에 다시 써보는 것이 좋습니다.",
        ],
      },
    ],
    closing:
      "Brify 사용법은 어렵게 시작할 필요가 없습니다. 지금 읽어야 하는 논문이나 PDF 하나를 넣고, AI 초안을 확인한 뒤, 내 목적에 맞게 구조를 고쳐보세요.",
  },
  {
    slug: "how-to-make-a-structure-map",
    title: "구조맵 만드는 법: 긴 자료를 한눈에 보이게 정리하는 순서",
    excerpt:
      "구조맵을 만들 때 핵심 질문, 주장, 근거, 예시, 한계, 다음 행동을 어떤 순서로 나누면 좋은지 설명합니다.",
    seo_keywords: ["구조맵 만드는 법", "자료 구조화 방법", "구조맵 작성법", "텍스트 구조맵", ...commonKeywords],
    intro:
      "구조맵을 만든다고 하면 많은 사람이 마인드맵처럼 가지를 많이 뻗는 장면을 떠올립니다. 하지만 구조맵의 목적은 예쁜 그림을 만드는 것이 아니라, 긴 자료의 질문과 주장과 근거를 다시 보이게 만드는 것입니다. 구조맵 만드는 법을 알면 논문, 보고서, 회의자료, 강의 노트처럼 긴 자료를 더 안정적으로 정리할 수 있습니다.",
    sections: [
      {
        heading: "구조맵은 마인드맵과 무엇이 다를까",
        paragraphs: [
          "마인드맵은 중심 키워드에서 관련 아이디어를 펼치는 데 강합니다. 브레인스토밍이나 아이디어 확장에는 좋은 방식입니다.",
          "반면 구조맵은 이미 있는 자료를 이해 가능한 관계로 다시 배열하는 데 초점이 있습니다. 중심 키워드보다 중심 질문, 주장, 근거, 예시, 한계의 관계가 더 중요합니다.",
        ],
      },
      {
        heading: "먼저 핵심 질문을 찾기",
        paragraphs: [
          "구조맵을 만들 때 가장 먼저 할 일은 자료가 답하려는 질문을 찾는 것입니다. '이 논문은 무엇을 증명하려는가', '이 보고서는 어떤 결정을 돕는가', '이 회의자료는 무엇을 결정하려는가'처럼 질문을 세워야 합니다.",
          "핵심 질문이 없으면 모든 문장이 중요해 보입니다. 질문이 있으면 어떤 내용이 중심이고 어떤 내용이 배경인지 구분할 수 있습니다.",
        ],
      },
      {
        heading: "주장, 근거, 예시를 분리하기",
        paragraphs: [
          "긴 자료를 구조화할 때는 주장과 근거를 분리해야 합니다. 결론 문장만 남기면 나중에 왜 그런 결론이 나왔는지 확인하기 어렵습니다.",
          "근거 데이터, 사례, 인용, 설명은 각각 다른 역할을 합니다. 구조맵에서는 이 역할을 나누어두어야 나중에 보고서나 발표로 옮길 때 더 안전합니다.",
        ],
      },
      {
        heading: "한계와 확인할 부분을 따로 두기",
        paragraphs: [
          "좋은 구조맵은 확실한 내용만 담는 것이 아닙니다. 애매한 부분, 추가로 확인해야 할 부분, 원문 검토가 필요한 부분도 따로 표시해야 합니다.",
          "이렇게 하면 AI가 만든 초안이나 내가 만든 요약을 과하게 믿는 일을 줄일 수 있습니다. 구조맵은 이해를 돕는 동시에 검토를 돕는 도구여야 합니다.",
        ],
      },
      {
        heading: "Brify로 구조맵 초안 만들기",
        paragraphs: [
          "수작업으로 구조맵을 만들 수도 있지만, 자료가 길면 첫 분류를 만드는 데 시간이 많이 걸립니다. Brify에서는 긴 자료를 넣고 핵심 질문, 큰 주제, 근거, 확인할 부분을 구조맵 초안으로 빠르게 볼 수 있습니다.",
          "그다음 사용자가 목적에 맞게 노드 이름을 고치고, 빠진 근거를 추가하고, 불필요한 가지를 정리하면 더 좋은 구조가 됩니다.",
        ],
      },
    ],
    closing:
      "구조맵 만드는 법의 핵심은 많은 가지가 아니라 관계를 남기는 것입니다. Brify에서 긴 자료를 질문, 주장, 근거, 한계가 보이는 구조로 다시 나눠보세요.",
  },
  {
    slug: "make-first-structure-map-in-brify",
    title: "Brify에서 첫 구조맵을 만드는 실전 튜토리얼",
    excerpt:
      "Brify에서 처음 구조맵을 만들 때 자료 선택, 입력, AI 초안 확인, 노드 수정, 제목 정리, 재사용까지의 흐름을 소개합니다.",
    seo_keywords: ["Brify 구조맵 만들기", "Brify 첫 사용", "Brify 자료 넣기", "AI 구조맵 만들기", ...commonKeywords],
    intro:
      "Brify에서 첫 구조맵을 만들 때 가장 흔한 부담은 '어떤 자료를 넣어야 하지'와 '결과가 맞는지 어떻게 보지'입니다. 첫 구조맵은 완벽한 결과물을 만드는 과정이 아니라, 자료의 큰 흐름을 보고 내가 고칠 수 있는 구조를 만드는 연습입니다. 작은 자료 하나와 목적 한 문장만 있어도 충분히 시작할 수 있습니다.",
    sections: [
      {
        heading: "첫 자료는 너무 어렵지 않은 것으로 고르기",
        paragraphs: [
          "첫 사용에는 너무 긴 책 한 권이나 여러 개의 PDF를 한꺼번에 넣는 것보다 범위가 분명한 자료 하나가 좋습니다. 논문 한 편, 강의 자막 하나, 회의자료 한 개처럼 시작과 끝이 보이는 자료를 고르세요.",
          "자료가 작으면 AI 초안을 검토하기도 쉽고, Brify가 어떤 방식으로 구조를 만드는지 빠르게 감을 잡을 수 있습니다.",
        ],
      },
      {
        heading: "자료를 넣기 전에 목적을 한 문장으로 적기",
        paragraphs: [
          "자료를 넣기 전에 목적을 한 문장으로 적어보세요. 예를 들어 '이 PDF에서 보고서에 쓸 핵심 근거를 찾는다' 또는 '이 강의에서 시험 복습 질문을 만든다'처럼 쓰면 됩니다.",
          "목적이 있으면 구조맵을 볼 때 중요한 노드와 덜 중요한 노드를 구분하기 쉬워집니다. 같은 자료라도 공부용, 보고서용, 회의용 구조는 달라질 수 있습니다.",
        ],
      },
      {
        heading: "AI 초안에서 먼저 볼 부분",
        paragraphs: [
          "Brify가 구조맵 초안을 만들면 먼저 큰 제목과 주요 섹션을 보세요. 자료의 전체 흐름이 맞게 잡혔는지 확인하는 것이 첫 단계입니다.",
          "그다음 결론과 근거가 분리되어 있는지, 중요한 예시가 빠지지 않았는지, 다시 확인해야 할 부분이 있는지 봅니다. 처음부터 모든 문장을 고치려고 하기보다 큰 구조부터 보는 것이 좋습니다.",
        ],
      },
      {
        heading: "노드 이름을 내 작업 목적에 맞게 고치기",
        paragraphs: [
          "AI가 만든 노드 이름은 원문 표현에 가깝거나 너무 길 수 있습니다. 이때 노드 이름을 내 작업 목적에 맞게 바꾸면 구조맵이 훨씬 쓰기 쉬워집니다.",
          "예를 들어 '연구 결과에 대한 논의'보다 '핵심 결과', '한계', '내 보고서에 쓸 근거'처럼 역할이 보이는 이름이 좋습니다.",
        ],
      },
      {
        heading: "완성보다 다음 사용에 남길 구조 만들기",
        paragraphs: [
          "첫 구조맵의 목표는 완성도가 아니라 재사용성입니다. 나중에 다시 봤을 때 핵심 질문, 결론, 근거, 확인할 부분을 빠르게 찾을 수 있으면 충분히 좋은 시작입니다.",
          "구조맵을 만든 뒤에는 복습 질문, 보고서 목차, 회의 안건처럼 다음 작업으로 한 번 바꿔보세요. 그때 구조맵의 가치가 더 분명해집니다.",
        ],
      },
    ],
    closing:
      "Brify에서 첫 구조맵을 만들 때는 자료 하나와 목적 한 문장만 준비해도 됩니다. 작은 자료부터 넣고, AI 초안을 내 작업 흐름에 맞게 고쳐보세요.",
  },
  {
    slug: "clean-up-complex-structure-map",
    title: "구조맵이 너무 복잡할 때 정리하는 방법",
    excerpt:
      "구조맵이 너무 복잡할 때 중복 노드, 너무 긴 제목, 근거 없는 주장, 목적과 맞지 않는 가지를 정리하는 방법을 설명합니다.",
    seo_keywords: ["구조맵 정리", "구조맵 수정", "AI 구조맵 편집", "자료 구조화 정리", ...commonKeywords],
    intro:
      "AI가 만든 구조맵이나 직접 만든 구조맵이 너무 복잡해 보일 때가 있습니다. 노드는 많은데 무엇이 중요한지 모르겠고, 제목은 길고, 비슷한 가지가 반복되면 구조맵도 또 하나의 긴 문서처럼 느껴집니다. 구조맵 정리는 예쁘게 다듬는 일이 아니라 다시 쓸 수 있게 만드는 과정입니다.",
    sections: [
      {
        heading: "구조맵이 복잡해지는 이유",
        paragraphs: [
          "구조맵이 복잡해지는 가장 흔한 이유는 원문의 모든 내용을 비슷한 깊이로 옮기기 때문입니다. 중요한 결론, 배경 설명, 예시, 세부 조건이 같은 수준에 놓이면 흐름이 흐려집니다.",
          "AI 초안에서도 이런 일이 생길 수 있습니다. AI는 빠르게 많은 정보를 뽑아낼 수 있지만, 사용자의 목적에 맞게 우선순위를 정하는 일은 추가 검토가 필요합니다.",
        ],
      },
      {
        heading: "중복 노드와 비슷한 표현 합치기",
        paragraphs: [
          "먼저 비슷한 뜻의 노드를 찾아 합치세요. 같은 주제를 다른 표현으로 반복하고 있다면 하나의 노드로 묶고, 필요한 세부 내용만 아래에 남기는 것이 좋습니다.",
          "중복을 줄이면 구조맵의 전체 크기가 줄어들고, 핵심 흐름이 더 잘 보입니다. 삭제보다 병합을 먼저 해보는 것이 안전합니다.",
        ],
      },
      {
        heading: "긴 문장 제목을 짧은 역할 이름으로 바꾸기",
        paragraphs: [
          "노드 제목이 너무 길면 구조맵을 한눈에 보기 어렵습니다. 긴 문장을 그대로 제목으로 쓰기보다 그 노드의 역할을 짧게 붙여보세요.",
          "예를 들어 '사용자들이 기능을 이해하지 못해서 첫 사용에서 이탈하는 문제'는 '첫 사용 이탈 원인'처럼 바꿀 수 있습니다. 세부 설명은 노드 안에 남겨도 됩니다.",
        ],
      },
      {
        heading: "근거 없는 주장과 확인할 부분 표시하기",
        paragraphs: [
          "구조맵 안에 결론은 있지만 근거가 보이지 않는 노드가 있다면 바로 삭제하기보다 '확인 필요'로 표시하세요. 나중에 원문을 다시 보며 근거를 찾을 수 있습니다.",
          "특히 AI가 만든 초안에서는 그럴듯한 요약처럼 보이지만 원문 근거가 약한 경우가 있을 수 있습니다. 구조맵은 이런 부분을 눈에 띄게 만드는 데 써야 합니다.",
        ],
      },
      {
        heading: "Brify에서 구조맵을 다시 다듬는 루틴",
        paragraphs: [
          "Brify에서 구조맵을 다듬을 때는 중복 노드 확인, 긴 제목 줄이기, 근거 없는 주장 표시, 목적과 맞지 않는 가지 정리 순서로 보면 좋습니다.",
          "이 루틴을 거치면 구조맵은 더 짧아지지만 정보가 빈약해지는 것이 아니라, 오히려 다시 사용할 수 있는 구조로 가까워집니다.",
        ],
      },
    ],
    closing:
      "구조맵이 복잡해 보인다면 실패한 결과가 아닙니다. Brify에서 중복, 긴 제목, 근거 없는 주장, 확인할 부분을 차례로 정리해 더 쓸모 있는 구조로 바꿔보세요.",
  },
  {
    slug: "reuse-brify-structure-map",
    title: "Brify 구조맵을 공부·보고서·회의에 다시 쓰는 법",
    excerpt:
      "Brify 구조맵을 공부 복습, 보고서 목차, 발표 흐름, 회의 안건, 액션아이템으로 다시 활용하는 방법을 설명합니다.",
    seo_keywords: ["Brify 구조맵 활용법", "구조맵 활용", "자료 정리 재사용", "AI 구조맵 활용", ...commonKeywords],
    intro:
      "구조맵은 만들 때보다 다시 쓸 때 가치가 커집니다. Brify에서 만든 구조맵을 저장만 해두면 아쉽습니다. 공부할 때는 복습 질문으로, 보고서를 쓸 때는 목차와 근거 목록으로, 회의에서는 안건과 액션아이템으로 바꿀 수 있기 때문입니다.",
    sections: [
      {
        heading: "구조맵을 저장만 하면 아쉬운 이유",
        paragraphs: [
          "많은 정리 도구가 결과를 만드는 순간에는 만족감을 주지만, 시간이 지나면 다시 열어보지 않는 자료가 됩니다. 구조맵도 마찬가지입니다.",
          "처음 만든 구조를 다음 작업의 출발점으로 쓰지 않으면 정리 시간은 쌓이지만 실제 성과로 이어지기 어렵습니다.",
        ],
      },
      {
        heading: "공부할 때 복습 질문으로 바꾸기",
        paragraphs: [
          "논문이나 강의 자료를 Brify 구조맵으로 만들었다면 각 큰 노드를 복습 질문으로 바꿔보세요. '핵심 개념'은 '이 개념은 무엇인가', '근거'는 '이 결론을 뒷받침하는 자료는 무엇인가'처럼 바꿀 수 있습니다.",
          "이렇게 하면 구조맵이 단순 요약이 아니라 시험, 발표, 연구 미팅을 준비하는 질문 목록이 됩니다.",
        ],
      },
      {
        heading: "보고서나 발표 목차로 바꾸기",
        paragraphs: [
          "보고서나 발표를 만들 때는 구조맵의 큰 흐름을 목차로 바꿀 수 있습니다. 핵심 질문, 배경, 결론, 근거, 한계, 제안 순서로 정리하면 초안 작성이 훨씬 쉬워집니다.",
          "중요한 것은 구조맵을 그대로 복사하는 것이 아니라, 청중이나 독자가 이해하기 좋은 순서로 다시 배열하는 것입니다.",
        ],
      },
      {
        heading: "회의 안건과 액션아이템으로 바꾸기",
        paragraphs: [
          "실무 자료를 구조맵으로 만들었다면 회의 안건으로도 다시 쓸 수 있습니다. 결정해야 할 것, 논의할 쟁점, 추가로 확인할 자료, 담당자와 기한을 분리하면 회의 준비가 빨라집니다.",
          "회의 후에는 구조맵을 업데이트해 결정사항과 액션아이템을 남겨두세요. 그러면 같은 자료를 다음 회의에서도 이어서 사용할 수 있습니다.",
        ],
      },
      {
        heading: "Brify 구조맵을 계속 업데이트하는 습관",
        paragraphs: [
          "구조맵은 한 번에 완성되는 문서가 아니라 계속 업데이트되는 작업 자료로 보는 것이 좋습니다. 새 자료를 읽거나 회의에서 결정이 생기면 기존 구조에 추가하세요.",
          "이 습관이 생기면 Brify는 단순 요약 도구가 아니라 자료를 축적하고 다시 사용하는 작업 공간이 됩니다.",
        ],
      },
    ],
    closing:
      "Brify 구조맵 활용법의 핵심은 저장이 아니라 재사용입니다. 만든 구조맵을 복습 질문, 보고서 목차, 회의 안건으로 바꿔 다음 작업의 출발점으로 써보세요.",
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
